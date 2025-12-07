import { mockProducts } from '../data/mockProducts';
import { supabaseAdmin } from '../lib/supabaseClient';
export const fetchProducts = async (options = {}) => {
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
        return data.map((record) => ({
            id: record.id,
            name: record.name,
            description: record.description,
            price: record.price,
            currency: record.currency ?? 'INR',
            image: record.image ?? mockProducts[0].image,
            sku: record.sku ?? 'SKU-' + record.id,
            stock: record.stock ?? 0,
            category: record.category ?? 'general',
            brand: record.brand ?? 'Neo',
            tag: record.tag,
            rating: record.rating ?? undefined,
            reviews: record.reviews ?? undefined
        }));
    }
    catch (error) {
        console.error('[productsService] Unexpected error:', error);
        return mockProducts.slice(0, limit);
    }
};
//# sourceMappingURL=productsService.js.map