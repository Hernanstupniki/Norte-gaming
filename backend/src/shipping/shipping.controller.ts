import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/public.decorator';
import { CreateShippingMethodDto } from './dto/create-shipping-method.dto';
import { UpdateShippingMethodDto } from './dto/update-shipping-method.dto';
import { ShippingService } from './shipping.service';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Get('methods')
  listActive() {
    return this.shippingService.listActive();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('methods/admin/all')
  listAllAdmin() {
    return this.shippingService.listAllAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('methods')
  create(@Body() dto: CreateShippingMethodDto) {
    return this.shippingService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('methods/:id')
  update(@Param('id') id: string, @Body() dto: UpdateShippingMethodDto) {
    return this.shippingService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('methods/:id')
  remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }
}
