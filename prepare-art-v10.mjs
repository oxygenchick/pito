// Mechanical alpha-preserving sprite extraction from generated sheets.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=new URL('./assets/ui-v10/',import.meta.url);
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
await mkdir(dir,{recursive:true});
async function extract(file,name,box){
 const input=await sharp(file instanceof URL?fileURLToPath(file):file).extract(box).png().toBuffer();
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=0,b=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(info.width-1,r+2);b=Math.min(info.height-1,b+2);
 await writeFile(new URL(name+'.png',dir),await sharp(input).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer());
 console.log(name,r-l+1,b-t+1,'cornerAlpha',data[3]);
}
const chars=source+'exec-c8fe4cee-452f-45b0-b563-4d658fbace36.png';
await copyFile(chars,new URL('character-source.png',dir));
for(const [name,left,top,width,height]of [['body',0,0,820,650],['hair-1',820,0,716,650],['mouth-smile',0,650,820,374],['mouth-grin',820,650,716,374]])await extract(chars,name,{left,top,width,height});
const ui=source+'exec-031d3ab7-5950-44a8-8d96-e34c257e739e.png';
await copyFile(ui,new URL('ui-source.png',dir));
const xs=[0,550,1050,1536],ys=[0,415,740,1024];
for(const [i,name]of ['hand','cloud','comic','input-paper','swatch','selected-ring','divider','bubble','arrow'].entries()){
 const x=i%3,y=Math.floor(i/3);await extract(ui,name,{left:xs[x],top:ys[y],width:xs[x+1]-xs[x],height:ys[y+1]-ys[y]});
}
// Previous atlas slice included a sliver of the next row below the wheels.
await extract(new URL('./assets/ui-v8/bike.png',import.meta.url),'bike',{left:0,top:0,width:248,height:190});
// Separate the drawn tail so a bubble can point at an off-centre shelf object.
await sharp(fileURLToPath(new URL('bubble.png',dir))).extract({left:0,top:0,width:420,height:156}).png().toFile(fileURLToPath(new URL('bubble-body.png',dir)));
await sharp(fileURLToPath(new URL('bubble.png',dir))).extract({left:178,top:150,width:76,height:49}).png().toFile(fileURLToPath(new URL('bubble-tail.png',dir)));
