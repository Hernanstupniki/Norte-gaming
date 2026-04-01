import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  productId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating: number;

  @IsString()
  @MaxLength(1000)
  comment: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
