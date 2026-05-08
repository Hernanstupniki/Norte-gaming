import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@prisma/client';
import nodemailer from 'nodemailer';
import { generateOrderNumber } from '../common/utils';
import { PrismaService } from '../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const formatARS = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService,
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

  private async sendOrderNotification(order: any, user: { firstName: string; lastName: string; email: string }) {
    const receiver = this.config.get<string>('CONTACT_RECEIVER_EMAIL');
    const smtpUser = this.config.get<string>('SMTP_USER');
    if (!receiver || !smtpUser) return;

    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${item.productName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">${formatARS(Number(item.unitPrice))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:bold">${formatARS(Number(item.totalPrice))}</td>
        </tr>`,
      )
      .join('');

    const addr = order.address;
    const addressStr = `${addr.street} ${addr.number}${addr.floor ? `, piso ${addr.floor}` : ''}${addr.apartment ? ` dpto ${addr.apartment}` : ''}, ${addr.city}, ${addr.province} (CP ${addr.postalCode})`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#111">
        <div style="background:#111;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:22px">🛒 Nuevo pedido — Norte Gaming</h1>
          <p style="color:#aaa;margin:6px 0 0;font-size:14px">Orden <strong style="color:#fff">${order.orderNumber}</strong></p>
        </div>
        <div style="background:#fafafa;padding:24px 32px;border:1px solid #eee;border-top:none">

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
            <thead>
              <tr style="background:#f0f0f0">
                <th style="padding:8px 12px;text-align:left">Producto</th>
                <th style="padding:8px 12px;text-align:center">Cant.</th>
                <th style="padding:8px 12px;text-align:right">Precio u.</th>
                <th style="padding:8px 12px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <h2 style="font-size:15px;margin:0 0 12px;color:#333">💰 Totales</h2>
          <table style="width:100%;font-size:14px;margin-bottom:24px">
            <tr><td style="color:#888;padding:3px 0;width:130px">Subtotal</td><td style="text-align:right">${formatARS(Number(order.subtotal))}</td></tr>
            <tr><td style="color:#888;padding:3px 0">Envío (${order.shippingMethod.name})</td><td style="text-align:right">${Number(order.shippingCost) === 0 ? 'GRATIS' : formatARS(Number(order.shippingCost))}</td></tr>
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
        subject: `🛒 Nuevo pedido ${order.orderNumber} — ${user.firstName} ${user.lastName}`,
        html,
      });
    } catch (err) {
      this.logger.error('Error enviando email de notificación de orden:', err);
    }
  }

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

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true },
    });
    if (user) {
      void this.sendOrderNotification(order, user);
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
