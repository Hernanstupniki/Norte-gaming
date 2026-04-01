import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto) {
    return this.prisma.contact.create({ data: dto });
  }

  listAdmin() {
    return this.prisma.contact.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, dto: UpdateContactStatusDto) {
    const found = await this.prisma.contact.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.prisma.contact.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    const found = await this.prisma.contact.findUnique({ where: { id } });
    if (!found) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return this.prisma.contact.delete({ where: { id } });
  }
}
