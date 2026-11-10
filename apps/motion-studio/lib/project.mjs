export const FORMATS = { portrait:[1080,1920], square:[1080,1080], landscape:[1920,1080] };
export function validateProject(p) {
  const fail=m=>{throw Object.assign(new Error(m),{status:400})};
  if (!p || typeof p!=='object') fail('Dự án không hợp lệ');
  const str=(v,n,max)=>{if(typeof v!=='string'||v.length>max)fail(n+' không hợp lệ');return v};
  const num=(v,n,min,max)=>{if(!Number.isFinite(v)||v<min||v>max)fail(n+' không hợp lệ');return v};
  const asset=v=>{if(!v)return '';if(typeof v!=='string'||!/^\/assets\/[a-f0-9-]+\.(png|jpg|webp|mp3|wav|ogg|m4a)$/.test(v))fail('Tài nguyên không hợp lệ');return v};
  if(!FORMATS[p.format])fail('Tỷ lệ không hợp lệ');
  if(![24,30].includes(p.fps))fail('FPS phải là 24 hoặc 30');
  if(!Array.isArray(p.scenes)||!p.scenes.length||p.scenes.length>12)fail('Cần từ 1 đến 12 cảnh');
  const scenes=p.scenes.map(s=>({title:str(s.title,'Tiêu đề',100),subtitle:str(s.subtitle,'Mô tả',220),eyebrow:str(s.eyebrow||'','Nhãn',50),cta:str(s.cta||'','Nút',60),duration:num(s.duration,'Thời lượng',1,15),background:/^#[0-9a-f]{6}$/i.test(s.background)?s.background:'#071d2b',accent:/^#[0-9a-f]{6}$/i.test(s.accent)?s.accent:'#7cf5bf',image:asset(s.image),layout:['product','statement','split'].includes(s.layout)?s.layout:'product',motion:['spring','slide','fade'].includes(s.motion)?s.motion:'spring'}));
  if(scenes.reduce((a,s)=>a+s.duration,0)>60)fail('Tổng thời lượng tối đa 60 giây');
  const audio=asset(p.audio);if(audio&&!/\.(mp3|wav|ogg|m4a)$/.test(audio))fail('Nhạc không hợp lệ');
  for(const s of scenes)if(s.image&&!/\.(png|jpg|webp)$/.test(s.image))fail('Ảnh không hợp lệ');
  return {name:str(p.name,'Tên dự án',100),brand:str(p.brand||'MOTION STUDIO','Thương hiệu',50),format:p.format,fps:p.fps,scenes,audio,volume:num(p.volume??0.7,'Âm lượng',0,1),bpm:num(p.bpm??120,'BPM',40,240)};
}
export const demo={name:'Kết nối mọi khoảnh khắc',brand:'YOUR BRAND',format:'portrait',fps:30,audio:'',volume:0.6,bpm:120,scenes:[{eyebrow:'MỘT KHỞI ĐẦU MỚI',title:'Ý tưởng lớn.\nChuyển động đẹp.',subtitle:'Biến thông điệp của bạn thành những thước phim đáng nhớ.',cta:'Khám phá ngay',duration:4,background:'#071d2b',accent:'#9bffca',image:'',layout:'product',motion:'spring'},{eyebrow:'THIẾT KẾ CÓ CHỦ ĐÍCH',title:'Kể câu chuyện\ncủa riêng bạn.',subtitle:'Ảnh thật. Nhịp điệu tự nhiên. Một dấu ấn khác biệt.',cta:'',duration:4,background:'#22203b',accent:'#c5b6ff',image:'',layout:'statement',motion:'slide'},{eyebrow:'SẴN SÀNG TỎA SÁNG',title:'Từ ý tưởng\nđến màn hình.',subtitle:'Tạo video của bạn với Motion Studio.',cta:'Bắt đầu hôm nay',duration:4,background:'#123329',accent:'#d8ff8f',image:'',layout:'split',motion:'spring'}]};
