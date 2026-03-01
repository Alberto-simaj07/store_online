// backend/src/modules/products/products.routes.js
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { isAuth, isGerente } from '../../middleware/auth.js';
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, addProductImage
} from './products.controller.js';

const router = express.Router();

// Configuración de multer (subidas locales)
const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Público: listado (para catálogo)
router.get('/', listProducts);
router.get('/:id', getProduct);

// Privado (ADMIN/GERENTE): CRUD
router.post('/', isAuth, isGerente, createProduct);
router.put('/:id', isAuth, isGerente, updateProduct);
router.delete('/:id', isAuth, isGerente, deleteProduct);

// Subida de imagen
router.post('/:id/images', isAuth, isGerente, upload.single('image'), addProductImage);

export default router;
