import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {renderStart} from '../src/start-screens.mjs';
import {icon,shelf,poop} from '../src/visuals.mjs';
import {ITEMS,GOALS} from '../src/item-catalog.mjs';
import {createProfile} from '../src/engine.mjs';

test('saved title shares the game collection and dirt renderers without HUD or mutation',()=>{
 const s=createProfile('Пито',1,2);
 Object.assign(s,{stage:2,owned:ITEMS.map(x=>x.id),goalsWon:GOALS.map(x=>x.id),shelfSeen:true,poops:[{id:7,x:80,taps:2,wet:.5},{id:8,x:92,taps:0,wet:0}]});
 const before=JSON.stringify(s),html=renderStart('start',s);
 assert(html.includes(shelf(s,[...ITEMS,...GOALS])));
 for(const p of s.poops)assert(html.includes(poop(p)));
 assert.match(html,/<div class="ss-start-scene[^"]*" aria-hidden="true" inert>/);
 assert.equal((html.match(/class="location-item"/g)||[]).length,11);
 assert.equal((html.match(/data-poop=/g)||[]).length,2);
 assert.doesNotMatch(html,/class="hud"|class="needs|class="actions|data-act="food"|data-act="rain"|data-act="wallet"/);
 assert.equal(JSON.stringify(s),before);
});

test('a first launch has neither unowned collection objects nor dirt',()=>{
 const html=renderStart('start',null);
 assert.match(html,/data-act="new"/);
 assert.doesNotMatch(html,/world-collection|data-poop=|ss-start-scene/);
});

test('start uses the original Cyrillic logo and live, exact tagline',()=>{
 const html=renderStart('start',null);
 assert.match(html,/<h1 class="logo"><img[^>]+alt="Пито-Пито"/);
 assert.match(html,/<p class="ss-tagline">Твой финансовый дружище<\/p>/);
 assert.doesNotMatch(html,/Маленький друг|Большие планы/);
 assert.match(html,/data-act="new"/);
 assert.ok(existsSync(projectURL('./assets/ui-v8/logo.png',import.meta.url)));
});
test('branding preserves continue-only saved pet and random faces',()=>{
 const html=renderStart('start',{name:'Тест'},{face:2});
 assert.match(html,/data-act="continue"/);assert.doesNotMatch(html,/data-act="new"/);
 assert.match(html,/ss-start-scene face2/);
});
test('all illustrated UI objects use the approved raster sprite families',()=>{
 for(const id of ['apple','jar','cloud','care-basket','toy-box']){
  const version=id==='cloud'?'ui-v10':'ui-v7';
  assert.match(icon(id),new RegExp(`assets/${version}/${id}.png`));
  assert.ok(existsSync(projectURL(`./assets/${version}/${id}.png`,import.meta.url)));
 }
});
test('font is local, Cyrillic-ready in both actual weights, served by dev server',()=>{
 const css=readFileSync(projectURL('./fonts.css',import.meta.url),'utf8');
 assert.match(css,/font-weight:400/);assert.match(css,/font-weight:700/);
 assert.doesNotMatch(css,/https?:/);
 for(const weight of ['Regular','Bold'])assert.ok(existsSync(projectURL(`./assets/fonts/BalsamiqSans-${weight}.ttf`,import.meta.url)));
 assert.match(readFileSync(projectURL('./index.html',import.meta.url),'utf8'),/href="styles\/fonts.css"/);
 assert.match(readFileSync(projectURL('./server.mjs',import.meta.url),'utf8'),/font\/ttf/);
});
