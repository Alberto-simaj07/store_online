// backend/src/modules/products/products.controller.js
import pool from '../../config/db.js';
import fs from 'fs';
import path from 'path';
import { logAction } from '../../middleware/logger.js';


export const listProducts = async (req, res) => {
  const { q = '', category_id, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE 1=1';

  if (q) {
    where += ' AND (p.name ILIKE ? OR p.sku ILIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category_id) {
    where += ' AND p.category_id = ?';
    params.push(category_id);
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT p.*, c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), offset]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error listando productos', details: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ? LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });

    const [imgs] = await pool.query(`SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, id ASC`, [req.params.id]);
    res.json({ ...rows[0], images: imgs });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo producto', details: err.message });
  }
};

export const createProduct = async (req, res) => {
  const { sku, name, description = '', category_id = null, price = 0, is_active = 1 } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku y name son requeridos' });

  try {
    const [dup] = await pool.query(`SELECT id FROM products WHERE sku = ? LIMIT 1`, [sku]);
    if (dup.length) return res.status(409).json({ error: 'SKU ya existe' });

    const [result] = await pool.query(
      `INSERT INTO products (sku, name, description, category_id, price, is_active) VALUES (?,?,?,?,?,?)`,
      [sku, name, description, category_id || null, price, is_active ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, sku, name });
    
    await logAction(req.session.user, 'CREATE', 'product', result.insertId, null, null, { sku, name });

  } catch (err) {
    res.status(500).json({ error: 'Error creando producto', details: err.message });
  }
};

export const updateProduct = async (req, res) => {
  const { name, description, category_id, price, is_active } = req.body;
  try {
    const [exists] = await pool.query(`SELECT * FROM products WHERE id = ?`, [req.params.id]);
    if (!exists.length) return res.status(404).json({ error: 'Producto no encontrado' });

    await pool.query(
      `UPDATE products SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category_id = ?,
        price = COALESCE(?, price),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [
        name ?? null,
        description ?? null,
        category_id ?? exists[0].category_id,
        price ?? null,
        typeof is_active === 'undefined' ? null : (is_active ? 1 : 0),
        req.params.id
      ]
    );
    res.json({ message: 'Producto actualizado' });
    await logAction(req.session.user, 'UPDATE', 'product', req.params.id);

  } catch (err) {
    res.status(500).json({ error: 'Error actualizando producto', details: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const [imgs] = await pool.query(`SELECT url FROM product_images WHERE product_id = ?`, [req.params.id]);
    await pool.query(`DELETE FROM product_images WHERE product_id = ?`, [req.params.id]);
    await pool.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);

    // Borrar archivos locales (si existen)
    imgs.forEach(i => {
      if (i.url && i.url.startsWith('/uploads/')) {
        const abs = path.join(process.cwd(), 'backend', i.url); // backend/uploads/...
        fs.existsSync(abs) && fs.unlinkSync(abs);
      }
    });

    res.json({ message: 'Producto eliminado' });
    await logAction(req.session.user, 'DELETE', 'product', req.params.id);

  } catch (err) {
    res.status(500).json({ error: 'Error eliminando producto', details: err.message });
  }
};

export const addProductImage = async (req, res) => {
  const productId = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  const url = `/uploads/${req.file.filename}`;
  const is_primary = req.body.is_primary === '1' ? 1 : 0;

  try {
    // si es primary, quitar primary anterior
    if (is_primary) {
      await pool.query(`UPDATE product_images SET is_primary = 0 WHERE product_id = ?`, [productId]);
    }
    const [r] = await pool.query(
      `INSERT INTO product_images (product_id, url, is_primary) VALUES (?,?,?)`,
      [productId, url, is_primary]
    );
    res.status(201).json({ id: r.insertId, url, is_primary });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando imagen', details: err.message });
  }
};
