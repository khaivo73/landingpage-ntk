import {spawn} from 'node:child_process';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {FORMATS} from './project.mjs';
export function run(cmd,args,timeout=120000){return new Promise((resolve,reject)=>{const c=spawn(cmd,args,{stdio:['ignore','pipe','pipe']});let out='',err='';c.stdout.on('data',b=>out+=b);c.stderr.on('data',b=>err=(err+b).slice(-12000));const timer=setTimeout(()=>c.kill('SIGKILL'),timeout);c.on('error',e=>{clearTimeout(timer);reject(e)});c.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error(`${cmd}: ${err||'exit '+code}`))})})}
export async function render(job,{origin,dataDir}){
 const p=job.project,dir=path.join(dataDir,'outputs',job.id),frames=path.join(dir,'frames');await mkdir(frames,{recursive:true});let browser;
 try{
  job.status='rendering';job.message='Đang dựng từng khung hình';
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});const page=await browser.newPage({viewport:{width:FORMATS[p.format][0],height:FORMATS[p.format][1]},deviceScaleFactor:1,...(process.env.APP_PASSWORD?{httpCredentials:{username:"admin",password:process.env.APP_PASSWORD}}:{})});
  await page.goto(`${origin}/render.html?job=${job.id}`);await page.waitForFunction(()=>window.ready,{},{timeout:30000});
  const count=Math.round(p.scenes.reduce((n,s)=>n+s.duration,0)*p.fps);const points=[];let cursor=0;for(const s of p.scenes){points.push(Math.min(count-1,Math.round((cursor+Math.min(.9,s.duration/2))*p.fps)));cursor+=s.duration}
  for(let i=0;i<count;i++){if(job.cancelled)throw Error('Đã hủy');await page.evaluate(frame=>window.renderFrame(frame),i);const filename=path.join(frames,`frame-${String(i).padStart(6,'0')}.png`);await page.locator('canvas').screenshot({path:filename,animations:'disabled'});if(points.includes(i))await page.locator('canvas').screenshot({path:path.join(dir,`scene-${points.indexOf(i)+1}.png`)});job.progress=Math.round((i+1)/count*85)}
  await browser.close();browser=null;job.status='encoding';job.message='Đang ghép MP4 và âm thanh';const duration=count/p.fps;
  const args=['-y','-framerate',String(p.fps),'-i',path.join(frames,'frame-%06d.png')];if(p.audio)args.push('-stream_loop','-1','-i',path.join(dataDir,p.audio.slice(1)));
  args.push('-map','0:v:0');if(p.audio)args.push('-map','1:a:0','-af',`volume=${p.volume},afade=t=out:st=${Math.max(0,duration-.5)}:d=0.5`,'-c:a','aac');
  args.push('-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-threads','2','-t',String(duration),'-movflags','+faststart',path.join(dir,'final.mp4'));await run('ffmpeg',args,300000);if(job.cancelled)throw Error('Đã hủy');
  const probe=JSON.parse(await run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(dir,'final.mp4')]));
  const video=probe.streams.find(s=>s.codec_type==='video');if(!video||video.width!==FORMATS[p.format][0]||video.height!==FORMATS[p.format][1]||Math.abs(Number(probe.format.duration)-duration)>.15)throw Error('Kết quả không đạt kiểm tra kỹ thuật');
  const report={project:p.name,createdAt:new Date().toISOString(),frames:count,duration,width:video.width,height:video.height,fps:p.fps,hasAudio:probe.streams.some(s=>s.codec_type==='audio'),checks:['Đúng kích thước','Đúng thời lượng','MP4 H.264 / yuv420p','Chụp khung hình theo thời gian xác định'],limitations:['Chưa có AI chấm chất lượng thẩm mỹ.','BPM do người dùng nhập; chưa tự nhận diện nhịp nhạc.'],scenes:points.map((_,i)=>`/outputs/${job.id}/scene-${i+1}.png`)};
  await writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2));job.report=report;job.status='done';job.progress=100;job.message='Video đã sẵn sàng';job.url=`/outputs/${job.id}/final.mp4`;
 }catch(e){job.status=job.cancelled?'cancelled':'error';job.message=job.cancelled?'Đã hủy xuất video':e.message;}
 finally{await browser?.close();await rm(frames,{recursive:true,force:true});job.finishedAt=new Date().toISOString()}
}
