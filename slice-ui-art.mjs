// Mechanical extraction of the imagegen atlases requested by the project owner.
// Preserve source RGBA; no stretching, painting or synthetic backgrounds.
import {createRequire} from 'node:module';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=fileURLToPath(new URL('./assets/ui-v6/',import.meta.url));
const source='C:/Users/User/.codex/generated_images/01a0a7fa-c2c3-7932-83a5-292be7f5427c/';
await mkdir(out,{recursive:true});
const atlases=[
 {source:'exec-c0f83250-81c0-45f5-9f8b-b9212d161a8b.png',name:'panels-source.png',names:['panel-cream','button-purple','button-round','tile-mint','tile-peach','tile-lavender']},
 {source:'exec-647a7791-7037-49ed-a03f-06a45174ac86.png',name:'objects-source.png',names:['care-basket','toy-box','jar','cloud','drum','telescope']}
];
const records=[];
for(const atlas of atlases){
 await copyFile(path.join(source,atlas.source),path.join(out,atlas.name));
 for(let i=0;i<6;i++){
  const rect={left:(i%3)*512,top:Math.floor(i/3)*512,width:512,height:512};
  if(atlas.names[i]==='care-basket')rect.height=530;
  if(atlas.names[i]==='cloud'){rect.top=530;rect.height=494;}
  const cell=await sharp(path.join(source,atlas.source)).extract(rect).png().toBuffer();
  const png=await sharp(cell).trim({background:'#00000000',threshold:4}).png().toBuffer();
  const file=atlas.names[i]+'.png';await writeFile(path.join(out,file),png);
  const m=await sharp(png).metadata();const stats=await sharp(png).stats();
  records.push({file,width:m.width,height:m.height,alpha:m.hasAlpha,alphaMin:stats.channels[3]?.min,alphaMax:stats.channels[3]?.max});
 }
}
const apple=await sharp(path.join(out,'apple-source.png')).trim({background:'#00000000',threshold:4}).png().toBuffer();
await writeFile(path.join(out,'apple.png'),apple);
const appleMeta=await sharp(apple).metadata(),appleStats=await sharp(apple).stats();
records.push({file:'apple.png',width:appleMeta.width,height:appleMeta.height,alpha:appleMeta.hasAlpha,alphaMin:appleStats.channels[3]?.min,alphaMax:appleStats.channels[3]?.max});
await writeFile(path.join(out,'sprite-manifest.json'),JSON.stringify(records,null,2));
console.log(JSON.stringify(records,null,2));
