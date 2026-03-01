import pool from '../../config/db.js';

// Lista básica
export const listUsers = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role_id, r.name AS role
     FROM users u JOIN roles r ON r.id=u.role_id
     ORDER BY u.id DESC`
  );
  res.json(rows);
};

// Crear usuario (password en texto → se hashea)
import bcrypt from 'bcrypt';
export const createUser = async (req, res) => {
  const { name, email, password, role_id } = req.body;
  if (!name || !email || !password || !role_id) return res.status(400).json({ error: 'Campos requeridos' });
  const hash = await bcrypt.hash(password, 10);
  const r = await pool.query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES (?,?,?,?)',
    [name, email, hash, role_id]
  );
  res.status(201).json({ id: r[0].insertId });
};

// Cambiar rol
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { role_id } = req.body;
  await pool.query('UPDATE users SET role_id=? WHERE id=?', [role_id, id]);
  res.json({ message: 'Rol actualizado' });
};

// (Opcional) Desactivar usuario
export const deactivateUser = async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE users SET is_active=0 WHERE id=?', [id]);
  res.json({ message: 'Usuario desactivado' });
};
