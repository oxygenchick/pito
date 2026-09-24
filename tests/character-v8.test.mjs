import {projectURL} from './project-path.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {pet,poop,icon,shelf} from '../src/visuals.mjs';
import {gazeOffset,installGaze} from '../src/character-gaze.mjs';
test('decorative icons are raster images, including former SVG symbols',()=>{
 for(const id of ['coin','heart','drop','rain','settings','task','ball','comic','puzzle','kite','console','bike','house','hand','arrow','lock','home','sun','check','close','star']){
  const html=icon(id);assert.match(html,/^<img/);assert.doesNotMatch(html,/<svg/);
  assert.ok(existsSync(projectURL('./'+html.match(/src="([^"]+)"/)[1],import.meta.url)));
 }
});
test('pet has independent white eyes and two pupils, with all mouth layers',()=>{
 const html=pet({stage:2,hair:1,color:2});
 assert.equal((html.match(/class="pupil"/g)||[]).length,2);
 assert.equal((html.match(/class="mouth-layer /g)||[]).length,5);
 assert.doesNotMatch(html,/mouth-whistle/);
 assert.match(html,/ui-v11\/eyes-happy.png/);
 for(const name of ['body','feelers','legs','hair-1','pupil','eyes-neutral','mouth-smile'])assert.ok(html.includes(`${name==='body'?'ui-v13':['hair-1','mouth-smile'].includes(name)?'ui-v10':'pet-v8'}/${name}.png`));
 assert.doesNotMatch(html,/<svg|bodyclip|10-home-shelf/);
});
test('expression follows needs, explicit action overrides, preview respects explicit emotion',()=>{
 const p={needs:{food:10,clean:90,affection:60}};
 assert.match(pet(p),/data-emotion="sad"/);
 assert.match(pet(p,false,'eating'),/data-emotion="eating"/);
 assert.match(pet(p,true,'happy'),/data-emotion="happy"/);
});
test('gaze remains bounded even far outside pet, without non-finite values',()=>{
 assert.deepEqual(gazeOffset(1e6,-1e6,{left:0,top:0,width:100,height:100}),{x:1,y:-1});
 const centered=gazeOffset(50,50,{left:0,top:0,width:100,height:100});assert.deepEqual(centered,{x:0,y:0});
 assert.deepEqual(gazeOffset(NaN,0,{left:0,top:0,width:0,height:0}),{x:0,y:0});
 assert.deepEqual(gazeOffset(0,0,{left:0,top:0,width:0,height:0}),{x:0,y:0});
});
test('gaze follows the eye centre rather than the tall interaction area, then resets on touch release',()=>{
 const events={},values=new Map();
 const character={querySelector:()=>({getBoundingClientRect:()=>({left:40,top:80,width:20,height:10})}),getBoundingClientRect:()=>({left:0,top:0,width:100,height:200}),style:{setProperty:(k,v)=>values.set(k,v),removeProperty:k=>values.delete(k)}};
 const root={dataset:{},querySelectorAll:()=>[character],addEventListener:(type,fn)=>{assert.ok(!events[type]);events[type]=fn;}};
 installGaze(root);installGaze(root);
 events.pointermove({clientX:50,clientY:85});assert.equal(values.get('--gaze-x'),'0.000');assert.equal(values.get('--gaze-y'),'0.000');
 events.pointerdown({clientX:200,clientY:0});assert.equal(values.get('--gaze-x'),'1.000');assert.equal(values.get('--gaze-y'),'-1.000');
 events.pointerup({pointerType:'mouse'});assert.equal(values.size,2);
 events.pointerup({pointerType:'touch'});assert.equal(values.size,0);
 events.pointermove({clientX:0,clientY:0});events.pointerleave();assert.equal(values.size,0);
});
test('pupil masks use exactly the visible whites for each open-eye emotion',()=>{
 const css=readFileSync(projectURL('./character-v8.css',import.meta.url),'utf8');
 assert.match(css,/mask-mode:alpha/);
 assert.ok(css.includes(`[data-emotion=sad] .pet-pupils { -webkit-mask-image:url('../assets/pet-v8/eyes-sad.png'); mask-image:url('../assets/pet-v8/eyes-sad.png')`));
 const current=readFileSync(projectURL('./polish-v11.css',import.meta.url),'utf8');
 assert.match(current,/\[data-emotion=happy\] \.pet-pupils[^}]+-webkit-mask-image:url\('\.\.\/assets\/ui-v11\/eyes-happy.png'\);\s*mask-image:url\('\.\.\/assets\/ui-v11\/eyes-happy.png'\)/);
 assert.match(css,/\[data-emotion=washing\] \.pet-pupils,\.pet-v8\[data-emotion=sleeping\] \.pet-pupils \{ display:none/);
 assert.match(css,/\.pet-pupils>span[^}]+overflow:visible/);
});
test('eye sprites share registration and the pupil is a square circular sprite',()=>{
 const pngSize=name=>{const png=readFileSync(projectURL(`./assets/${name==='eyes-happy'?'ui-v11':'pet-v8'}/${name}.png`,import.meta.url));return [png.readUInt32BE(16),png.readUInt32BE(20)];};
 for(const emotion of ['neutral','happy','sad','closed'])assert.deepEqual(pngSize(`eyes-${emotion}`),[440,200]);
 assert.deepEqual(pngSize('pupil'),[160,160]);
 const css=readFileSync(projectURL('./character-v8.css',import.meta.url),'utf8');
 assert.match(css,/aspect-ratio:440\/200/);
 assert.doesNotMatch(css,/\[data-emotion=(?:happy|sad)\] \.pet-pupils>span/);
});
test('poop states use three matching sprites and preserve progress',()=>{
 const html=poop({id:1,x:20,taps:3,wet:0});
 for(const state of ['sleep','awake','run'])assert.match(html,new RegExp(`poop-${state}.png`));
 assert.match(html,/width:50%/);
});
test('first purchase shelf is revealed only after its introduction',()=>{
 assert.equal(shelf({owned:['ball'],goalsWon:[],shelfSeen:false,pendingPurchase:{id:'ball'}},[]),'');
 const html=shelf({owned:['ball'],goalsWon:[],shelfSeen:true,pendingPurchase:null},[]);
 assert.match(html,/class="world-collection"/);assert.match(html,/items-v14\/bubble-tea.png/);
});
