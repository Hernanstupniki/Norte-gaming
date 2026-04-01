import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });
  }

  listAllAdmin() {
    return this.prisma.shippingMethod.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateShippingMethodDto) {
    return this.prisma.shippingMethod.create({
      data: {
        name: dto.name,
        description: dto.description,
        cost: new Prisma.Decimal(dto.cost),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateShippingMethodDto) {
    const found = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });
    if (!found) {
      throw new NotFoundException('Método de envío no encontrado');
    }

    return this.prisma.shippingMethod.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        cost: dto.cost !== undefined ? new Prisma.Decimal(dto.cost) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.shippingMethod.findUnique({
      where: { id },
    });
    if (!found) {
      throw new NotFoundException('Método de envío no encontrado');
    }

    return this.prisma.shippingMethod.delete({ where: { id } });
  }
}
