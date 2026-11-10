import http from 'node:http';
import {readFile,writeFile,mkdir,readdir,stat,rename,unlink} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {validateProject,demo} from './lib/project.mjs';
import {render,run} from './lib/render.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
for(const dir of ['projects','assets','outputs','jobs'])await mkdir(path.join(dataDir,dir),{recursive:true});
const password=process.env.APP_PASSWORD||'';
if(process.env.NODE_ENV==='production'&&password.length<12)throw Error('APP_PASSWORD cần ít nhất 12 ký tự trong production');
const jobs=new Map(),queue=[];let running=false,origin;
for(const file of await readdir(path.join(dataDir,'jobs'))){try{const j=JSON.parse(await readFile(path.join(dataDir,'jobs',file)));if(['queued','rendering','encoding'].includes(j.status)){j.status='error';j.message='Máy chủ khởi động lại. Vui lòng xuất lại.'}jobs.set(j.id,j)}catch{}}
const idOK=s=>/^[a-f0-9-]{36}$/.test(s);
const json=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(obj))};
const bad=(message,status=400)=>Object.assign(new Error(message),{status});
async function body(req,limit=1024*1024){const parts=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>limit)throw bad('Tệp vượt dung lượng cho phép',413);parts.push(chunk)}return Buffer.concat(parts)}
async function input(req){try{return JSON.parse((await body(req)).toString())}catch(e){if(e.status)throw e;throw bad('JSON không hợp lệ')}}
async function atomic(file,value){const tmp=file+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(value,null,2));await rename(tmp,file)}
function publicJob(j){const {project,...rest}=j;return rest}
async function persistJob(j){await atomic(path.join(dataDir,'jobs',j.id+'.json'),publicJob(j))}
async function pump(){if(running)return;running=true;try{while(queue.length){const j=queue.shift();if(j.cancelled){j.status='cancelled';j.message='Đã hủy';await persistJob(j);continue}await render(j,{origin,dataDir});await persistJob(j)}}finally{running=false}}
async function checkAssets(p){for(const src of [...p.scenes.map(s=>s.image),p.audio].filter(Boolean)){try{await stat(path.join(dataDir,src.slice(1)))}catch{throw bad('Thiếu tài nguyên '+src)}}}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.mp4':'video/mp4','.json':'application/json; charset=utf-8'};
async function serve(req,res,file){const s=await stat(file);if(!s.isFile())throw bad('Không tìm thấy',404);const type=types[path.extname(file)]||'application/octet-stream';let start=0,end=s.size-1;const range=req.headers.range;if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m){res.writeHead(416,{'Content-Range':`bytes */${s.size}`});return res.end()}if(!m[1]){start=Math.max(0,s.size-Number(m[2]))}else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}if(start>end||start>=s.size){res.writeHead(416,{'Content-Range':`bytes */${s.size}`});return res.end()}}
res.writeHead(range?206:200,{'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes',...(range?{'Content-Range':`bytes ${start}-${end}/${s.size}`}:{})});if(req.method==='HEAD')return res.end();createReadStream(file,{start,end}).pipe(res)}
export const server=http.createServer(async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'self'");res.setHeader('Cache-Control','no-store');
 if(password){const expected=Buffer.from('Basic '+Buffer.from('admin:'+password).toString('base64')),actual=Buffer.from(req.headers.authorization||'');if(actual.length!==expected.length||!timingSafeEqual(actual,expected)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Motion Studio"'});return res.end('Đăng nhập với tài khoản admin')}}
 if(!['GET','HEAD'].includes(req.method)){if(req.headers['sec-fetch-site']==='cross-site')throw bad('Không chấp nhận yêu cầu khác nguồn',403);if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw bad('Nguồn yêu cầu không hợp lệ',403)}
 const u=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(u.pathname),parts=pathname.split('/').filter(Boolean);
 if(pathname==='/api/health'){let ffmpeg=true,chromium=true;try{await run('ffmpeg',['-version'],5000)}catch{ffmpeg=false}try{const {chromium:pw}=await import('playwright');await stat(process.env.CHROMIUM_PATH||pw.executablePath())}catch{chromium=false}return json(res,200,{ok:true,ffmpeg,chromium,authentication:!!password,version:'1.0.0'})}
 if(pathname==='/api/demo'&&req.method==='GET')return json(res,200,demo);
 if(parts[0]==='api'&&parts[1]==='projects'){
  const id=parts[2];if(id&&!idOK(id))throw bad('ID không hợp lệ');
  if(req.method==='GET'&&!id){const list=[];for(const f of await readdir(path.join(dataDir,'projects'))){if(!f.endsWith('.json'))continue;const p=JSON.parse(await readFile(path.join(dataDir,'projects',f)));if(!p.archived)list.push(p)}return json(res,200,list.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)))}
  if(req.method==='POST'&&!id){const p=validateProject(await input(req));await checkAssets(p);const saved={...p,id:randomUUID(),updatedAt:new Date().toISOString()};await atomic(path.join(dataDir,'projects',saved.id+'.json'),saved);return json(res,201,saved)}
  if(id){const file=path.join(dataDir,'projects',id+'.json');const existing=JSON.parse(await readFile(file));if(req.method==='GET')return json(res,200,existing);if(req.method==='PUT'){const p=validateProject(await input(req));await checkAssets(p);const saved={...p,id,updatedAt:new Date().toISOString()};await atomic(file,saved);return json(res,200,saved)}if(req.method==='DELETE'){await atomic(file,{...existing,archived:true});return json(res,200,{ok:true})}}
 }
 if(pathname==='/api/assets'&&req.method==='POST'){
  const data=await body(req,20*1024*1024);if(!data.length)throw bad('Tệp trống');const mime=(req.headers['content-type']||'').split(';')[0],extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/ogg':'ogg','audio/mp4':'m4a','audio/x-m4a':'m4a'};const ext=extensions[mime];if(!ext)throw bad('Chỉ hỗ trợ PNG, JPG, WebP, MP3, WAV, OGG, M4A');
  if(ext==='png'&&data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||ext==='jpg'&&data.subarray(0,3).toString('hex')!=='ffd8ff'||ext==='webp'&&(data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP'))throw bad('Nội dung ảnh không hợp lệ');
  const id=randomUUID(),file=path.join(dataDir,'assets',id+'.'+ext);await writeFile(file,data);try{const probe=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-of','json',file],10000));if(!probe.streams.some(s=>s.codec_type===(mime.startsWith('image/')?'video':'audio')))throw Error('Sai loại dữ liệu');if(probe.streams.some(s=>(s.width||0)*(s.height||0)>40000000))throw Error('Ảnh quá lớn')}catch{await unlink(file);throw bad('Tệp không đọc được hoặc ảnh vượt 40 megapixel')}
  return json(res,201,{url:'/assets/'+id+'.'+ext,name:(u.searchParams.get('name')||'Tài nguyên').slice(0,150),type:mime,size:data.length})
 }
 if(parts[0]==='api'&&parts[1]==='jobs'){
  const id=parts[2];if(req.method==='GET')return json(res,200,id?(jobs.has(id)?publicJob(jobs.get(id)):(()=>{throw bad('Không có tác vụ',404)})()):[...jobs.values()].reverse().map(publicJob));
  if(req.method==='POST'&&!id){if(queue.length+(running?1:0)>=5)throw bad('Hàng đợi đầy, vui lòng chờ',429);if(jobs.size>=200)throw bad('Đã đạt giới hạn 200 bản xuất; hãy dọn dữ liệu trên máy chủ',429);const p=validateProject(await input(req));await checkAssets(p);const j={id:randomUUID(),name:p.name,project:p,status:'queued',progress:0,message:'Đang chờ xuất',createdAt:new Date().toISOString()};jobs.set(j.id,j);queue.push(j);await persistJob(j);json(res,202,publicJob(j));void pump();return}
  if(req.method==='DELETE'&&id){const j=jobs.get(id);if(!j)throw bad('Không có tác vụ',404);if(['done','error','cancelled'].includes(j.status))throw bad('Tác vụ đã kết thúc');j.cancelled=true;j.message='Đang hủy…';return json(res,200,publicJob(j))}
 }
 if(parts[0]==='api'&&parts[1]==='render-project'&&idOK(parts[2]||'')){const j=jobs.get(parts[2]);if(!j?.project)throw bad('Không có dự án render',404);return json(res,200,j.project)}
 if(['GET','HEAD'].includes(req.method)){
  if(parts[0]==='assets'){if(parts.length!==2||!/^[-a-f0-9]+\.(png|jpg|webp|mp3|wav|ogg|m4a)$/.test(parts[1]))throw bad('Không tìm thấy',404);return await serve(req,res,path.join(dataDir,...parts))}
  if(parts[0]==='outputs'){if(parts.length!==3||!idOK(parts[1])||! /^(final\.mp4|report\.json|scene-\d+\.png)$/.test(parts[2]))throw bad('Không tìm thấy',404);return await serve(req,res,path.join(dataDir,...parts))}
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/engine.js':'engine.js','/render.html':'render.html'};if(pathname==='/schema.js')return await serve(req,res,path.join(root,'lib','project.mjs'));if(files[pathname])return await serve(req,res,path.join(root,'public',files[pathname]));
 }
 throw bad('Không tìm thấy',404);
 }catch(e){if(res.headersSent){res.destroy();return}json(res,e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'Không tìm thấy dữ liệu':'Máy chủ không xử lý được yêu cầu'})}});
const cliValue=flag=>{const i=process.argv.indexOf(flag);return i>=0?process.argv[i+1]:undefined};
const port=Number(cliValue('--port')||process.env.PORT||3000);server.listen(port,cliValue('--host')||process.env.HOST||'127.0.0.1',()=>{origin=`http://127.0.0.1:${server.address().port}`;console.log(`Motion Studio: ${origin}`)});
