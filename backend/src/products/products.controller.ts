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
import { RegisterSaleDto } from './dto/register-sale.dto';
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

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/sales-history')
  getSalesHistory() {
    return this.productsService.getSalesHistory();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('admin/most-viewed')
  getMostViewedProducts(@Query('limit') limit?: string) {
    return this.productsService.getMostViewedProducts(limit ? Number(limit) : 10);
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
  @Get('admin/by-sku/:sku')
  bySkuAdmin(@Param('sku') sku: string) {
    return this.productsService.findBySku(sku);
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
  @Post('admin/register-sale')
  registerSale(@Body() dto: RegisterSaleDto) {
    return this.productsService.registerSale(dto.productId, dto.quantity, dto.unitPrice);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }
}
