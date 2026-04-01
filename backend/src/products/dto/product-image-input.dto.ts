import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProductImageInputDto {
  @IsString()
  @MaxLength(500)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  alt?: string;
}
