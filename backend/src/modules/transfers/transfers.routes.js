// backend/src/modules/transfers/transfers.routes.js
import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
import {
  listTransfers,
  createTransfer,
  approveTransfer,
  cancelTransfer
} from './transfers.controller.js';

const router = express.Router();

// Listar
router.get('/', isAuth, listTransfers);

// Crear traslado (Gerente/Admin)
router.post('/', isAuth, isGerente, createTransfer);

// Aprobar traslado
router.post('/:id/approve', isAuth, isGerente, approveTransfer);

// Anular traslado
router.post('/:id/cancel', isAuth, isGerente, cancelTransfer);

export default router;
