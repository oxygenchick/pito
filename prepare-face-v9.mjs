// Mechanical sprite extraction: preserve generated alpha and normalise pivots.
import {createRequire} from 'node:module';
import {copyFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/exec-96ac4a01-7ca3-4c37-925f-f866e3f3e9e0.png';
const dir=new URL('./assets/pet-v8/',import.meta.url);
await copyFile(source,new URL('face-v9-source.png',dir));
const meta=await sharp(source).metadata();
const names=['eyes-neutral','eyes-happy','eyes-sad','eyes-closed','pupil','mouth-smile','mouth-open','mouth-frown','mouth-grin'];
for(let i=0;i<names.length;i++){
 const x=i%3,y=Math.floor(i/3),left=Math.round(x*meta.width/3),top=Math.round(y*meta.height/3);
 const cell=await sharp(source).extract({left,top,width:Math.round((x+1)*meta.width/3)-left,height:Math.round((y+1)*meta.height/3)-top}).png().toBuffer();
 const {data,info}=await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=0,b=0;
 for(let py=0;py<info.height;py++)for(let px=0;px<info.width;px++)if(data[(py*info.width+px)*4+3]>16){l=Math.min(l,px);r=Math.max(r,px);t=Math.min(t,py);b=Math.max(b,py);}
 const cropped=await sharp(cell).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
 // Same 440x200 registration for every eye pair: expressions cannot jump.
 let pipeline=sharp(cropped);
 if(i<=3)pipeline=pipeline.resize(440,200,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
 else if(i===4)pipeline=pipeline.resize(160,160,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
 await writeFile(new URL(names[i]+'.png',dir),await pipeline.png().toBuffer());
 console.log(names[i],r-l+1,b-t+1,i<=3?'-> 440x200':'');
}
