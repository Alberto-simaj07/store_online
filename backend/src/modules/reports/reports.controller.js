import pool from '../../config/db.js';

export const topProducts = async (req, res) => {
  const { limit = 100, store_id } = req.query;

  try {
    const [rows] = await pool.query(
      `
      SELECT p.id, p.name, SUM(si.quantity) AS total_sold, SUM(si.quantity * si.unit_price) AS total_amount
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id AND s.status <> 'ANULADA'
      JOIN products p ON p.id = si.product_id
      ${store_id ? 'WHERE s.store_id = ?' : ''}
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT ?
      `,
      store_id ? [store_id, Number(limit)] : [Number(limit)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error generando top productos', details: err.message });
  }
};

export const lowStock = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT i.store_id, s.name AS store, p.id AS product_id, p.name, i.stock
      FROM inventory i
      JOIN stores s ON s.id = i.store_id
      JOIN products p ON p.id = i.product_id
      WHERE i.stock < 10
      ORDER BY i.stock ASC
      LIMIT 20
      `
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando bajo stock', details: err.message });
  }
};

export const monthlySales = async (req, res) => {
  const { year = new Date().getFullYear(), store_id } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT TO_CHAR(s.created_at, 'YYYY-MM') AS month,
             SUM(si.quantity) AS total_items,
             SUM(si.quantity * si.unit_price) AS total_amount
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      WHERE EXTRACT(YEAR FROM s.created_at) = ?
        ${store_id ? 'AND s.store_id = ?' : ''}
      GROUP BY month
      ORDER BY month ASC
      `,
      store_id ? [Number(year), store_id] : [Number(year)]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error generando ventas mensuales', details: err.message });
  }
};

export const frequentCustomers = async (req, res) => {
  const { limit = 20, store_id } = req.query;
  const params = [];
  let where = `WHERE s.status = 'PAGADA'`;

  if (store_id) {
    where += ' AND s.store_id = ?';
    params.push(store_id);
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        COALESCE(c.name, 'Cliente sin registro') AS customer,
        COALESCE(c.email, '-') AS email,
        s.store_id,
        COUNT(s.id) AS orders,
        SUM(s.total) AS total
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${where}
      GROUP BY c.id, s.store_id
      ORDER BY orders DESC
      LIMIT ?
      `,
      [...params, Number(limit)]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error en clientes frecuentes', details: e.message });
  }
};

export const salesByRange = async (req, res) => {
  const { from, to, store_id } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Parametros from y to requeridos' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT s.id, c.name AS customer, st.name AS store, s.total, s.created_at
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN stores st ON st.id = s.store_id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
        ${store_id ? 'AND s.store_id = ?' : ''}
        AND s.status <> 'ANULADA'
      ORDER BY s.created_at DESC
      `,
      store_id ? [from, to, store_id] : [from, to]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando ventas por rango', details: err.message });
  }
};

export const topProductsByMonth = async (req, res) => {
  const { year, store_id } = req.query;
  const yr = Number(year) || new Date().getFullYear();
  try {
    const [rows] = await pool.query(
      `
      SELECT
        p.name AS product,
        TO_CHAR(s.created_at, 'YYYY-MM') AS month,
        SUM(si.quantity) AS qty
      FROM sale_items si
      JOIN sales s ON s.id = si.sale_id AND s.status = 'PAGADA'
      JOIN products p ON p.id = si.product_id
      WHERE EXTRACT(YEAR FROM s.created_at) = ?
        ${store_id ? 'AND s.store_id = ?' : ''}
      GROUP BY p.id, p.name, month
      ORDER BY month ASC, qty DESC
      `,
      store_id ? [yr, store_id] : [yr]
    );
    res.json(rows);
  } catch (e) {
    console.error('top-products-by-month error:', e);
    res.status(500).json({ error: 'Error en top-products-by-month', details: e.message });
  }
};
