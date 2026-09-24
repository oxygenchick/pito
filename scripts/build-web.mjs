import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
// Only this generated directory is removed. Source and saves are never touched.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(out,'index.html'));
for(const name of ['src','styles','assets'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('Offline web assets prepared in dist/');
