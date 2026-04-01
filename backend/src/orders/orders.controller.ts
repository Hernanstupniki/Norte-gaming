import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('me')
  createOrder(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createFromCart(userId, dto);
  }

  @Get('me')
  listMyOrders(@CurrentUser('sub') userId: string) {
    return this.ordersService.listMyOrders(userId);
  }

  @Get('me/:id')
  getMyOrder(@CurrentUser('sub') userId: string, @Param('id') orderId: string) {
    return this.ordersService.getMyOrderById(userId, orderId);
  }

  @Roles(Role.ADMIN)
  @Get('admin/all')
  listAdmin() {
    return this.ordersService.listAdmin();
  }

  @Roles(Role.ADMIN)
  @Patch('admin/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
