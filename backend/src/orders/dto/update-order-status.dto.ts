import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  logisticStatus?: string;
}
