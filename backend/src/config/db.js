import pg from 'pg';

const { Pool } = pg;

const dbSsl =
  process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false;

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: dbSsl
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'store_online',
      ssl: dbSsl
    };

const pgPool = new Pool(connectionConfig);

const normalizeSql = (sql) => sql.trim().replace(/;+\s*$/g, '');

const convertPlaceholders = (sql) => {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
};

const shouldAppendReturningId = (sql) => {
  const compact = normalizeSql(sql);
  return /^insert\s+/i.test(compact) && !/\breturning\b/i.test(compact);
};

const runQuery = async (executor, sql, params = []) => {
  const compact = normalizeSql(sql);
  let text = convertPlaceholders(compact);

  if (shouldAppendReturningId(compact)) {
    text += ' RETURNING id';
  }

  const result = await executor(text, params);

  if (/^(select|with)\b/i.test(compact)) {
    return [result.rows];
  }

  if (/^insert\b/i.test(compact)) {
    return [
      {
        insertId: result.rows?.[0]?.id ?? null,
        affectedRows: result.rowCount,
        rowCount: result.rowCount
      }
    ];
  }

  return [
    {
      affectedRows: result.rowCount,
      rowCount: result.rowCount
    }
  ];
};

const db = {
  rawPool: pgPool,
  query(sql, params = []) {
    return runQuery((text, values) => pgPool.query(text, values), sql, params);
  },
  async getConnection() {
    const client = await pgPool.connect();
    return {
      query(sql, params = []) {
        return runQuery((text, values) => client.query(text, values), sql, params);
      },
      beginTransaction() {
        return client.query('BEGIN');
      },
      commit() {
        return client.query('COMMIT');
      },
      rollback() {
        return client.query('ROLLBACK');
      },
      release() {
        client.release();
      }
    };
  }
};

export default db;
