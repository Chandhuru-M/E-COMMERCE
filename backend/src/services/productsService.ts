import type { ProductRecord } from '../data/mockProducts';
import { mockProducts } from '../data/mockProducts';
import { supabaseAdmin } from '../lib/supabaseClient';

export interface ProductListOptions {
  limit?: number;
  category?: string;
}

export const fetchProducts = async (options: ProductListOptions = {}): Promise<ProductRecord[]> => {
  const { limit = 12, category } = options;

  try {
    const query = supabaseAdmin.from('products').select('*').limit(limit);

    if (category) {
      query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[productsService] Falling back to mock data:', error.message);
      return mockProducts.slice(0, limit);
    }

    if (!data || data.length === 0) {
      return mockProducts.slice(0, limit);
    }

    return data.map((record: Record<string, unknown>) => ({
      id: record.id as string,
      name: record.name as string,
      description: record.description as string,
      price: record.price as number,
      currency: (record.currency as string) ?? 'INR',
      image: (record.image as string) ?? mockProducts[0].image,
      sku: (record.sku as string) ?? 'SKU-' + record.id,
      stock: (record.stock as number) ?? 0,
      category: (record.category as string) ?? 'general',
      brand: (record.brand as string) ?? 'Neo',
      tag: record.tag as string | undefined,
      rating: (record.rating as number | null) ?? undefined,
      reviews: (record.reviews as number | null) ?? undefined
    }));
  } catch (error) {
    console.error('[productsService] Unexpected error:', error);
    return mockProducts.slice(0, limit);
  }
};
