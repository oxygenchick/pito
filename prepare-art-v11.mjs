import {mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=new URL('./assets/ui-v11/',import.meta.url), path=name=>fileURLToPath(new URL(name,dir));
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
await mkdir(dir,{recursive:true});
await copyFile(source+'exec-5ec88e51-a003-4ecc-8fa5-53165c7d3eab.png',path('meadow.png'));
await copyFile(source+'exec-f9d94036-1efb-40f6-84a5-691d92db3f00.png',path('planet.png'));
await copyFile(source+'exec-ac1f8066-3a51-495f-a317-4f50e65fde07.png',path('sprites-source.png'));
async function cropAlpha(name,box){
 const input=await sharp(path('sprites-source.png')).extract(box).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {data,info}=input;let l=info.width,t=info.height,r=0,b=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);}
 const result=await sharp(data,{raw:info}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
 await sharp(result).toFile(path(name+'.png'));console.log(name,r-l+1,b-t+1,'cornerAlpha',data[3]);return result;
}
for(const [i,name]of ['plus','minus','chevron','mouth-whistle','eyes-happy-cut','bubble-left'].entries()){
 const result=await cropAlpha(name,{left:i%3*512,top:Math.floor(i/3)*512,width:512,height:512});
 if(name==='eyes-happy-cut')await sharp(result).resize({width:440,height:200,fit:'contain',position:'north',background:'#00000000'}).png().toFile(path('eyes-happy.png'));
}
