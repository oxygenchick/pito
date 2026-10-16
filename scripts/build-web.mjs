import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
// Only this generated directory is removed. Source and saves are never touched.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(out,'index.html'));
function copyTree(source,target){
 fs.mkdirSync(target,{recursive:true});
 for(const entry of fs.readdirSync(source,{withFileTypes:true})){
  const from=path.join(source,entry.name),to=path.join(target,entry.name);
  if(entry.isDirectory())copyTree(from,to);
  else if(entry.isFile())fs.copyFileSync(from,to);
 }
}
for(const name of ['src','styles','assets'])copyTree(path.join(root,name),path.join(out,name));
console.log('Offline web assets prepared in dist/');
