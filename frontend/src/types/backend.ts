export interface ProductImageInputDto {
  url: string;
  alt?: string;
}

export interface ProductSpecInputDto {
  name: string;
  value: string;
}

export interface CreateProductDto {
  name: string;
  shortDescription: string;
  description: string;
  currentPrice: number;
  previousPrice?: number;
  sku: string;
  stock: number;
  isFeatured?: boolean;
  isOnOffer?: boolean;
  isActive?: boolean;
  brandId: string;
  categoryId: string;
  images: ProductImageInputDto[];
  variants?: string[];
  specs?: ProductSpecInputDto[];
}
