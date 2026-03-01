import express from 'express';
import { isAuth } from '../../middleware/auth.js';
import { listInventory, adjustInventory } from './inventory.controller.js';

const router = express.Router();
router.get('/', isAuth, listInventory);
router.put('/adjust', isAuth, adjustInventory);
export default router;
