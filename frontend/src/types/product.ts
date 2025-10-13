export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  image: string;
  tag?: string;
  rating?: number;
  reviews?: number;
  category?: string;
  brand?: string;
  stock?: number;
  sku?: string;
}

export interface ProductResponse {
  data: Product[];
}
