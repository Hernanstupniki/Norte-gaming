import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ToggleWishlistItemDto } from './dto/toggle-wishlist-item.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureWishlist(userId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    return this.prisma.wishlist.create({ data: { userId } });
  }

  async getMyWishlist(userId: string) {
    const wishlist = await this.ensureWishlist(userId);
    return this.prisma.wishlist.findUnique({
      where: { id: wishlist.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' }, take: 1 },
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    });
  }

  async toggle(userId: string, dto: ToggleWishlistItemDto) {
    const wishlist = await this.ensureWishlist(userId);

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlistItem.delete({ where: { id: existing.id } });
      return {
        message: 'Eliminado de favoritos',
        added: false,
        wishlist: await this.getMyWishlist(userId),
      };
    }

    await this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: dto.productId,
      },
    });

    return {
      message: 'Agregado a favoritos',
      added: true,
      wishlist: await this.getMyWishlist(userId),
    };
  }

  async remove(userId: string, itemId: string) {
    const wishlist = await this.ensureWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { id: itemId, wishlistId: wishlist.id },
    });
    return this.getMyWishlist(userId);
  }

  async clear(userId: string) {
    const wishlist = await this.ensureWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
    return this.getMyWishlist(userId);
  }
}
