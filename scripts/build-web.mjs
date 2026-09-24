import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'dist');
// Only this generated directory is removed. Source and saves are never touched.
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root)){
 if(name==='index.html'||name.endsWith('.css')||(name.endsWith('.mjs')&&!name.endsWith('.test.mjs')&&!/^(server|prepare-|slice-)/.test(name)))fs.copyFileSync(path.join(root,name),path.join(out,name));
}
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
console.log('Offline web assets prepared in dist/');
