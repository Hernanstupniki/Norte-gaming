import { IsString, MaxLength } from 'class-validator';

export class ProductSpecInputDto {
  @IsString()
  @MaxLength(250)
  name: string;

  @IsString()
  @MaxLength(250)
  value: string;
}
