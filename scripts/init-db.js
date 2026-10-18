import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';
try {
 await pool.query(await readFile(new URL('../sql/schema.sql', import.meta.url), 'utf8'));
 console.log('Таблица tasks готова. Существующие данные сохранены.');
} catch (e) { console.error('Не удалось подготовить БД:', e.code || e.message); process.exitCode = 1; }
finally { await pool.end(); }
