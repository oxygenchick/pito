import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {missionRoute,stepChoice} from '../src/interactions-v10.mjs';
import {icon,pet} from '../src/visuals.mjs';
test('guides route directly to the relevant action, not a generic close',()=>{
 for(const [m,r]of Object.entries({feed:'food',wash:'rain',goal:'choose-goal',buy:'shop',deposit:'bank',save:'goal',plan:'plan'}))assert.equal(missionRoute(m),r);
});
test('catalogue arrows wrap, including a single remaining goal',()=>{
 const items=[{id:'a'},{id:'b'}];assert.equal(stepChoice(items,'a',-1),'b');assert.equal(stepChoice(items,'b',1),'a');assert.equal(stepChoice([{id:'last'}],'owned',1),'last');assert.equal(stepChoice([],null,1),null);
});
test('high contrast object sprites are actual new images without badge markup',()=>{
 for(const name of ['cloud','hand','arrow']){const html=icon(name),path=name==='arrow'?'ui-v11/chevron.png':'ui-v10/'+name+'.png';assert.ok(html.includes(path));assert.ok(existsSync(projectURL('./assets/'+path,import.meta.url)));}
 assert.match(pet({}),/ui-v13\/body.png/);assert.match(pet({}),/ui-v10\/mouth-smile.png/);
});
test('grown event uses game-relative proportions and needs support exit animation',()=>{
 const css=readFileSync(projectURL('./polish-v10.css',import.meta.url),'utf8');
 assert.match(css,/\.event-pet \.pet \{ width:34cqw/);assert.match(css,/needs-leaving/);assert.match(css,/ss-story \.pet-hair \{ display:none/);
});
test('contribution success is inline, never a toast over savings modal',()=>{
 const app=readFileSync(projectURL('./app.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(app,/toast\('Мечта ближе/);assert.match(app,/transferNotice=`Отложили/);assert.match(app,/bubble\(item.reaction,node\)/);
});
