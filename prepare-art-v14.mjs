import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const sharp=createRequire(import.meta.url)('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const entries=JSON.parse(await readFile(new URL('./assets-v14.json',import.meta.url),'utf8'));
const dir=new URL('./assets/items-v14/',import.meta.url);
await mkdir(new URL('sources/',dir),{recursive:true});
const previews=[];
for(const {id,source} of entries){
 await copyFile(source,new URL('sources/'+id+'.png',dir));
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<=left||bottom<=top)throw Error('Empty image '+id);
 const cropped=sharp(source).extract({left,top,width:right-left+1,height:bottom-top+1});
 const bytes=['dream-shelf','collection-rack'].includes(id)?await cropped.resize({width:512}).png().toBuffer():await cropped.resize(512,512,{fit:'inside'}).extend({top:2,bottom:2,left:2,right:2,background:'#0000'}).png().toBuffer();
 await sharp(bytes).toFile(fileURLToPath(new URL(id+'.png',dir)));
 const small=await sharp(bytes).resize(180,180,{fit:'contain',background:'#0000'}).png().toBuffer();
 const n=previews.length;previews.push({input:small,left:(n%4)*200+10,top:Math.floor(n/4)*200+10});
 console.log(id,{sourceSize:[info.width,info.height],content:[right-left+1,bottom-top+1]});
}
await sharp({create:{width:800,height:Math.ceil(previews.length/4)*200,channels:4,background:'#fff8ec'}}).composite(previews).png().toFile(fileURLToPath(new URL('preview.png',dir)));
