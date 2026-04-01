import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toSlug } from '../common/utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.category.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  listAllAdmin() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: toSlug(dto.name),
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const found = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name ?? found.name,
        slug: dto.name ? toSlug(dto.name) : undefined,
        description: dto.description,
      },
    });
  }

  async softDelete(id: string) {
    const found = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!found) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
