// backend/src/modules/reports/reports.routes.js
import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
//import { topProductsByMonth } from './reports.controller.js';
import {
  topProducts,
  lowStock,
  monthlySales,
  frequentCustomers,
  salesByRange,
  topProductsByMonth
} from './reports.controller.js';

const router = express.Router();

router.get('/top-products', isAuth, isGerente, topProducts);
router.get('/low-stock', isAuth, isGerente, lowStock);
router.get('/top-products-by-month', isAuth, topProductsByMonth);
router.get('/monthly-sales', isAuth, isGerente, monthlySales);
router.get('/frequent-customers', isAuth, isGerente, frequentCustomers);
router.get('/sales-by-range', isAuth, isGerente, salesByRange);


export default router;    
