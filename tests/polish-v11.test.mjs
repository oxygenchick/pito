import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as E from '../src/engine.mjs';
import * as V from '../src/views.mjs';
import {pet,icon} from '../src/visuals.mjs';
import {renderStart} from '../src/start-screens.mjs';
const css=readFileSync(projectURL('./polish-v11.css',import.meta.url),'utf8');
test('new names default to Pito without changing existing chosen names',()=>{
 assert.equal(E.createProfile().name,'Пито');assert.equal(E.restore(JSON.stringify(E.createProfile('Витс'))).name,'Витс');
 assert.match(renderStart('create',null),/value="Пито"/);
});
test('happy mask remains layered and removed whistling mouth falls back to neutral',()=>{
 const face=pet({},false,'whistling');assert.match(face,/data-emotion="neutral"/);assert.doesNotMatch(face,/mouth-whistle/);
 assert.match(pet({},false,'happy'),/ui-v11\/eyes-happy.png/);assert.match(css,/mask-image:url\('\.\.\/assets\/ui-v11\/eyes-happy.png'\)/);
});
test('decorative controls are image chevrons, plus and minus with preserved proportions',()=>{
 for(const id of ['chevron','plus','minus']){assert.match(icon(id),new RegExp('ui-v11/'+id+'.png'));assert(existsSync(projectURL('./assets/ui-v11/'+id+'.png',import.meta.url)));}
 assert.match(icon('arrow'),/ui-v11\/chevron.png/);assert.match(css,/object-fit:contain/);
});
test('settings no longer expose an animation toggle; growth popup is concise',()=>{
 const s=E.createProfile();s.tutorial='done';
 assert.doesNotMatch(V.modalView(s,{modal:'settings'}).body,/Анимации|data-act="motion"/);
 const growth=V.modalView(s,{modal:'growth'}).body;
 assert.doesNotMatch(growth,/День заканчивается|В окнах|Следующий этап/);assert.match(growth,/growth-details/);
});
test('item bubble is a single drawn sprite and all celebration hops preserve X position',()=>{
 assert.match(css,/item-bubble:after \{ display:none/);
 assert.match(css,/bubble-left.png/);assert.match(css,/@keyframes pet-jump-v11[^\n]*translate:0 -3cqw/);
});
