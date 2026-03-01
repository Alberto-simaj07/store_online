// backend/src/modules/transfers/transfers.controller.js
import pool from '../../config/db.js';
import { logAction } from '../../middleware/logger.js';

export const listTransfers = async (req, res) => {
  const { status } = req.query;
  try {
    const [rows] = await pool.query(
      `
      SELECT t.*, fs.name AS from_store, ts.name AS to_store,
             u1.name AS created_by_user, u2.name AS approved_by_user
      FROM transfers t
      JOIN stores fs ON fs.id = t.from_store_id
      JOIN stores ts ON ts.id = t.to_store_id
      LEFT JOIN users u1 ON u1.id = t.created_by
      LEFT JOIN users u2 ON u2.id = t.approved_by
      ${status ? 'WHERE t.status = ?' : ''}
      ORDER BY t.created_at DESC
      `,
      status ? [status] : []
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando traslados', details: err.message });
  }
};

export const createTransfer = async (req, res) => {
  const { from_store_id, to_store_id, items } = req.body;
  const user = req.session.user;
  if (!from_store_id || !to_store_id || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const [t] = await pool.query(
      `INSERT INTO transfers (from_store_id, to_store_id, created_by, status)
       VALUES (?, ?, ?, 'PENDIENTE')`,
      [from_store_id, to_store_id, user.id]
    );
    const transferId = t.insertId;

    for (const it of items) {
      await pool.query(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity)
         VALUES (?, ?, ?)`,
        [transferId, it.product_id, it.quantity]
      );
    }

    res.status(201).json({ message: 'Traslado creado', id: transferId });
  } catch (err) {
    res.status(500).json({ error: 'Error creando traslado', details: err.message });
  }
};

export const approveTransfer = async (req, res) => {
  const transferId = req.params.id;
  const user = req.session.user;
  try {
    const [[transfer]] = await pool.query(`SELECT * FROM transfers WHERE id = ?`, [transferId]);
    if (!transfer) return res.status(404).json({ error: 'Traslado no encontrado' });
    if (transfer.status !== 'PENDIENTE')
      return res.status(400).json({ error: 'Traslado ya procesado' });

    const [items] = await pool.query(`SELECT * FROM transfer_items WHERE transfer_id = ?`, [transferId]);

    for (const it of items) {
      // restar en tienda origen
      await pool.query(
        `UPDATE inventory SET stock = stock - ?
         WHERE store_id = ? AND product_id = ?`,
        [it.quantity, transfer.from_store_id, it.product_id]
      );
      // sumar en tienda destino
      await pool.query(
        `
        INSERT INTO inventory (store_id, product_id, stock)
        VALUES (?, ?, ?)
        ON CONFLICT (store_id, product_id)
        DO UPDATE SET stock = inventory.stock + EXCLUDED.stock
        `,
        [transfer.to_store_id, it.product_id, it.quantity]
      );
    }

    await pool.query(
      `UPDATE transfers
       SET status='COMPLETADO', approved_by=?, approved_at=NOW()
       WHERE id=?`,
      [user.id, transferId]
    );

    res.json({ message: 'Traslado aprobado y aplicado' });
    await logAction(req.session.user, 'APPROVE', 'transfer', transferId, transfer.to_store_id);

  } catch (err) {
    res.status(500).json({ error: 'Error aprobando traslado', details: err.message });
  }
};

export const cancelTransfer = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE transfers SET status='ANULADO' WHERE id=?`, [id]);
    res.json({ message: 'Traslado anulado' });
    await logAction(req.session.user, 'CANCEL', 'transfer', id);

  } catch (err) {
    res.status(500).json({ error: 'Error anulando traslado', details: err.message });
  }
};
