import pg from 'pg';
export const pool = new pg.Pool({ connectionTimeoutMillis: 5000, max: 5 });
pool.on('error', () => console.error('Соединение с PostgreSQL потеряно.'));
