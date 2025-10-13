import { Router } from 'express';
import { listProducts } from '../controllers/productsController';
const router = Router();
router.get('/', listProducts);
export default router;
//# sourceMappingURL=products.js.map