import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderStart} from './start-screens.mjs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');

test('v8 creation uses illustrated hair choices and keeps accessible selections',()=>{
 const html=renderStart('create',null,{hair:2});
 for(let i=0;i<3;i++) assert.match(html,new RegExp(`assets/${i===1?'ui-v10':'pet-v8'}/hair-${i}\\.png`));
 assert.match(html,/data-act="hair" data-id="2"[^>]+aria-pressed="true"/);
 assert.match(html,/aria-label="На старт"/);
 assert.doesNotMatch(read('./start-screens.mjs'),/const homeIcon = svg|<path d=/);
});
test('v8 title art remains separate from live slogan and playable start action',()=>{
 const html=renderStart('start',null,{face:2});
 assert.match(html,/src="assets\/ui-v8\/logo.png"/);
 assert.match(html,/<p class="ss-tagline">Твой финансовый дружище<\/p>/);
 assert.match(html,/start-face face2/);
 assert.match(html,/data-act="new"/);
 assert.doesNotMatch(html,/<i><\/i><i><\/i><b class="mouth"/);
});
test('v8 is the explicit final typography/layout layer with minimum readable body size',()=>{
 assert.match(read('./index.html'),/href="fonts.css"><link rel="stylesheet" href="polish-v8.css"/);
 const css=read('./polish-v8.css');
 assert.match(css,/font-size:clamp\(18px,4.8cqw,21px\)/);
 assert.match(css,/font-weight:400/);
 assert.match(css,/font-weight:700/);
 assert.match(css,/\.panel-heading.*position:relative/);
});
