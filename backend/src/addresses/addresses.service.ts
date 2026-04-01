import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  listMyAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isPrimary) {
      await this.prisma.address.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    return this.prisma.address.create({
      data: {
        ...dto,
        isPrimary: dto.isPrimary ?? false,
        userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    if (dto.isPrimary) {
      await this.prisma.address.updateMany({
        where: { userId, deletedAt: null, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    return this.prisma.address.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async setPrimary(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      }),
      this.prisma.address.update({ where: { id }, data: { isPrimary: true } }),
    ]);

    return this.listMyAddresses(userId);
  }
}
