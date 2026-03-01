import express from 'express';
import { isAuth, isGerente } from '../../middleware/auth.js';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';

const router = express.Router();

router.post('/backup', isAuth, isGerente, (req, res) => {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, PGDUMP_PATH } = process.env;
  const outDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outfile = path.join(outDir, `${DB_NAME}-${ts}.sql`);
  const dump = DB_PASS
    ? `set PGPASSWORD=${DB_PASS} && "${PGDUMP_PATH || 'pg_dump'}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${outfile}"`
    : `"${PGDUMP_PATH || 'pg_dump'}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${outfile}"`;

  exec(dump, (err) => {
    if (err) return res.status(500).json({ error: 'Backup falló', details: err.message });
    res.json({ message: 'Backup generado', file: `/backups/${path.basename(outfile)}` });
  });
});

export default router;
