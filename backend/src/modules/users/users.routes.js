import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
import { listUsers, createUser, updateRole, deactivateUser } from './users.controller.js';

const router = express.Router();

router.get('/', isAuth, isGerente, listUsers);
router.post('/', isAuth, isGerente, createUser);
router.put('/:id/role', isAuth, isGerente, updateRole);
router.delete('/:id', isAuth, isGerente, deactivateUser);

export default router;
