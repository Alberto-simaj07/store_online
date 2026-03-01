import pool from '../../config/db.js';
import bcrypt from 'bcrypt';

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? LIMIT 1`,
      [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Guardar datos en sesión
    req.session.user = {
      id: user.id,
      name: user.name,
      role: user.role
    };

    res.json({ message: 'Inicio de sesión exitoso', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno', details: err.message });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    res.clearCookie(process.env.SESSION_NAME);
    res.json({ message: 'Sesión cerrada' });
  });
};

export const me = (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: 'No autenticado' });
  res.json(req.session.user);
};
