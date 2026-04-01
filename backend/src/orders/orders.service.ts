import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { generateOrderNumber } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId, deletedAt: null },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    const shippingMethod = await this.prisma.shippingMethod.findFirst({
      where: { id: dto.shippingMethodId, isActive: true },
    });
    if (!shippingMethod) {
      throw new NotFoundException('Método de envío no disponible');
    }

    for (const item of cart.items) {
      if (!item.product.isActive || item.product.deletedAt) {
        throw new BadRequestException(
          `Producto no disponible: ${item.product.name}`,
        );
      }
      if (item.quantity > item.product.stock) {
        throw new BadRequestException(
          `Stock insuficiente para ${item.product.name}`,
        );
      }
    }

    const subtotal = Number(
      cart.items
        .reduce(
          (acc, item) =>
            acc + Number(item.product.currentPrice) * item.quantity,
          0,
        )
        .toFixed(2),
    );

    let couponId: string | null = null;
    let discountTotal = 0;

    if (dto.couponCode) {
      const { coupon, discount } =
        await this.couponsService.validateCouponForOrder(
          dto.couponCode,
          userId,
          subtotal,
        );
      couponId = coupon.id;
      discountTotal = discount;
    }

    const shippingCost = Number(shippingMethod.cost);
    const total = Number((subtotal - discountTotal + shippingCost).toFixed(2));

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId: address.id,
          shippingMethodId: shippingMethod.id,
          couponId,
          subtotal: new Prisma.Decimal(subtotal),
          discountTotal: new Prisma.Decimal(discountTotal),
          shippingCost: new Prisma.Decimal(shippingCost),
          total: new Prisma.Decimal(total),
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              quantity: item.quantity,
              unitPrice: item.product.currentPrice,
              totalPrice: new Prisma.Decimal(
                Number(item.product.currentPrice) * item.quantity,
              ),
            })),
          },
        },
        include: {
          items: true,
          payments: true,
          address: true,
          shippingMethod: true,
          coupon: true,
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    if (couponId) {
      await this.couponsService.registerUsage(couponId, userId, order.id);
    }

    return order;
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: true,
        address: true,
        shippingMethod: true,
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payments: true,
        address: true,
        shippingMethod: true,
        coupon: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async listAdmin() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: true,
        payments: true,
        address: true,
        shippingMethod: true,
        coupon: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const found = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!found) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        trackingCode: dto.trackingCode,
        logisticStatus: dto.logisticStatus,
        canceledAt: dto.status === OrderStatus.CANCELED ? new Date() : null,
      },
    });
  }
}
