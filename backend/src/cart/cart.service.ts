import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCart(userId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.cart.create({ data: { userId } });
  }

  private async ensureProductAvailable(productId: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado o inactivo');
    }
    return product;
  }

  private async mapCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return { items: [], subtotal: 0, totalItems: 0 };
    }

    const subtotal = cart.items.reduce(
      (acc, item) => acc + Number(item.unitPrice) * item.quantity,
      0,
    );
    const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);

    return {
      id: cart.id,
      items: cart.items,
      subtotal,
      totalItems,
      updatedAt: cart.updatedAt,
    };
  }

  async getMyCart(userId: string) {
    await this.ensureCart(userId);
    return this.mapCart(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.ensureCart(userId);
    const product = await this.ensureProductAvailable(dto.productId);

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: dto.productId,
        },
      },
    });

    const finalQty = (existing?.quantity ?? 0) + dto.quantity;
    if (finalQty > product.stock) {
      throw new BadRequestException(
        'No hay stock suficiente para esa cantidad',
      );
    }

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: finalQty, unitPrice: product.currentPrice },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          unitPrice: product.currentPrice,
        },
      });
    }

    return this.mapCart(userId);
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.ensureCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true },
    });
    if (!item) {
      throw new NotFoundException('Item no encontrado en tu carrito');
    }

    if (dto.quantity > item.product.stock) {
      throw new BadRequestException(
        'No hay stock suficiente para esa cantidad',
      );
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity: dto.quantity,
        unitPrice: item.product.currentPrice,
      },
    });

    return this.mapCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.ensureCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) {
      throw new NotFoundException('Item no encontrado en tu carrito');
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.mapCart(userId);
  }

  async clear(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.mapCart(userId);
  }
}
