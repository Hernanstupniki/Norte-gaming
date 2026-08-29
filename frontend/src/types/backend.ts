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
  currentPrice?: number | null;
  previousPrice?: number | null;
  sku: string;
  stock: number;
  soldCount?: number;
  isFeatured?: boolean;
  isOnOffer?: boolean;
  freeShipping?: boolean;
  isActive?: boolean;
  availability?: "IN_STOCK" | "OUT_OF_STOCK" | "ORDER_ONLY";
  brandId: string;
  categoryId: string;
  images: ProductImageInputDto[];
  variants?: string[];
  specs?: ProductSpecInputDto[];
}
