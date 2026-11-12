import dns from 'dns';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

// Ensure IPv4 is prioritized to avoid Windows Node.js IPv6 handshake timeout on cloud Postgres (Neon)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const db = {
  async query<T extends QueryResultRow = any>(text: string, params?: any[], retries = 2): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (env.NODE_ENV === 'development') {
        console.log(`[SQL Query] (${duration}ms) ${text.replace(/\s+/g, ' ').trim()}`);
      }
      return res;
    } catch (err: any) {
      const isTransient =
        err.message?.includes('Connection terminated') ||
        err.message?.includes('timeout') ||
        err.message?.includes('Connection closed') ||
        err.code === 'ECONNRESET' ||
        err.code === '57P01';

      if (retries > 0 && isTransient) {
        console.warn(`[DB Query Retry] Retrying query after transient connection issue: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return db.query<T>(text, params, retries - 1);
      }
      throw err;
    }
  },

  async getClient(): Promise<PoolClient> {
    return pool.connect();
  },

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },
};

export default db;
