const $=s=>document.querySelector(s);
const labels={todo:'В планах',doing:'В работе',done:'Готово',low:'Низкий',medium:'Средний',high:'Высокий'};
let tasks=[], filter='', editing=null, busy=false;
async function api(path,options={}) {
 const res=await fetch('/api'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 if(res.status===204) return;
 const data=await res.json();
 if(!res.ok) throw new Error(data.error || 'Ошибка запроса');
 return data;
}
function el(tag,cls,text) {const n=document.createElement(tag); if(cls)n.className=cls; if(text!==undefined)n.textContent=text; return n;}
function render(){
 $('#total').textContent=tasks.length;
 $('#doing').textContent=tasks.filter(t=>t.status==='doing').length;
 $('#done').textContent=tasks.filter(t=>t.status==='done').length;
 const q=$('#search').value.trim().toLocaleLowerCase();
 const visible=tasks.filter(t=>(!filter||t.status===filter)&&(`${t.title} ${t.description}`).toLocaleLowerCase().includes(q));
 $('#tasks').replaceChildren(); $('#empty').hidden=visible.length>0;
 for(const t of visible){
  const card=el('article','task-card '+t.status);
  const top=el('div','card-top'); top.append(el('span','badge '+t.priority,labels[t.priority]+' приоритет'));
  const edit=el('button','icon-button','✎'); edit.setAttribute('aria-label','Редактировать '+t.title); edit.onclick=()=>openEditor(t); top.append(edit);
  card.append(top,el('h2','',t.title),el('p','description',t.description || 'Без описания'));
  const footer=el('div','card-footer');
  const select=el('select','status-select'); select.setAttribute('aria-label','Статус задачи '+t.title);
  for(const s of ['todo','doing','done']){const o=el('option','',labels[s]);o.value=s;select.append(o);} select.value=t.status;
  select.onchange=async()=>{select.disabled=true;try{await api('/tasks/'+t.id,{method:'PUT',body:JSON.stringify({...t,status:select.value})});await load();}catch(e){$('#message').textContent=e.message;select.value=t.status;}finally{select.disabled=false;}};
  footer.append(select,el('span','date',t.due_date ? t.due_date.split('-').reverse().join('.') : 'Без срока'));
  const del=el('button','delete','Удалить');del.onclick=async()=>{if(!confirm('Удалить задачу «'+t.title+'»?'))return;del.disabled=true;try{await api('/tasks/'+t.id,{method:'DELETE'});await load();}catch(e){$('#message').textContent=e.message;del.disabled=false;}};
  card.append(footer,del); $('#tasks').append(card);
 }
}
async function load(){try{tasks=await api('/tasks');$('#message').textContent='';render();}catch(e){$('#message').textContent=e.message;}}
function openEditor(t){editing=t?.id || null;$('#task-form').reset();$('#form-error').textContent='';$('#modal-title').textContent=t?'Редактирование':'Новая задача';if(t)for(const k of ['title','description','status','priority','due_date'])$('#task-form').elements[k].value=t[k] || '';$('#editor').showModal();}
$('#new-task').onclick=()=>openEditor();
for(const id of ['close','cancel'])$('#'+id).onclick=()=>{if(!busy)$('#editor').close();};
$('#editor').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
$('#task-form').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;$('#save').disabled=true;$('#form-error').textContent='';const body=Object.fromEntries(new FormData(e.target));body.due_date=body.due_date||null;try{await api(editing?'/tasks/'+editing:'/tasks',{method:editing?'PUT':'POST',body:JSON.stringify(body)});$('#editor').close();await load();}catch(e){$('#form-error').textContent=e.message;}finally{busy=false;$('#save').disabled=false;}};
$('#search').oninput=render;
for(const b of document.querySelectorAll('[data-status]'))b.onclick=()=>{filter=b.dataset.status;for(const n of document.querySelectorAll('[data-status]')){n.classList.toggle('selected',n===b);n.setAttribute('aria-pressed',String(n===b));}render();};
$('#message').textContent='Загрузка задач…';load();
