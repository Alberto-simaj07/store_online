import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
import pool from '../../config/db.js';

const router = express.Router();

router.get('/', isAuth, isGerente, async (req, res) => {
  const { user_id, entity, store_id } = req.query;
  let where = 'WHERE 1=1';
  const params = [];

  if (user_id) { where += ' AND l.user_id = ?'; params.push(user_id); }
  if (entity) { where += ' AND l.entity = ?'; params.push(entity); }
  if (store_id) { where += ' AND l.store_id = ?'; params.push(store_id); }

  try {
    const [rows] = await pool.query(
      `
      SELECT l.*, u.name AS user_name
      FROM user_logs l
      JOIN users u ON u.id = l.user_id
      ${where}
      ORDER BY l.created_at DESC
      LIMIT 200
      `,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo logs', details: err.message });
  }
});

export default router;
