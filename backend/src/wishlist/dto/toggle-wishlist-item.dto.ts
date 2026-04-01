import { IsString } from 'class-validator';

export class ToggleWishlistItemDto {
  @IsString()
  productId: string;
}
