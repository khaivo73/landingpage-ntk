export const totalDuration=p=>p.scenes.reduce((n,s)=>n+s.duration,0);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sceneAt(p,time){let start=0;for(let i=0;i<p.scenes.length;i++){const s=p.scenes[i];if(time<start+s.duration||i===p.scenes.length-1)return {scene:s,index:i,local:clamp(time-start,0,s.duration),start};start+=s.duration}}
function wrapped(ctx,text,maxWidth){const rows=[];for(const paragraph of text.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){rows.push(line);line=word}else line=next}rows.push(line)}return rows}
export async function loadImages(p){const map=new Map();await Promise.all([...new Set(p.scenes.map(s=>s.image).filter(Boolean))].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{map.set(src,img);resolve()};img.onerror=()=>reject(new Error('Không đọc được ảnh: '+src));img.src=src})));await document.fonts.ready;return map}
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
export function draw(canvas,p,time,images=new Map()){
 const c=canvas.getContext('2d'), W=canvas.width,H=canvas.height,scale=W/1080; c.save();c.scale(scale,scale);const w=1080,h=H/scale;
 const {scene:s,index,local:t}=sceneAt(p,time);c.fillStyle=s.background;c.fillRect(0,0,w,h);
 // The same deterministic timestamp drives preview and exported frames.
 const progress=s.motion==='spring'?1-Math.exp(-7*t)*Math.cos(11*t):s.motion==='slide'?1-Math.pow(1-clamp(t/0.8,0,1),3):clamp(t/0.7,0,1);
 const fade=clamp(t/0.3,0,1)*clamp((s.duration-t)/0.2,0,1);
 c.globalAlpha=.12;c.strokeStyle=s.accent;c.lineWidth=1;for(let x=0;x<=w;x+=90){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}for(let y=0;y<h;y+=90){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
 c.globalAlpha=.1;c.fillStyle=s.accent;c.beginPath();c.arc(w*.88,h*.35,240+Math.sin(t)*15,0,Math.PI*2);c.fill();c.globalAlpha=1;
 c.fillStyle='#ffffff';c.font='bold 28px Arial';c.fillText(p.brand,72,85);c.fillStyle=s.accent;c.fillRect(72,108,40,4);c.font='20px Arial';c.fillStyle='#ffffff80';c.fillText(String(index+1).padStart(2,'0')+' / '+String(p.scenes.length).padStart(2,'0'),900,85);
 c.save();c.globalAlpha=fade;c.translate(0,(1-progress)*100);
 const compact=h<1300;const image=images.get(s.image);let textY=compact?210:300;const fontSize=compact?80:100;let maxText=s.layout==='split'&&compact?520:936;
 c.fillStyle=s.accent;c.font='bold 22px Arial';c.fillText(s.eyebrow,72,textY);textY+=85;c.font=`bold ${fontSize}px Arial`;c.fillStyle='#ffffff';const lines=wrapped(c,s.title,maxText);for(const line of lines){c.fillText(line,72,textY);textY+=fontSize*1.13}
 textY+=30;c.font='30px Arial';c.fillStyle='#ffffffb8';for(const line of wrapped(c,s.subtitle,maxText)){c.fillText(line,72,textY);textY+=44}
 const boxY=compact?Math.max(textY+40,550):Math.max(textY+100,820),boxH=compact?Math.max(180,h-boxY-160):Math.min(650,h-boxY-230);
 if(image){let bx=72,by=boxY,bw=936,bh=Math.max(160,boxH);if(compact&&s.layout==='split'){bx=650;by=180;bw=358;bh=h-340}c.save();round(c,bx,by,bw,bh,36);c.clip();c.fillStyle='#ffffff0c';c.fillRect(bx,by,bw,bh);const k=Math.min(bw/image.width,bh/image.height)*.92* (.95+.05*progress);const iw=image.width*k,ih=image.height*k;c.drawImage(image,bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);c.restore()}
 else if(s.layout!=='statement'){const cy=compact?h*.65:boxY+boxH*.45;const cx=compact?780:540; c.save();c.translate(cx,cy);c.rotate((1-progress)*.16);for(let i=2;i>=0;i--){c.fillStyle=i===0?s.accent:'#ffffff0b';c.strokeStyle='#ffffff20';c.lineWidth=2;round(c,-180+i*26,-110-i*28,360,220,32);c.fill();c.stroke()}c.fillStyle=s.background;c.font='bold 72px Arial';c.textAlign='center';c.fillText('▶',5,27);c.restore()}
 if(s.cta){c.font='bold 28px Arial';const cw=Math.min(936,c.measureText(s.cta).width+90);c.fillStyle=s.accent;round(c,72,h-165,cw,74,37);c.fill();c.fillStyle=s.background;c.fillText(s.cta,117,h-117)}c.restore();c.fillStyle='#ffffff30';c.fillRect(72,h-52,936,3);c.fillStyle=s.accent;c.fillRect(72,h-52,936*clamp(time/totalDuration(p),0,1),3);c.restore();
}
