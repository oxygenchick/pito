import {mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
const dir=new URL('./assets/ui-v13/',import.meta.url),path=n=>fileURLToPath(new URL(n,dir));
await mkdir(dir,{recursive:true});
await copyFile(source+'exec-60e006bd-990a-4619-94b1-edd0432f5b98.png',path('planet.png'));
await copyFile(source+'exec-7067e25d-fc8a-4834-896a-bd4d83ec15ba.png',path('body-source.png'));
// Remove the explicitly white generation background; contour is not redrawn.
const {data,info}=await sharp(path('body-source.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let l=info.width,t=info.height,r=0,b=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
 const i=(y*info.width+x)*4;
 const alpha=Math.max(0,Math.min(255,Math.round((data[i]-data[i+1]-4)/57*255)));
 data[i+3]=alpha;
 if(alpha>128){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
}
await sharp(data,{raw:info}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toFile(path('body.png'));
console.log({width:r-l+1,height:b-t+1});
