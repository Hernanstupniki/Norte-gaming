import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductImageInputDto } from './product-image-input.dto';
import { ProductSpecInputDto } from './product-spec-input.dto';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(300)
  shortDescription: string;

  @IsString()
  @MinLength(20)
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  currentPrice: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  previousPrice?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  sku: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOnOffer?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  brandId: string;

  @IsString()
  categoryId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductImageInputDto)
  images: ProductImageInputDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variants?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSpecInputDto)
  specs?: ProductSpecInputDto[];
}
