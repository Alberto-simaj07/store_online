// backend/src/middleware/logger.js
import pool from '../config/db.js';

export const logAction = async (user, action, entity, entity_id, store_id = null, before = null, after = null) => {
  try {
    if (!user) return; // solo si hay sesión
    await pool.query(
      `INSERT INTO user_logs (user_id, action, entity, entity_id, store_id, before_json, after_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        action,
        entity,
        entity_id ? String(entity_id) : null,
        store_id,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null
      ]
    );
  } catch (err) {
    console.error('Error al registrar log:', err.message);
  }
};
