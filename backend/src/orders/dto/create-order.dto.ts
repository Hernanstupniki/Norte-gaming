import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  addressId: string;

  @IsString()
  shippingMethodId: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  couponCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
