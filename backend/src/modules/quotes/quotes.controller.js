// backend/src/modules/quotes/quotes.controller.js
import pool from '../../config/db.js';

export const createQuote = async (req, res) => {
  const { customer_name, customer_email, store_id, items } = req.body;

  if (!customer_name || !store_id || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    // crear cliente si no existe
    let customerId = null;
    if (customer_email) {
      const [exists] = await pool.query(
        `SELECT id FROM customers WHERE email = ? LIMIT 1`,
        [customer_email]
      );
      if (exists.length) {
        customerId = exists[0].id;
      } else {
        const [ins] = await pool.query(
          `INSERT INTO customers (name, email, is_subscribed) VALUES (?,?,1)`,
          [customer_name, customer_email]
        );
        customerId = ins.insertId;
      }
    } else {
      const [anon] = await pool.query(
        `INSERT INTO customers (name, is_subscribed) VALUES (?,0)`,
        [customer_name]
      );
      customerId = anon.insertId;
    }

    // crear cotización
    const [q] = await pool.query(
      `INSERT INTO quotes (customer_id, store_id, valid_until)
       VALUES (?, ?, NOW() + INTERVAL '7 days')`,
      [customerId, store_id]
    );
    const quoteId = q.insertId;

    for (const it of items) {
      await pool.query(
        `INSERT INTO quote_items (quote_id, product_id, quantity, unit_price)
         SELECT ?, p.id, ?, p.price FROM products p WHERE p.id = ?`,
        [quoteId, it.quantity, it.product_id]
      );
    }

    res.status(201).json({ message: 'Cotización creada', id: quoteId });
  } catch (err) {
    res.status(500).json({ error: 'Error creando cotización', details: err.message });
  }
};

export const listQuotes = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.id, c.name AS customer, s.name AS store, q.valid_until, q.created_at
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      JOIN stores s ON s.id = q.store_id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando cotizaciones', details: err.message });
  }
};

export const getQuote = async (req, res) => {
  const id = req.params.id;
  try {
    const [[quote]] = await pool.query(`
      SELECT q.id, c.name AS customer, c.email, s.name AS store, q.valid_until, q.created_at
      FROM quotes q
      JOIN customers c ON c.id = q.customer_id
      JOIN stores s ON s.id = q.store_id
      WHERE q.id = ?`, [id]);
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const [items] = await pool.query(`
      SELECT qi.product_id, p.name, qi.quantity, qi.unit_price
      FROM quote_items qi
      JOIN products p ON p.id = qi.product_id
      WHERE qi.quote_id = ?`, [id]);

    res.json({ ...quote, items });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo cotización', details: err.message });
  }
};
