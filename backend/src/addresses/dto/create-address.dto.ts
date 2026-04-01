import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  recipient: string;

  @IsString()
  @MinLength(5)
  @MaxLength(30)
  phone: string;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  street: string;

  @IsString()
  @MaxLength(20)
  number: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  apartment?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  province: string;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  postalCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reference?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPrimary?: boolean;
}
