// backend/src/modules/inventory/inventory.controller.js
import pool from '../../config/db.js';

/**
 * GET /api/inventory?store_id=ID
 * Lista el inventario de una sucursal mostrando TODOS los productos,
 * aunque no tengan registro en la tabla inventory (stock = 0).
 */
export const listInventory = async (req, res) => {
  const { store_id } = req.query;
  if (!store_id) {
    return res.status(400).json({ error: 'store_id requerido' });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT
        ? AS store_id,
        p.id AS product_id,
        p.name AS product,
        COALESCE(i.stock, 0) AS stock
      FROM products p
      LEFT JOIN inventory i
        ON i.product_id = p.id AND i.store_id = ?
      WHERE p.is_active = 1
      ORDER BY p.name ASC
      `,
      [store_id, store_id]
    );

    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error listando inventario', details: err.message });
  }
};

/**
 * PUT /api/inventory/adjust
 * Body: { store_id, product_id, quantity }
 * - quantity puede ser positiva (suma) o negativa (resta)
 * - crea la fila si no existe (UPSERT)
 * - nunca permite stock negativo (GREATEST(0, ...))
 */
export const adjustInventory = async (req, res) => {
  const { store_id, product_id, quantity } = req.body;

  if (!store_id || !product_id || quantity === undefined) {
    return res
      .status(400)
      .json({ error: 'store_id, product_id y quantity requeridos' });
  }

  const delta = Number(quantity);
  if (!Number.isFinite(delta) || Number.isNaN(delta) || delta === 0) {
    return res
      .status(400)
      .json({ error: 'quantity debe ser un número distinto de 0' });
  }

  try {
    // Inserta si no existe; si existe, suma/resta. Nunca baja de 0.
    await pool.query(
      `
      INSERT INTO inventory (store_id, product_id, stock)
      VALUES (?, ?, GREATEST(0, ?))
      ON CONFLICT (store_id, product_id)
      DO UPDATE SET stock = GREATEST(0, inventory.stock + EXCLUDED.stock)
      `,
      [store_id, product_id, delta]
    );

    const stock = await getCurrentStock(store_id, product_id);
    res.json({ message: 'Stock ajustado', stock });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'Error ajustando inventario', details: err.message });
  }
};

/* ===================== Helpers ===================== */

/**
 * Lee el stock actual para (store_id, product_id)
 */
async function getCurrentStock(store_id, product_id) {
  const [[row]] = await pool.query(
    'SELECT stock FROM inventory WHERE store_id = ? AND product_id = ?',
    [store_id, product_id]
  );
  return row?.stock ?? 0;
}
