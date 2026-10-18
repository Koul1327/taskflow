import express from 'express';
import { fileURLToPath } from 'node:url';
const statuses = ['todo', 'doing', 'done'];
const priorities = ['low', 'medium', 'high'];
function validate(body) {
 if (!body || typeof body !== 'object' || Array.isArray(body)) return 'Нужен JSON-объект.';
 if (typeof body.title !== 'string' || !body.title.trim() || body.title.trim().length > 160) return 'Название: от 1 до 160 символов.';
 if (typeof body.description !== 'string' || body.description.length > 4000) return 'Описание: до 4000 символов.';
 if (!statuses.includes(body.status) || !priorities.includes(body.priority)) return 'Некорректный статус или приоритет.';
 if (body.due_date !== null) {
  if (typeof body.due_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) return 'Некорректная дата.';
  const d = new Date(body.due_date + 'T00:00:00Z');
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== body.due_date || body.due_date < '0001-01-01') return 'Некорректная дата.';
 }
}
const columns = "id, title, description, status, priority, to_char(due_date, 'YYYY-MM-DD') AS due_date, created_at, updated_at";
export function createApp(pool) {
 const app = express();
 app.disable('x-powered-by');
 app.use((req,res,next) => {
  res.set('X-Content-Type-Options','nosniff');
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  if (req.path.startsWith('/api/')) res.set('Cache-Control','no-store');
  next();
 });
 app.use(express.json({limit:'32kb'}));
 app.get('/api/tasks', async (req,res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.slice(0,160) : '';
  const status = req.query.status || '';
  if (status && !statuses.includes(status)) return res.status(400).json({error:'Некорректный фильтр.'});
  const result = await pool.query(`SELECT ${columns} FROM tasks WHERE ($1 = '' OR strpos(lower(title || ' ' || description), lower($1)) > 0) AND ($2 = '' OR status = $2) ORDER BY created_at DESC, id DESC`, [q,status]);
  res.json(result.rows);
 });
 app.post('/api/tasks', async (req,res) => {
  const error = validate(req.body);
  if (error) return res.status(400).json({error});
  const b=req.body;
  const result=await pool.query(`INSERT INTO tasks(title,description,status,priority,due_date) VALUES($1,$2,$3,$4,$5) RETURNING ${columns}`, [b.title.trim(),b.description,b.status,b.priority,b.due_date]);
  res.status(201).json(result.rows[0]);
 });
 app.param('id',(req,res,next,value) => {
  if (!/^[1-9]\d*$/.test(value) || Number(value)>2147483647) return res.status(400).json({error:'Некорректный ID.'});
  next();
 });
 app.put('/api/tasks/:id', async (req,res) => {
  const error=validate(req.body);
  if (error) return res.status(400).json({error});
  const b=req.body;
  const result=await pool.query(`UPDATE tasks SET title=$1,description=$2,status=$3,priority=$4,due_date=$5,updated_at=now() WHERE id=$6 RETURNING ${columns}`, [b.title.trim(),b.description,b.status,b.priority,b.due_date,req.params.id]);
  if (!result.rowCount) return res.status(404).json({error:'Задача не найдена.'});
  res.json(result.rows[0]);
 });
 app.delete('/api/tasks/:id', async (req,res) => {
  const result=await pool.query('DELETE FROM tasks WHERE id=$1',[req.params.id]);
  if (!result.rowCount) return res.status(404).json({error:'Задача не найдена.'});
  res.status(204).end();
 });
 app.use('/api', (req,res) => res.status(404).json({error:'Маршрут не найден.'}));
 app.use(express.static(fileURLToPath(new URL('./public',import.meta.url))));
 app.use((err,req,res,next) => {
  if (err.type==='entity.parse.failed') return res.status(400).json({error:'Некорректный JSON.'});
  if (err.status===413) return res.status(413).json({error:'Запрос слишком большой.'});
  console.error('Ошибка запроса:',err.code || err.name);
  res.status(500).json({error:'Не удалось выполнить запрос. Проверьте подключение к базе данных.'});
 });
 return app;
}
