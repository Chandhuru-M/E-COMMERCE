import { fetchProducts } from '../services/productsService';
export const listProducts = async (req, res, next) => {
    try {
        const { limit, category } = req.query;
        const parsedLimit = limit ? Number(limit) : undefined;
        const products = await fetchProducts({
            limit: parsedLimit && !Number.isNaN(parsedLimit) ? parsedLimit : undefined,
            category: typeof category === 'string' ? category : undefined
        });
        res.json({ data: products });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=productsController.js.map