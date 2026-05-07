import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  MercadoPagoConfig,
  Payment as MercadoPagoPaymentClient,
  Preference,
} from 'mercadopago';
import {
  CreatePaymentDto,
  CreatePaymentResponseDto,
  UpdatePaymentStatusDto,
} from './dto/create-payment.dto';

type MercadoPagoWebhookPayload = {
  type?: string;
  action?: string;
  data?: {
    id?: string | number;
  };
  id?: string | number;
};

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  private getMercadoPagoAccessToken() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      throw new Error('MERCADO_PAGO_ACCESS_TOKEN no está configurado');
    }
    return accessToken;
  }

  private getFrontendUrl() {
    return process.env.FRONTEND_URL?.trim() || 'http://localhost:3000';
  }

  private getBackendUrl() {
    return process.env.BACKEND_URL?.trim() || 'http://localhost:4000';
  }

  private getMercadoPagoConfig() {
    return new MercadoPagoConfig({ accessToken: this.getMercadoPagoAccessToken() });
  }

  private isMercadoPagoProvider(provider: string) {
    return provider.trim().toLowerCase() === 'mercado pago';
  }

  private mapMercadoPagoStatus(status?: string): PaymentStatus {
    switch ((status || '').toLowerCase()) {
      case 'approved':
        return PaymentStatus.APPROVED;
      case 'rejected':
      case 'cancelled':
        return PaymentStatus.REJECTED;
      case 'refunded':
      case 'charged_back':
        return PaymentStatus.REFUNDED;
      case 'pending':
      case 'in_process':
      case 'authorized':
      default:
        return PaymentStatus.PENDING;
    }
  }

  private extractWebhookPaymentId(payload: MercadoPagoWebhookPayload) {
    const dataId = payload.data?.id;
    if (typeof dataId === 'string' || typeof dataId === 'number') {
      return String(dataId);
    }

    if (typeof payload.id === 'string' || typeof payload.id === 'number') {
      return String(payload.id);
    }

    return null;
  }

  async create(dto: CreatePaymentDto): Promise<CreatePaymentResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        address: true,
        shippingMethod: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        provider: dto.provider,
        method: dto.method,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency ?? 'ARS',
        externalReference: dto.externalReference ?? order.orderNumber,
        metadata: {
          ...(dto.metadata ?? {}),
          orderNumber: order.orderNumber,
          orderId: order.id,
        } as Prisma.InputJsonValue,
      },
    });

    if (!this.isMercadoPagoProvider(dto.provider)) {
      return {
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        externalReference: payment.externalReference,
        message: 'Pago registrado para confirmación manual',
      };
    }

    try {
      const mpPreference = await new Preference(this.getMercadoPagoConfig()).create({
        body: {
          external_reference: order.orderNumber,
          notification_url: `${this.getBackendUrl()}/api/payments/mercadopago/webhook`,
          back_urls: {
            success: `${this.getFrontendUrl()}/checkout/resultado?status=success&order=${order.orderNumber}`,
            pending: `${this.getFrontendUrl()}/checkout/resultado?status=pending&order=${order.orderNumber}`,
            failure: `${this.getFrontendUrl()}/checkout/resultado?status=failure&order=${order.orderNumber}`,
          },
          auto_return: 'approved',
          binary_mode: false,
          statement_descriptor: 'NORTE GAMING',
          payer: {
            email: order.user.email,
            name: order.user.firstName,
            surname: order.user.lastName,
          },
          items: [
            {
              id: order.orderNumber,
              title: `Pedido ${order.orderNumber}`,
              description: order.items.map((item) => item.productName).join(', '),
              quantity: 1,
              unit_price: Number(order.total),
              currency_id: 'ARS',
            },
          ],
          metadata: {
            paymentId: payment.id,
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
        },
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalReference: mpPreference.external_reference ?? payment.externalReference,
          metadata: {
            ...(dto.metadata ?? {}),
            orderNumber: order.orderNumber,
            orderId: order.id,
            preferenceId: mpPreference.id,
            initPoint: mpPreference.init_point,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        externalReference: payment.externalReference,
        preferenceId: mpPreference.id ?? null,
        initPoint: mpPreference.init_point ?? null,
        message: 'Redirigiendo a Mercado Pago',
      };
    } catch (error) {
      console.error('Error creating Mercado Pago preference:', error);
      const errAny = error as any;
      const statusCode =
        (errAny && (errAny.status || (errAny.response && errAny.response.status))) ?? null;
      let errorMessage =
        errAny && typeof errAny === 'object' && 'message' in errAny
          ? errAny.message
          : 'error desconocido';

      if (statusCode === 401) {
        errorMessage = 'MERCADO_PAGO 401 Unauthorized - verifica MERCADO_PAGO_ACCESS_TOKEN en producción';
      } else if (statusCode) {
        errorMessage = `MERCADO_PAGO ${statusCode} - ${errorMessage}`;
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        provider: payment.provider,
        method: payment.method,
        status: payment.status,
        externalReference: payment.externalReference,
        message: `La orden quedó creada, pero no se pudo generar el enlace de Mercado Pago: ${errorMessage}`,
      };
    }
  }

  async handleMercadoPagoWebhook(payload: MercadoPagoWebhookPayload) {
    const mpPaymentId = this.extractWebhookPaymentId(payload);
    if (!mpPaymentId) {
      return { ok: true };
    }

    const mpClient = new MercadoPagoPaymentClient(this.getMercadoPagoConfig());
    const mpPayment = await mpClient.get({ id: mpPaymentId });
    const orderNumber = mpPayment.external_reference;

    if (!orderNumber) {
      return { ok: true };
    }

    const localPayment = await this.prisma.payment.findFirst({
      where: { externalReference: orderNumber },
      include: { order: true },
    });

    if (!localPayment) {
      return { ok: true };
    }

    const status = this.mapMercadoPagoStatus(mpPayment.status);
    const updatedPayment = await this.prisma.payment.update({
      where: { id: localPayment.id },
      data: {
        status,
        transactionId: String(mpPayment.id),
        externalReference: orderNumber,
        metadata: {
          ...(localPayment.metadata && typeof localPayment.metadata === 'object'
            ? (localPayment.metadata as Record<string, unknown>)
            : {}),
          mercadoPago: {
            id: mpPayment.id,
            status: mpPayment.status,
            externalReference: mpPayment.external_reference,
            statusDetail: mpPayment.status_detail,
          },
        } as Prisma.InputJsonValue,
      },
    });

    if (status === PaymentStatus.APPROVED && localPayment.order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: localPayment.orderId },
        data: { status: OrderStatus.PAID },
      });
    }

    if (status === PaymentStatus.REJECTED && localPayment.order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: localPayment.orderId },
        data: { status: OrderStatus.CANCELED, canceledAt: new Date() },
      });
    }

    return updatedPayment;
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
