export type CategorySlug = string;

export type ProductBadge = "oferta" | "destacado" | "nuevo" | "mas-vendido" | "sin-stock";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  heroLabel: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: CategorySlug;
  price: number;
  previousPrice?: number;
  stock: number;
  installments: string;
  badges: ProductBadge[];
  shortDescription: string;
  description: string;
  specs: Array<{ label: string; value: string }>;
  images: string[];
  rating: number;
  reviewCount: number;
  sold: number;
  isFeatured?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface Review {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  verified: boolean;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface StatItem {
  label: string;
  value: string;
}
