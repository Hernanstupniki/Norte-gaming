import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentStatusDto,
} from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        provider: dto.provider,
        method: dto.method,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'ARS',
        externalReference: dto.externalReference,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listMy(userId: string) {
    return this.prisma.payment.findMany({
      where: { order: { userId } },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAdmin() {
    return this.prisma.payment.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdatePaymentStatusDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Pago no encontrado');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: dto.status,
        transactionId: dto.transactionId,
        externalReference: dto.externalReference,
      },
    });

    if (
      dto.status === PaymentStatus.APPROVED &&
      payment.order.status === OrderStatus.PENDING
    ) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAID },
      });
    }

    if (
      dto.status === PaymentStatus.REJECTED &&
      payment.order.status === OrderStatus.PENDING
    ) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.CANCELED, canceledAt: new Date() },
      });
    }

    return updated;
  }
}
