import { Router } from 'express';

import healthRouter from './health';
import productsRouter from './products';

const router = Router();

router.use('/health', healthRouter);
router.use('/products', productsRouter);

export default router;
