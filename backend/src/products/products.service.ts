import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { toSlug } from '../common/utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly uploadsRoot = join(process.cwd(), 'uploads', 'products');

  private filterMissingUploadImages<
    T extends { images?: Array<{ url: string | null }> },
  >(product: T): T {
    if (!product.images?.length) {
      return product;
    }

    const images = product.images.filter((image) => {
      const url = image.url ?? '';
      const match = url.match(/\/uploads\/products\/([^?#]+)/i);
      if (!match) {
        return true;
      }

      const fileName = decodeURIComponent(match[1]);
      const absolutePath = join(this.uploadsRoot, fileName);
      return existsSync(absolutePath);
    });

    return {
      ...product,
      images,
    };
  }

  private includeData = {
    brand: true,
    category: true,
    images: { orderBy: { position: 'asc' as const } },
    specs: { orderBy: { position: 'asc' as const } },
  };

  async list(query: ProductsQueryDto, role?: Role) {
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(role !== Role.ADMIN ? { isActive: true } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { shortDescription: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.brandSlug ? { brand: { slug: query.brandSlug } } : {}),
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
      ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
      ...(query.offer !== undefined ? { isOnOffer: query.offer } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            currentPrice: {
              gte: query.minPrice,
              lte: query.maxPrice,
            },
          }
        : {}),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: 'desc' as const };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: this.includeData,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    return {
      data: data.map((product) => this.filterMissingUploadImages(product)),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async bySlug(slug: string, role?: Role) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(role !== Role.ADMIN ? { isActive: true } : {}),
      },
      include: {
        ...this.includeData,
        reviews: {
          where: { status: 'PUBLISHED' },
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
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.filterMissingUploadImages(product);
  }

  async create(dto: CreateProductDto) {
    if (
      dto.previousPrice !== undefined &&
      dto.previousPrice < dto.currentPrice
    ) {
      throw new BadRequestException(
        'El precio anterior debe ser mayor o igual al actual',
      );
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: toSlug(dto.name),
        shortDescription: dto.shortDescription,
        description: dto.description,
        currentPrice: new Prisma.Decimal(dto.currentPrice),
        previousPrice:
          dto.previousPrice !== undefined
            ? new Prisma.Decimal(dto.previousPrice)
            : null,
        sku: dto.sku,
        stock: dto.stock,
        isFeatured: dto.isFeatured ?? false,
        isOnOffer: dto.isOnOffer ?? false,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        images: {
          create: dto.images.map((img, index) => ({
            url: img.url,
            alt: img.alt,
            position: index,
          })),
        },
        specs: dto.specs
          ? {
              create: dto.specs.map((spec, index) => ({
                name: spec.name,
                value: spec.value,
                position: index,
              })),
            }
          : undefined,
      },
      include: this.includeData,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const found = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      if (dto.specs) {
        await tx.productSpec.deleteMany({ where: { productId: id } });
      }

      return tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.name ? toSlug(dto.name) : undefined,
          shortDescription: dto.shortDescription,
          description: dto.description,
          currentPrice:
            dto.currentPrice !== undefined
              ? new Prisma.Decimal(dto.currentPrice)
              : undefined,
          previousPrice:
            dto.previousPrice !== undefined
              ? new Prisma.Decimal(dto.previousPrice)
              : undefined,
          sku: dto.sku,
          stock: dto.stock,
          isFeatured: dto.isFeatured,
          isOnOffer: dto.isOnOffer,
          isActive: dto.isActive,
          brandId: dto.brandId,
          categoryId: dto.categoryId,
          images: dto.images
            ? {
                create: dto.images.map((img, index) => ({
                  url: img.url,
                  alt: img.alt,
                  position: index,
                })),
              }
            : undefined,
          specs: dto.specs
            ? {
                create: dto.specs.map((spec, index) => ({
                  name: spec.name,
                  value: spec.value,
                  position: index,
                })),
              }
            : undefined,
        },
        include: this.includeData,
      });
    });
  }

  async softDelete(id: string) {
    const found = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
