// backend/src/modules/cart/cart.routes.js
import express from 'express';
import { getCart, addToCart, updateItem, clearCart } from './cart.controller.js';

const router = express.Router();

// Público (carrito por sesión)
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item', updateItem);
router.delete('/clear', clearCart);

export default router;
