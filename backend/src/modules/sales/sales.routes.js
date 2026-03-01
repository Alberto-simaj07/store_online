// backend/src/modules/sales/sales.routes.js
import express from 'express';
import { checkout, listSales, updateSaleStatus } from './sales.controller.js';
import { isAuth, isGerente } from '../../middleware/auth.js';

const router = express.Router();

// Público: checkout desde el carrito por sesión
router.post('/checkout', checkout);

// Privado: listar/administrar ventas
router.get('/', isAuth, isGerente, listSales);
router.put('/:id/status', isAuth, isGerente, updateSaleStatus);

export default router;
