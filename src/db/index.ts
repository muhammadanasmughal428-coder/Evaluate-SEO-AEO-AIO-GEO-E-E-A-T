// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads and serverless invocations
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
    let poolConfig: PoolConfig;

    if (connectionString) {
      // Universal connection string for Vercel Postgres, Neon, Supabase, Railway, Render, etc.
      const requiresSsl =
        connectionString.includes('sslmode=require') ||
        connectionString.includes('ssl=true') ||
        connectionString.includes('neon.tech') ||
        connectionString.includes('supabase.co') ||
        connectionString.includes('pooler.supabase.com') ||
        connectionString.includes('render.com') ||
        process.env.SQL_SSL === 'true' ||
        process.env.NODE_ENV === 'production';

      poolConfig = {
        connectionString,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        max: process.env.NODE_ENV === 'production' ? 10 : 5,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 30000,
      };
    } else {
      // Dedicated variables for Cloud SQL, Docker, or self-hosted Postgres
      const isCloudOrProd =
        process.env.NODE_ENV === 'production' &&
        process.env.SQL_HOST &&
        !process.env.SQL_HOST.includes('localhost') &&
        !process.env.SQL_HOST.includes('127.0.0.1');

      poolConfig = {
        host: process.env.SQL_HOST || '127.0.0.1',
        port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
        user: process.env.SQL_USER || 'postgres',
        password: process.env.SQL_PASSWORD || '',
        database: process.env.SQL_DB_NAME || 'postgres',
        ssl:
          process.env.SQL_SSL === 'true' || isCloudOrProd
            ? { rejectUnauthorized: false }
            : undefined,
        max: 10,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 30000,
      };
    }

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application process
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on SQL pool client:', err.message || err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
