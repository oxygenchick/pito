import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as E from './engine.mjs';
import {ITEM_ART} from './item-catalog.mjs';
import {shelf,icon} from './visuals.mjs';
import {renderStart} from './start-screens.mjs';
const catalog=[...E.ITEMS,...E.GOALS];
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const playing=()=>Object.assign(E.createProfile('Пито',2,2),{tutorial:'done',plan:[4,0,0],speed:0,shelfSeen:true});

test('replacement catalogue has six ordinary things and five dreams, no brand comparisons',()=>{
 assert.deepEqual(E.ITEMS.map(x=>x.name),['Бабл-ти','Настолка','Футболка','Кроссовки','Ретро-приставка','Фотик']);
 assert.deepEqual(E.GOALS.map(x=>x.name),['Приставка','Мега шопинг','Редкая аниме-фигурка','Телефон','Электрогитара']);
 assert.equal(new Set(catalog.map(x=>x.art)).size,11);
 assert.doesNotMatch(JSON.stringify(catalog),/как PS5|как айфон|Мяч|Комикс|Велосипед|Домик на дереве/);
});
test('all eleven objects have individual real PNGs used by the renderer',()=>{
 for(const item of catalog){
  const path='./assets/items-v14/'+ITEM_ART[item.id]+'.png';
  assert(existsSync(new URL(path,import.meta.url)));
  const png=readFileSync(new URL(path,import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG');
  assert.equal(png[25],6,'RGBA sprite '+item.id);
  assert(icon(item.id).includes(path.slice(2)));
 }
});
test('legacy owned slots, active goal and money survive the catalogue replacement',()=>{
 const s=playing();Object.assign(s,{owned:['ball','comic','telescope'],goalsWon:['bike'],goal:'house',plannedGoal:'house',wallet:17,savings:9});
 s.ledger=[{cycle:1,kind:'expense',amount:6,label:'Комикс',category:'wants'}];
 const restored=E.restore(JSON.stringify(s),s.lastSeen);
 for(const key of ['owned','goalsWon','goal','plannedGoal','wallet','savings'])assert.deepEqual(restored[key],s[key]);
 assert.equal(restored.ledger[0].label,'Настолка');assert.equal(restored.ledger[0].originalLabel,'Комикс');
 assert.equal(restored.ledger[0].amount,6);
 const twice=E.restore(JSON.stringify(restored),restored.lastSeen);
 assert.deepEqual(twice.ledger,restored.ledger);
});
test('all five dreams can be purchased once, charging only their actual prices',()=>{
 const s=playing();s.savings=300;s.wallet=11;
 for(const g of E.GOALS){
  s.goal=g.id;const before=s.savings;
  assert(E.claimGoal(s));assert.equal(s.savings,before-g.price);
  assert.equal(s.wallet,11);assert.equal(E.claimGoal(s),false);
  E.acknowledgePurchase(s);
 }
 assert.equal(s.savings,100);assert.equal(s.goalsWon.length,5);
});
test('all eleven objects have individual fixed world positions',()=>{
 const s=playing();s.owned=E.ITEMS.map(i=>i.id);s.goalsWon=E.GOALS.map(i=>i.id);
 const html=shelf(s,catalog);
 assert.equal((html.match(/class="world-collection"/g)||[]).length,1);
 assert.equal((html.match(/class="location-item"/g)||[]).length,11);
 assert.match(html,/data-id="guitar" data-support="ground"/);
 for(const item of catalog)assert.equal((html.match(new RegExp('data-id="'+item.id+'"','g'))||[]).length,1);
 assert.doesNotMatch(html,/collection-rack|data-shelf/);
});
test('sparse collections retain fixed physical slots irrespective of purchase order',()=>{
 const full=playing();full.owned=E.ITEMS.map(i=>i.id);full.goalsWon=E.GOALS.map(i=>i.id);
 const style=(html,id)=>html.match(new RegExp('data-id="'+id+'" data-support="[^"]+" style="([^"]*)"'))?.[1];
 for(const item of catalog){
  const s=playing();(E.ITEMS.includes(item)?s.owned:s.goalsWon).push(item.id);
  assert.ok(style(shelf(s,catalog),item.id));assert.equal(style(shelf(s,catalog),item.id),style(shelf(full,catalog),item.id));
 }
});
test('pet on saved title uses every current growth stage, colour and hairstyle without clutter',()=>{
 for(let stage=0;stage<3;stage++)for(let color=0;color<3;color++)for(let hair=0;hair<3;hair++){
  const s=playing();Object.assign(s,{stage,color,hair,owned:['ball'],goalsWon:['guitar'],poops:[{id:1,x:80}]});
  const before=JSON.stringify(s),html=renderStart('start',s);
  assert(html.includes('pet-color-'+color));assert(html.includes('hair-'+hair+'.png'));
  assert.equal(html.includes('pet-legs sprite-shape'),stage===2);
  assert.equal(html.includes('pet-feelers sprite-shape'),stage>0);
  assert.match(html,/data-act="continue"/);
  assert.doesNotMatch(html,/data-act="new"|class="hud"|class="actions/);
  assert.match(html,/data-poop="1"/);
  assert.match(html,/data-id="ball"/);assert.match(html,/data-id="guitar"/);
  assert.equal(JSON.stringify(s),before);
 }
});
test('final styles beat legacy shelf positions and vertically centre all pet speech',()=>{
 const css=read('./polish-v14.css');
 assert.match(css,/\.shelf\.collection-shelf>\.rack-item/);
 assert.match(css,/\.object-bubble \{ display:flex;align-items:center;justify-content:center/);
 assert.match(css,/\.pet-v8 \.hair-2 \{ bottom:82%;left:16%/);
 assert.match(css,/\[data-id=ball\] \.art \{ width:4.7cqw;height:6.3cqw/);
 assert.match(css,/\[data-id=puzzle\] \.art \{ width:11.2cqw;height:10.5cqw/);
 assert.match(css,/#game \.ground-guitar \{[^}]+z-index:1/);
});
