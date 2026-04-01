import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, status: ReviewStatus.PUBLISHED },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Ya reseñaste este producto');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async update(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
    });
  }

  async remove(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, userId },
    });
    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return this.prisma.review.delete({ where: { id: reviewId } });
  }

  listAdmin() {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(reviewId: string, dto: UpdateReviewStatusDto) {
    const found = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!found) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status: dto.status },
    });
  }
}
