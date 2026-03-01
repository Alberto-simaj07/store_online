// backend/src/modules/sales/sales.controller.js
import pool from '../../config/db.js';
import { logAction } from '../../middleware/logger.js';

const getOrCreateCustomer = async (conn, name, email) => {
  if (!email) {
    const [ins] = await conn.query(`INSERT INTO customers (name, is_subscribed) VALUES (?,0)`, [name]);
    return ins.insertId;
  }
  const [ex] = await conn.query(`SELECT id FROM customers WHERE email = ? LIMIT 1`, [email]);
  if (ex.length) return ex[0].id;
  const [ins] = await conn.query(`INSERT INTO customers (name, email, is_subscribed) VALUES (?,?,1)`, [name, email]);
  return ins.insertId;
};

export const checkout = async (req, res) => {
  const sid = req.sessionID;
  const { store_id, customer_name, customer_email } = req.body;

  if (!store_id || !customer_name)
    return res.status(400).json({ error: 'store_id y customer_name son requeridos' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Obtener carrito
    const [[cart]] = await conn.query(`SELECT id FROM cart WHERE session_id = ? LIMIT 1`, [sid]);
    if (!cart) {
      await conn.rollback();
      return res.status(400).json({ error: 'Carrito vacío' });
    }
    const cartId = cart.id;

    const [items] = await conn.query(`
      SELECT ci.product_id, ci.quantity, p.price, p.name
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
    `, [cartId]);

    if (!items.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Carrito sin items' });
    }

    // 2) Verificar stock por producto en store_id con bloqueo
    for (const it of items) {
      const [[inv]] = await conn.query(
        `SELECT stock FROM inventory WHERE store_id = ? AND product_id = ? FOR UPDATE`,
        [store_id, it.product_id]
      );
      const stock = inv ? Number(inv.stock) : 0;
      if (stock < it.quantity) {
        await conn.rollback();
        return res.status(409).json({
          error: 'Stock insuficiente',
          details: `Producto ${it.product_id} (${it.name}) disponible: ${stock}, pedido: ${it.quantity}`
        });
      }
    }

    // 3) Crear cliente y venta
    const customerId = await getOrCreateCustomer(conn, customer_name, customer_email);

    const total = items.reduce((a, b) => a + (Number(b.price) * Number(b.quantity)), 0);
    const [saleIns] = await conn.query(
      `INSERT INTO sales (customer_id, store_id, total, status) VALUES (?,?,?, 'NUEVA')`,
      [customerId, store_id, total]
    );
    const saleId = saleIns.insertId;

    // 4) Items + descuento de stock
    for (const it of items) {
      await conn.query(
        `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?,?,?,?)`,
        [saleId, it.product_id, it.quantity, it.price]
      );
      await conn.query(
        `UPDATE inventory SET stock = stock - ? WHERE store_id = ? AND product_id = ?`,
        [it.quantity, store_id, it.product_id]
      );
    }

    // 5) Vaciar carrito
    await conn.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);

    await conn.commit();
    res.status(201).json({ message: 'Venta creada', sale_id: saleId, total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Error en checkout', details: err.message });
  } finally {
    conn.release();
  }
};

export const listSales = async (req, res) => {
  const { from, to, store_id } = req.query;
  const params = [];
  let where = `WHERE s.status <> 'ANULADA'`;
  if (from && to) { where += ` AND DATE(s.created_at) BETWEEN ? AND ?`; params.push(from, to); }
  if (store_id) { where += ` AND s.store_id = ?`; params.push(store_id); }

  try {
    const [rows] = await pool.query(
      `
      SELECT s.id, s.total, s.status, s.created_at, st.name AS store, c.name AS customer
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      JOIN customers c ON c.id = s.customer_id
      ${where}
      ORDER BY s.created_at DESC
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando ventas', details: err.message });
  }
};

export const updateSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // NUEVA | PAGADA | ANULADA
  if (!['NUEVA', 'PAGADA', 'ANULADA'].includes(status))
    return res.status(400).json({ error: 'status inválido' });

  try {
    await pool.query(`UPDATE sales SET status = ? WHERE id = ?`, [status, id]);
    res.json({ message: 'Estado actualizado' });
    await logAction(req.session.user, 'UPDATE_STATUS', 'sale', id, null, null, { status });

  } catch (err) {
    res.status(500).json({ error: 'Error actualizando estado', details: err.message });
  }
};
