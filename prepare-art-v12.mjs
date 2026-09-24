import {mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
const dir=new URL('./assets/ui-v12/',import.meta.url),path=n=>fileURLToPath(new URL(n,dir));
await mkdir(dir,{recursive:true});
await copyFile(source+'exec-da97bc59-865a-48c3-ba3b-7ab342b69f3f.png',path('planet.png'));
await copyFile(source+'exec-9d4a9932-8378-4ad6-ac42-c9b65d802ada.png',path('frame-source.png'));
const {data,info}=await sharp(path('frame-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let l=info.width,t=info.height,r=0,b=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
await sharp(data,{raw:info}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toFile(path('selected-frame.png'));
console.log({width:r-l+1,height:b-t+1});
