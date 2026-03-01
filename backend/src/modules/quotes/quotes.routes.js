import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
import { createQuote, listQuotes, getQuote } from './quotes.controller.js';
import pool from '../../config/db.js';

const router = express.Router();

// Publica: crear cotizacion (sin login)
router.post('/', createQuote);

// Privado: ver cotizaciones
router.get('/', isAuth, isGerente, listQuotes);

router.get('/availability', isAuth, async (req, res) => {
  const { store_id, product_id } = req.query;
  if (!store_id || !product_id) {
    return res.status(400).json({ error: 'store_id y product_id requeridos' });
  }

  const [[row]] = await pool.query(
    `SELECT p.price, COALESCE(i.stock, 0) AS stock
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id AND i.store_id = ?
     WHERE p.id = ?`,
    [store_id, product_id]
  );

  res.json(row || { price: null, stock: 0 });
});

router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email requerido' });

  try {
    await pool.query(
      'INSERT INTO subscribers (email) VALUES (?) ON CONFLICT (email) DO NOTHING',
      [email]
    );
    res.json({ message: 'Suscripcion exitosa' });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo suscribir', details: e.message });
  }
});

router.get('/:id', isAuth, isGerente, getQuote);

export default router;
