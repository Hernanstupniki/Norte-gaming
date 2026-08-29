import { IsUUID, IsInt, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterSaleDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}
