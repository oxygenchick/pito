// Only mechanical atlas slicing and alpha-bound trimming; no painted substitutions.
import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
const root=fileURLToPath(new URL('./assets/',import.meta.url));
const records=[];
async function sprite(input,folder,name){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let l=info.width,t=info.height,r=0,b=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 l=Math.max(0,l-2);t=Math.max(0,t-2);r=Math.min(info.width-1,r+2);b=Math.min(info.height-1,b+2);
 const png=await sharp(input).extract({left:l,top:t,width:r-l+1,height:b-t+1}).png().toBuffer();
 await writeFile(path.join(root,folder,name+'.png'),png);
 records.push({file:folder+'/'+name+'.png',width:r-l+1,height:b-t+1});
}
for(const folder of ['ui-v8','pet-v8'])await mkdir(path.join(root,folder),{recursive:true});
for(const a of [
 {file:'exec-00a81c78-c3bd-4957-b881-4e0075ce15f0.png',folder:'pet-v8',name:'parts-source',cols:3,rows:2,names:['body','feelers','legs','hair-0','hair-1','hair-2']},
 {file:'exec-7eb12165-6fdb-4c32-b886-2b072bd2d224.png',folder:'pet-v8',name:'face-source',cols:3,rows:4,names:['eyes-neutral','eyes-happy','eyes-sad','eyes-closed','pupil','mouth-smile','mouth-open','mouth-frown','mouth-grin','mouth-o','cheek','sparkle']},
 {file:'exec-b1330339-4396-46d8-8bbd-d9f41cf15067.png',folder:'ui-v8',name:'icons-source',cols:4,rows:5,names:['coin','heart','drop','settings','task','ball','comic','puzzle','kite','console','bike','house','hand','arrow','lock','home','sun','check','close','star']},
 {file:'exec-f138fbc6-c477-4dae-9571-d7343b12a132.png',folder:'pet-v8',name:'poop-source',cols:3,rows:1,names:['poop-sleep','poop-awake','poop-run']}
]){
 const file=path.join(source,a.file),meta=await sharp(file).metadata();
 await copyFile(file,path.join(root,a.folder,a.name+'.png'));
 for(let i=0;i<a.names.length;i++){
  const x=i%a.cols,y=Math.floor(i/a.cols);
  const bands=a.name==='face-source'?[0,450,780,1100,meta.height]:a.name==='icons-source'?[0,330,610,900,1130,meta.height]:Array.from({length:a.rows+1},(_,j)=>Math.round(j*meta.height/a.rows));
  const inset=a.name==='parts-source'?18:0;
  const left=Math.round(x*meta.width/a.cols)+inset,top=bands[y]+inset;
  const width=Math.round((x+1)*meta.width/a.cols)-left-inset,height=bands[y+1]-top-inset;
  await sprite(await sharp(file).extract({left,top,width,height}).png().toBuffer(),a.folder,a.names[i]);
 }
}
for(const [file,name] of [['exec-47514701-d3fb-47b0-bcad-52a5ee68a741.png','cloud'],['exec-c368b813-8814-4c3c-8986-07cebddb4515.png','shelf'],['exec-08505f7f-1cc8-4b09-9e04-ab15308c25a9.png','logo']]){
 await copyFile(path.join(source,file),path.join(root,'ui-v8',name+'-source.png'));
 await sprite(path.join(source,file),'ui-v8',name);
}
await writeFile(path.join(root,'ui-v8','manifest.json'),JSON.stringify(records,null,2));
console.log(JSON.stringify(records,null,2));
