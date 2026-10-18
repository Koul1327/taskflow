import {pool} from './db.js';
import {createApp} from './app.js';
const host=process.env.HOST || '127.0.0.1';
const port=Number(process.env.PORT || 3000);
try {
 await pool.query('SELECT id FROM tasks LIMIT 1');
 const server=createApp(pool).listen(port,host,()=>console.log(`Taskflow: http://${host}:${port}`));
 server.on('error',async e=>{ console.error('Не удалось запустить сервер:',e.code); await pool.end(); process.exitCode=1; });
 for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(async()=>{await pool.end();process.exit(0);}));
} catch(e) { console.error('БД недоступна или таблица не создана. Проверьте .env и выполните npm run db:init. Код:',e.code); await pool.end(); process.exitCode=1; }
