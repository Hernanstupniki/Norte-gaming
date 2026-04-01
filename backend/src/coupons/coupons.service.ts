import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Coupon, DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublic() {
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderAmount: true,
        maxDiscount: true,
        expiresAt: true,
      },
    });
  }

  listAdmin() {
    return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(dto: CreateCouponDto) {
    return this.prisma.coupon.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: new Prisma.Decimal(dto.discountValue),
        minOrderAmount:
          dto.minOrderAmount !== undefined
            ? new Prisma.Decimal(dto.minOrderAmount)
            : null,
        maxDiscount:
          dto.maxDiscount !== undefined
            ? new Prisma.Decimal(dto.maxDiscount)
            : null,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateCouponDto) {
    const found = await this.prisma.coupon.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Cupón no encontrado');
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code?.trim().toUpperCase(),
        name: dto.name,
        description: dto.description,
        discountType: dto.discountType,
        discountValue:
          dto.discountValue !== undefined
            ? new Prisma.Decimal(dto.discountValue)
            : undefined,
        minOrderAmount:
          dto.minOrderAmount !== undefined
            ? new Prisma.Decimal(dto.minOrderAmount)
            : undefined,
        maxDiscount:
          dto.maxDiscount !== undefined
            ? new Prisma.Decimal(dto.maxDiscount)
            : undefined,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.coupon.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Cupón no encontrado');
    }
    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCouponForOrder(code: string, userId: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
      },
    });

    if (!coupon) {
      throw new BadRequestException('Cupón inválido');
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      throw new BadRequestException('Cupón expirado');
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      throw new BadRequestException('Cupón sin usos disponibles');
    }

    if (
      coupon.minOrderAmount !== null &&
      subtotal < Number(coupon.minOrderAmount)
    ) {
      throw new BadRequestException(
        'No se alcanza el mínimo para usar el cupón',
      );
    }

    if (coupon.maxUsesPerUser !== null) {
      const perUser = await this.prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (perUser >= coupon.maxUsesPerUser) {
        throw new BadRequestException(
          'Ya alcanzaste el límite de uso de este cupón',
        );
      }
    }

    const discount = this.calculateDiscount(coupon, subtotal);
    return { coupon, discount };
  }

  calculateDiscount(coupon: Coupon, subtotal: number) {
    let discount = 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }

    if (coupon.maxDiscount !== null && discount > Number(coupon.maxDiscount)) {
      discount = Number(coupon.maxDiscount);
    }

    if (discount > subtotal) {
      discount = subtotal;
    }

    return Number(discount.toFixed(2));
  }

  async registerUsage(couponId: string, userId: string, orderId: string) {
    await this.prisma.$transaction([
      this.prisma.couponUsage.create({
        data: {
          couponId,
          userId,
          orderId,
        },
      }),
      this.prisma.coupon.update({
        where: { id: couponId },
        data: { currentUses: { increment: 1 } },
      }),
    ]);
  }
}
