import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2'};
http.createServer((req,res)=>{
 try{
  let u=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(u==='/'||u==='/pito/'||u==='/pito')u='/index.html';
  else if(u.startsWith('/pito/'))u=u.slice(5);
  if(u.split('/').some(p=>p.startsWith('.')||['android','scripts','node_modules','builds'].includes(p)))throw Error('Forbidden');
  const p=path.resolve(root,'.'+u),mime=types[path.extname(p)];
  if(!p.startsWith(root+path.sep)||!mime){res.writeHead(403).end();return;}
  fs.stat(p,(err,st)=>{if(err||!st.isFile()){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-cache'});fs.createReadStream(p).pipe(res);});
 }catch{res.writeHead(400).end();}
}).listen(Number(process.env.PORT||4174),'127.0.0.1',()=>console.log(`Pito http://127.0.0.1:${process.env.PORT||4174}/`));
