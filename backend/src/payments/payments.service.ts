import * as crypto from 'crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import nodemailer from 'nodemailer';
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

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

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
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private buildTransporter() {
    return nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(this.config.get<string>('SMTP_PORT') || '587'),
      secure: this.config.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  private async sendAdminOrderNotification(order: any, paymentMethod: string, user: { firstName: string; lastName: string; email: string }) {
    const receiver = this.config.get<string>('CONTACT_RECEIVER_EMAIL');
    const smtpUser = this.config.get<string>('SMTP_USER');
    if (!receiver || !smtpUser) return;

    const itemsHtml = order.items
      .map((item: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${item.productName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${formatARS(Number(item.unitPrice))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold">${formatARS(Number(item.totalPrice))}</td>
        </tr>`)
      .join('');

    const addr = order.address;
    const addressStr = `${addr.street} ${addr.number}${addr.floor ? `, piso ${addr.floor}` : ''}${addr.apartment ? ` dpto ${addr.apartment}` : ''}, ${addr.city}, ${addr.province} (CP ${addr.postalCode})`;

    const isTransfer = paymentMethod.toLowerCase().includes('transferencia');
    const paymentBadge = isTransfer
      ? `<span style="background:#fef3c7;color:#92400e;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:bold">💸 ${paymentMethod} — pendiente de acreditación</span>`
      : `<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:bold">✅ ${paymentMethod}</span>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
        <div style="background:#111;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">🛒 Nuevo pedido — Norte Gaming</h1>
          <p style="color:#aaa;margin:6px 0 0;font-size:14px">Orden <strong style="color:#fff">${order.orderNumber}</strong></p>
        </div>
        <div style="background:#fafafa;padding:24px 32px;border:1px solid #eee;border-top:none">

          <div style="margin-bottom:20px">
            <p style="margin:0 0 6px;font-size:13px;color:#888">Método de pago</p>
            ${paymentBadge}
          </div>

          <h2 style="font-size:15px;margin:0 0 12px;color:#333">👤 Cliente</h2>
          <table style="width:100%;font-size:14px;margin-bottom:24px">
            <tr><td style="color:#888;padding:3px 0;width:130px">Nombre</td><td><strong>${user.firstName} ${user.lastName}</strong></td></tr>
            <tr><td style="color:#888;padding:3px 0">Email</td><td>${user.email}</td></tr>
            <tr><td style="color:#888;padding:3px 0">Teléfono</td><td>${addr.phone || '—'}</td></tr>
            <tr><td style="color:#888;padding:3px 0">Dirección</td><td>${addressStr}</td></tr>
            ${order.notes ? `<tr><td style="color:#888;padding:3px 0">Notas</td><td>${order.notes}</td></tr>` : ''}
          </table>

          <h2 style="font-size:15px;margin:0 0 12px;color:#333">📦 Productos</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
            <thead><tr style="background:#f0f0f0">
              <th style="padding:8px 12px;text-align:left">Producto</th>
              <th style="padding:8px 12px;text-align:center">Cant.</th>
              <th style="padding:8px 12px;text-align:right">Precio u.</th>
              <th style="padding:8px 12px;text-align:right">Subtotal</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <h2 style="font-size:15px;margin:0 0 12px;color:#333">💰 Totales</h2>
          <table style="width:100%;font-size:14px;margin-bottom:8px">
            <tr><td style="color:#888;padding:3px 0;width:130px">Subtotal</td><td style="text-align:right">${formatARS(Number(order.subtotal))}</td></tr>
            <tr><td style="color:#888;padding:3px 0">Envío (${order.shippingMethod?.name ?? ''})</td><td style="text-align:right">${Number(order.shippingCost) === 0 ? 'GRATIS' : formatARS(Number(order.shippingCost))}</td></tr>
            ${Number(order.discountTotal) > 0 ? `<tr><td style="color:#888;padding:3px 0">Descuento</td><td style="text-align:right;color:green">-${formatARS(Number(order.discountTotal))}</td></tr>` : ''}
            <tr style="font-size:16px;font-weight:bold"><td style="padding:8px 0 3px">TOTAL</td><td style="text-align:right;padding:8px 0 3px">${formatARS(Number(order.total))}</td></tr>
          </table>
        </div>
        <div style="background:#f5f5f5;padding:14px 32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#888;text-align:center">
          Este email fue generado automáticamente por Norte Gaming.
        </div>
      </div>`;

    try {
      await this.buildTransporter().sendMail({
        from: `"Norte Gaming" <${smtpUser}>`,
        to: receiver,
        subject: `🛒 Nuevo pedido ${order.orderNumber} — ${user.firstName} ${user.lastName} (${paymentMethod})`,
        html,
      });
    } catch (err) {
      this.logger.error('Error enviando email de notificación al admin:', err);
    }
  }

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

  private async verifyMercadoPagoToken() {
    const token = this.getMercadoPagoAccessToken();
    try {
      const res = await fetch('https://api.mercadopago.com/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (res.status === 401) {
        throw new Error('MERCADO_PAGO 401 Unauthorized - token inválido en configuración');
      }

      if (!res.ok) {
        const body = await res.text().catch(() => 'no body');
        throw new Error(`MERCADO_PAGO ${res.status} - ${body}`);
      }

      return true;
    } catch (err) {
      console.error('Mercado Pago token verification failed:', err);
      throw err;
    }
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

  validateWebhookSignature(
    xSignature: string | undefined,
    xRequestId: string | undefined,
    dataId: string | null,
  ): boolean {
    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();
    if (!secret) return true; // Sin secreto configurado, se omite la validación

    if (!xSignature || !xRequestId || !dataId) return false;

    let ts: string | undefined;
    let v1: string | undefined;
    for (const part of xSignature.split(',')) {
      const [key, value] = part.split('=');
      if (key?.trim() === 'ts') ts = value?.trim();
      if (key?.trim() === 'v1') v1 = value?.trim();
    }
    if (!ts || !v1) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const digest = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(v1));
    } catch {
      return false;
    }
  }

  private async restoreStockForOrder(orderId: string) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity },
          soldCount: { decrement: item.quantity },
        },
      });
    }
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

    // Send admin notification with payment method for all non-MP payments
    if (!this.isMercadoPagoProvider(dto.provider)) {
      void this.sendAdminOrderNotification(order, dto.method, order.user);
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
      // verify token early to fail fast with clearer error messages
      await this.verifyMercadoPagoToken();
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

      void this.sendAdminOrderNotification(order, 'Mercado Pago', order.user);
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

  async handleMercadoPagoWebhook(
    payload: MercadoPagoWebhookPayload,
    xSignature?: string,
    xRequestId?: string,
  ) {
    const mpPaymentId = this.extractWebhookPaymentId(payload);

    if (!this.validateWebhookSignature(xSignature, xRequestId, mpPaymentId)) {
      return { ok: false, error: 'invalid_signature' };
    }

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
      await this.restoreStockForOrder(localPayment.orderId);
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
      await this.restoreStockForOrder(payment.orderId);
    }

    return updated;
  }
}
