// backend/src/modules/cart/cart.controller.js
import pool from '../../config/db.js';

const getOrCreateCartId = async (session_id) => {
  const [rows] = await pool.query(`SELECT id FROM cart WHERE session_id = ? LIMIT 1`, [session_id]);
  if (rows.length) return rows[0].id;
  const [ins] = await pool.query(`INSERT INTO cart (session_id) VALUES (?)`, [session_id]);
  return ins.insertId;
};

export const getCart = async (req, res) => {
  const sid = req.sessionID; // id de sesión express
  try {
    const cartId = await getOrCreateCartId(sid);
    const [items] = await pool.query(`
      SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity,
             (p.price * ci.quantity) AS subtotal
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC
    `, [cartId]);

    const total = items.reduce((a, b) => a + Number(b.subtotal), 0);
    res.json({ cart_id: cartId, items, total });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo carrito', details: err.message });
  }
};

export const addToCart = async (req, res) => {
  const sid = req.sessionID;
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id requerido' });

  try {
    const cartId = await getOrCreateCartId(sid);

    // crea si no existe, o suma si existe
    await pool.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `, [cartId, product_id, quantity]);

    res.status(201).json({ message: 'Agregado al carrito' });
  } catch (err) {
    res.status(500).json({ error: 'Error agregando al carrito', details: err.message });
  }
};

export const updateItem = async (req, res) => {
  const sid = req.sessionID;
  const { item_id, quantity } = req.body;
  if (!item_id || typeof quantity === 'undefined')
    return res.status(400).json({ error: 'item_id y quantity requeridos' });

  try {
    const cartId = await getOrCreateCartId(sid);

    if (Number(quantity) <= 0) {
      await pool.query(`DELETE FROM cart_items WHERE id = ? AND cart_id = ?`, [item_id, cartId]);
      return res.json({ message: 'Item eliminado' });
    }

    await pool.query(`UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?`, [quantity, item_id, cartId]);
    res.json({ message: 'Item actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando item', details: err.message });
  }
};

export const clearCart = async (req, res) => {
  const sid = req.sessionID;
  try {
    const cartId = await getOrCreateCartId(sid);
    await pool.query(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
    res.json({ message: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ error: 'Error limpiando carrito', details: err.message });
  }
};
