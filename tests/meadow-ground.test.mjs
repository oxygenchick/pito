import test from 'node:test';
import assert from 'node:assert/strict';
import {groundBottom} from '../src/meadow-ground.mjs';
test('ground follows symmetric hill and wide objects rest on lowest edge',()=>{
 assert.equal(groundBottom(20),groundBottom(80));
 assert.ok(groundBottom(50)>groundBottom(20));
 assert.ok(groundBottom(15.5,12.5)<groundBottom(15.5));
 for(const x of [-100,0,20,50,80,100,1000,NaN])assert.ok(groundBottom(x)>=23.2&&groundBottom(x)<=27.6);
});
