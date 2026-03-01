import express from 'express';
import { login, logout, me } from './auth.controller.js';

const router = express.Router();

router.post('/login', login);

router.get('/me', me);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout exitoso' });
  });
});

export default router;
