import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pet} from '../src/visuals.mjs';
const root=new URL('../',import.meta.url);
test('entry point references existing scripts and styles',()=>{
 const html=fs.readFileSync(new URL('index.html',root),'utf8');
 for(const [,file] of html.matchAll(/(?:href|src)="((?:src|styles)\/[^"]+)"/g))assert(fs.existsSync(new URL(file,root)),file);
 assert.match(html,/src="src\/app.mjs"/);
});
test('all local CSS assets resolve after moving styles',()=>{
 for(const name of fs.readdirSync(new URL('styles/',root))){
  const file=new URL('styles/'+name,root),css=fs.readFileSync(file,'utf8');
  for(const [,asset] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)){
   if(/^(data:|https?:|#)/.test(asset))continue;
   assert(fs.existsSync(new URL(asset,file)),name+': '+asset);
  }
 }
});
test('public README links resolve',()=>{
 const text=fs.readFileSync(new URL('README.md',root),'utf8');
 for(const [,file] of text.matchAll(/\]\((docs\/[^)]+)\)/g))assert(fs.existsSync(new URL(file,root)),file);
});
test('pet image masks resolve from the document, not the styles directory',()=>{
 const html=pet({stage:2,color:0,hair:0});
 assert.doesNotMatch(html,/--sprite-mask/);
 for(const [,asset] of html.matchAll(/mask-image:url\('([^']+)'\)/g))assert(fs.existsSync(new URL(asset,root)),asset);
 assert.match(html,/mask-image:url\('assets\/ui-v13\/body.png'\)/);
});
