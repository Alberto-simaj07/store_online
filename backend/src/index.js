// backend/src/index.js
import 'dotenv/config';
import adminRoutes from './modules/admin/admin.routes.js';
import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import helmet from 'helmet';
import { isAuth, isAdmin } from './middleware/auth.js';
import path from 'path';
import productsRoutes from './modules/products/products.routes.js';
import pool from './config/db.js';
import authRoutes from './modules/auth/auth.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import transfersRoutes from './modules/transfers/transfers.routes.js';
import quotesRoutes from './modules/quotes/quotes.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import salesRoutes from './modules/sales/sales.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import logsRoutes from './modules/logs/logs.routes.js';
import usersRoutes from './modules/users/users.routes.js';


const {
  PORT = 4000,
  SESSION_SECRET = 'secret',
  SESSION_NAME = 'sid',
  SESSION_COOKIE_SECURE = 'false'
} = process.env;
const isSecureCookie = SESSION_COOKIE_SECURE === 'true';

const app = express();

/* 1) Middlewares base SIEMPRE primero */
app.use(helmet());

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* 2) Sesiones ANTES de las rutas */
const PgSessionStore = connectPgSimple(session);
const sessionStore = new PgSessionStore({
  pool: pool.rawPool,
  tableName: 'session',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15
});

if (isSecureCookie) {
  app.set('trust proxy', 1);
}

app.use(session({
  name: SESSION_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: isSecureCookie ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

/* 3) Rutas */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/inventory', inventoryRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/backups', express.static(path.join(process.cwd(), 'backups')));
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes);


// DEBUG opcional: comprobar que la sesión existe
app.get('/api/_session-check', (req, res) => {
  res.json({ hasSessionObj: !!req.session });
});

// servir estáticos de uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'backend', 'uploads')));

// montar rutas de productos
app.use('/api/products', productsRoutes);


app.get('/api/stores', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stores');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed', details: err.message });
  }
});

app.get('/api/private', isAuth, (req, res) => {
  res.json({ message: `Hola ${req.session.user.name}, estás autenticado.` });
});

app.get('/api/admin-only', isAdmin, (req, res) => {
  res.json({ message: `Hola ${req.session.user.name}, eres administrador.` });
});

// Módulo de autenticación (después de session)
app.use('/api/auth', authRoutes);

/* 4) Not found */
app.use((_req, res) => res.status(404).json({ error: 'Not Found' }));

/* 5) Listen */
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
