# Backend (PostgreSQL)

## Requisitos
- Node.js 20+
- PostgreSQL 14+

## Variables de entorno
1. Copia `.env.example` a `.env`.
2. Ajusta valores de tu entorno local.

## Inicializar base de datos local
1. Crea la base:
   - `CREATE DATABASE store_online;`
2. Ejecuta esquema y seed:
   - `psql -U postgres -d store_online -f database/schema.postgres.sql`

## Ejecutar API
1. `npm install`
2. `npm run dev`

La API quedara en `http://localhost:4000`.

## Backup
- Script local: `npm run backup`
- Usa `pg_dump` (configurable con `PGDUMP_PATH`).

## Render
- Runtime: Node
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Env vars:
  - `DATABASE_URL` (de PostgreSQL en Render)
  - `DB_SSL=true`
  - `SESSION_SECRET`
  - `SESSION_NAME=sid_store`
  - `SESSION_COOKIE_SECURE=true`
