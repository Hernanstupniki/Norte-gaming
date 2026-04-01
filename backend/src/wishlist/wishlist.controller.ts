import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ToggleWishlistItemDto } from './dto/toggle-wishlist-item.dto';
import { WishlistService } from './wishlist.service';

@ApiTags('wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get('me')
  getMyWishlist(@CurrentUser('sub') userId: string) {
    return this.wishlistService.getMyWishlist(userId);
  }

  @Post('me/toggle')
  toggle(
    @CurrentUser('sub') userId: string,
    @Body() dto: ToggleWishlistItemDto,
  ) {
    return this.wishlistService.toggle(userId, dto);
  }

  @Delete('me/items/:itemId')
  remove(@CurrentUser('sub') userId: string, @Param('itemId') itemId: string) {
    return this.wishlistService.remove(userId, itemId);
  }

  @Delete('me')
  clear(@CurrentUser('sub') userId: string) {
    return this.wishlistService.clear(userId);
  }
}
