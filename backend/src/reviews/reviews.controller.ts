import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/public.decorator';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { UpdateReviewStatusDto } from './dto/update-review-status.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  listByProduct(@Param('productId') productId: string) {
    return this.reviewsService.listByProduct(productId);
  }

  @ApiBearerAuth()
  @Post()
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @ApiBearerAuth()
  @Patch(':id')
  update(
    @CurrentUser('sub') userId: string,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, reviewId, dto);
  }

  @ApiBearerAuth()
  @Delete(':id')
  remove(@CurrentUser('sub') userId: string, @Param('id') reviewId: string) {
    return this.reviewsService.remove(userId, reviewId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/all')
  listAdmin() {
    return this.reviewsService.listAdmin();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('admin/:id/status')
  updateStatus(
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewStatusDto,
  ) {
    return this.reviewsService.updateStatus(reviewId, dto);
  }
}
