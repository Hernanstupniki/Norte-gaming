import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginatedResponse } from '../common/api-response';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role?: Role;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role ?? Role.CLIENT,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async getPublicProfileById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async updatePasswordHash(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });
  }

  async listUsers(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Partial<User>>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      OR: query.search
        ? [
            { email: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async adminSetStatus(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async adminUpdateUser(userId: string, dto: Partial<{
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: Role;
    isActive?: boolean;
  }>) {
    const existing = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const allowed: any = {};
    if (dto.firstName !== undefined) allowed.firstName = dto.firstName;
    if (dto.lastName !== undefined) allowed.lastName = dto.lastName;
    if (dto.phone !== undefined) allowed.phone = dto.phone;
    if (dto.role !== undefined) allowed.role = dto.role;
    if (dto.isActive !== undefined) allowed.isActive = dto.isActive;

    return this.prisma.user.update({
      where: { id: userId },
      data: allowed,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
