import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {COLLECTION_PLACES,ownedPlaces} from '../src/collection-layout.mjs';
import {ITEMS,GOALS,createProfile,restore} from '../src/engine.mjs';
import {shelf} from '../src/visuals.mjs';
import {modalView} from '../src/views.mjs';
const catalog=[...ITEMS,...GOALS];
test('every catalogue object has exactly one fixed place in composition B',()=>{
 assert.deepEqual(Object.keys(COLLECTION_PLACES).sort(),catalog.map(i=>i.id).sort());
 for(const [id,p]of Object.entries(COLLECTION_PLACES)){
  assert(p.x-p.width/2>=0,id);assert(p.x+p.width/2<=100,id);
  assert(p.bottom>20&&p.bottom<60,id);assert(p.width>0&&p.height>0,id);
 }
 assert(COLLECTION_PLACES.puzzle.height>COLLECTION_PLACES.ball.height*1.5);
 assert(COLLECTION_PLACES.guitar.height>COLLECTION_PLACES.puzzle.height);
});
test('all 2048 ownership combinations have fixed, non-duplicate positions',()=>{
 for(let mask=0;mask<2**catalog.length;mask++){
  const ids=catalog.filter((_,i)=>mask&(1<<i)).map(x=>x.id);
  const s={owned:ids.filter(id=>ITEMS.some(i=>i.id===id)).reverse(),goalsWon:ids.filter(id=>GOALS.some(i=>i.id===id)).reverse(),shelfSeen:true};
  const places=ownedPlaces(s),html=shelf(s,catalog);
  assert.equal(places.length,ids.length);assert.equal((html.match(/class="location-item"/g)||[]).length,ids.length);
  for(const [id,p]of places){assert.strictEqual(p,COLLECTION_PLACES[id]);assert(ids.includes(id));}
  assert.doesNotMatch(html,/collection-rack|shelf-art|data-shelf/);
 }
});
test('existing collections restore in the same places with unchanged money',()=>{
 const s=createProfile();Object.assign(s,{owned:ITEMS.map(i=>i.id),goalsWon:GOALS.map(i=>i.id),wallet:17,savings:8,shelfSeen:true,speed:0});
 const before=ownedPlaces(s),after=restore(JSON.stringify(s),s.lastSeen);
 assert.deepEqual(ownedPlaces(after),before);assert.equal(after.wallet,17);assert.equal(after.savings,8);
});
test('purchase receipt points to the actual location instead of obsolete shelves',()=>{
 for(const item of catalog){
  const s=createProfile();s.pendingPurchase={id:item.id,first:true,dream:GOALS.includes(item),reward:0};
  const v=modalView(s,{modal:'purchase-event'});
  assert(v.body.includes(COLLECTION_PLACES[item.id].place));
  assert.match(v.footer,/Посмотреть/);assert.doesNotMatch(v.body,/полк|стеллаж/);
 }
});
test('location art is local and pointer layers keep foreground dirt accessible',()=>{
 assert(existsSync(projectURL('./assets/location-v15/planet-platforms.png',import.meta.url)));
 const css=readFileSync(projectURL('./location-v15.css',import.meta.url),'utf8');
 assert.match(css,/world-collection \{[^}]*z-index:1;pointer-events:none/);
 assert.match(css,/pointer-events:auto/);
 assert.match(css,/pet-v8 \{ pointer-events:none/);
 assert.match(css,/\.pet-silhouette,.pet-feelers,.pet-legs,.pet-hair/);
 assert.match(css,/prefers-reduced-motion/);
});
