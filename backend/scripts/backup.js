import 'dotenv/config';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

const PG_DUMP = process.env.PGDUMP_PATH || 'pg_dump';

const outDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const outfile = path.join(outDir, `${DB_NAME}-${ts}.sql`);

const cmd = DB_PASS
  ? `set PGPASSWORD=${DB_PASS} && "${PG_DUMP}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${outfile}"`
  : `"${PG_DUMP}" -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -F p -f "${outfile}"`;

console.log('Ejecutando:', cmd);
exec(cmd, (err) => {
  if (err) {
    console.error('Error en backup:', err.message);
    process.exit(1);
  }
  console.log('Backup generado en:', outfile);
  process.exit(0);
});
