import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import { mockProducts } from '../data/products';
import type { Product, ProductResponse } from '../types/product';

interface UseProductsOptions {
  limit?: number;
  category?: string;
}

interface UseProductsResult {
  data: Product[];
  loading: boolean;
  error: string | null;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsResult => {
  const [data, setData] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (options.limit) {
        query.set('limit', String(options.limit));
      }
      if (options.category) {
        query.set('category', options.category);
      }

      try {
  const response = await apiClient<ProductResponse>(`/products${query.size ? `?${query.toString()}` : ''}`);
        if (!mounted) return;
  const incoming = response.data && response.data.length > 0 ? response.data : mockProducts;
  setData(incoming.map((product) => ({ ...product, currency: product.currency ?? 'INR' })));
      } catch (err) {
        if (!mounted) return;
        console.error('[useProducts] Failed to load products:', err);
        setError(err instanceof Error ? err.message : 'Unable to load products');
  setData(mockProducts);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [options.category, options.limit]);

  return { data, loading, error };
};
