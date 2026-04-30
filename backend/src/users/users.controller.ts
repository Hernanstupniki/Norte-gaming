import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminUpdateUserStatusDto } from './dto/admin-update-user-status.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser('sub') userId: string) {
    return this.usersService.getPublicProfileById(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  listUsers(@Query() query: PaginationQueryDto) {
    return this.usersService.listUsers(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  createUser(@Body() dto: AdminCreateUserDto) {
    return this.usersService.adminCreateUser(dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  byId(@Param('id') id: string) {
    return this.usersService.getPublicProfileById(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  updateUser(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  setStatus(@Param('id') id: string, @Body() dto: AdminUpdateUserStatusDto) {
    return this.usersService.adminSetStatus(id, dto.isActive);
  }
}
