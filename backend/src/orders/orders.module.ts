import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CouponsModule } from '../coupons/coupons.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ConfigModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
