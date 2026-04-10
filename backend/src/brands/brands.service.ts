import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSlug } from '../common/utils';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly hiddenBrandSlugs = ['logitech-g', 'reddragon'];
  private readonly hiddenBrandNames = ['Logitech G', 'Reddragon'];

  listActive() {
    return this.prisma.brand.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        slug: { notIn: this.hiddenBrandSlugs },
        name: { notIn: this.hiddenBrandNames },
      },
      orderBy: { name: 'asc' },
    });
  }

  listAllAdmin() {
    return this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        slug: { notIn: this.hiddenBrandSlugs },
        name: { notIn: this.hiddenBrandNames },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug: toSlug(dto.name),
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    const found = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Marca no encontrada');
    }

    return this.prisma.brand.update({
      where: { id },
      data: {
        name: dto.name ?? found.name,
        slug: dto.name ? toSlug(dto.name) : undefined,
        description: dto.description,
      },
    });
  }

  async softDelete(id: string) {
    const found = await this.prisma.brand.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Marca no encontrada');
    }

    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
