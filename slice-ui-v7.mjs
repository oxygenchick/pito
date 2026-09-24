// Mechanical sprite extraction. Preserve the original alpha; never stretch art.
import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
const out=fileURLToPath(new URL('./assets/ui-v7/',import.meta.url));
await mkdir(out,{recursive:true});
const records=[];
async function cropAlpha(input,name){
  const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let l=info.width,t=info.height,r=0,b=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  l=Math.max(0,l-3);t=Math.max(0,t-3);r=Math.min(info.width-1,r+3);b=Math.min(info.height-1,b+3);
  const file=name+'.png',png=await sharp(input).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
  await writeFile(path.join(out,file),png);
  const m=await sharp(png).metadata(),s=await sharp(png).stats();
  records.push({file,width:m.width,height:m.height,alpha:m.hasAlpha,alphaMin:s.channels[3].min,alphaMax:s.channels[3].max});
}
for(const a of [
 {source:'exec-a9ab8362-a529-457b-b1ba-6e4a1bcac17b.png',name:'panels-source',names:['panel-cream','button-purple','button-round','tile-mint','tile-peach','tile-lavender']},
 {source:'exec-a5c9a6a2-3914-45a1-8f3a-efded0cee40c.png',name:'objects-source',names:['care-basket','toy-box','jar','cloud','drum','telescope']}
]){
  await copyFile(path.join(source,a.source),path.join(out,a.name+'.png'));
  for(let i=0;i<6;i++){
    const rect={left:(i%3)*512,top:Math.floor(i/3)*512,width:512,height:512};
    if(a.names[i]==='care-basket')rect.height=532;
    if(a.names[i]==='cloud'){rect.top=532;rect.height=492;}
    if(a.names[i]==='toy-box')rect.width=548;
    if(a.names[i]==='jar'){rect.left=1060;rect.width=476;}
    const cell=await sharp(path.join(source,a.source)).extract(rect).png().toBuffer();
    await cropAlpha(cell,a.names[i]);
  }
}
for(const [original,name] of [['exec-b3c7e231-d126-4d02-b297-2b65f9815444.png','apple'],['exec-09ea3088-57b3-496c-84d8-a31953d970fa.png','pito-pito-logo']]){
  await copyFile(path.join(source,original),path.join(out,name+'-source.png'));
  await cropAlpha(path.join(source,original),name);
}
await writeFile(path.join(out,'sprite-manifest.json'),JSON.stringify(records,null,2));
console.log(JSON.stringify(records,null,2));
