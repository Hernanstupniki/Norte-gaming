import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  brandSlug?: string;

  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  offer?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}
