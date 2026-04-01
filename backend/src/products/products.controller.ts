import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/public.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  listPublic(@Query() query: ProductsQueryDto) {
    return this.productsService.list(query);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/all')
  listAdmin(@Query() query: ProductsQueryDto) {
    return this.productsService.list(query, Role.ADMIN);
  }

  @Public()
  @Get(':slug')
  bySlugPublic(@Param('slug') slug: string) {
    return this.productsService.bySlug(slug);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/by-slug/:slug')
  bySlugAdmin(@Param('slug') slug: string) {
    return this.productsService.bySlug(slug, Role.ADMIN);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
