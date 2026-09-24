import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import {planOptions,choosePlayPlan} from '../src/play-plan.mjs';
import {installGaze} from '../src/character-gaze.mjs';

function intro(){
 const s=E.createProfile('Пито');
 assert(E.grantInitialMoney(s));assert(E.acknowledgeIncome(s));
 assert(E.meet(s));assert(E.feed(s,'apple'));assert(E.acknowledgeCare(s));
 const shower={spent:0};
 for(let n=0;n<19;n++)assert(E.rain(s,.1,80,shower));
 for(let n=0;n<30&&s.tutorial==='wash';n++)assert(E.rain(s,.1,51,shower));
 assert(E.acknowledgeCare(s));return s;
}
function conserved(s){
 const total=kind=>s.ledger.filter(e=>e.kind===kind).reduce((sum,e)=>sum+e.amount,0);
 assert.equal(s.wallet+s.savings+(s.deposit?.principal||0),total('income')-total('expense'));
 for(const n of [s.wallet,s.savings])assert(Number.isInteger(n)&&n>=0);
}
function ready(){const s=intro();assert(E.setPlan(s,[4,0,12]));assert(E.chooseGoal(s,'console'));return s;}

test('goal missing five cannot quote or accept thirteen, and purchase costs exactly its price',()=>{
 const s=ready();s.wallet+=30;E.record(s,'income',30,'Тестовый доход');
 assert(E.transfer(s,19));s.plan=[4,0,32];s.plans.at(-1).parts=[4,0,32];
 assert.equal(E.goalRemaining(s),5);assert.equal(E.plannedSavingsAmount(s),5);
 const before=JSON.stringify(s);assert(!E.transferToGoal(s,13));assert.equal(JSON.stringify(s),before);
 const wallet=s.wallet;assert(E.transferToGoal(s,5));assert.equal(s.wallet,wallet-5);
 assert.equal(s.savings,24);assert.equal(E.plannedSavingsAmount(s),0);
 assert(E.claimGoal(s));assert.equal(s.savings,0);assert.equal(s.wallet,wallet-5);
 assert.equal(s.ledger.at(-1).amount,24);assert(!E.claimGoal(s));conserved(s);
});

test('existing excess savings survive purchase and reload without disappearing',()=>{
 const s=ready();s.wallet+=30;E.record(s,'income',30,'Тестовый доход');assert(E.transfer(s,32));
 assert(E.claimGoal(s));assert.equal(s.savings,8);const wallet=s.wallet;
 const r=E.restore(JSON.stringify(s),s.lastSeen);assert.equal(r.savings,8);assert.equal(r.wallet,wallet);conserved(r);
});

test('both plan choices cap saving at the selected dream and keep surplus free',()=>{
 const s=ready();s.plan=null;s.wallet=17;s.savings=19;
 for(const choice of ['want','save']){
  const options=planOptions(s,'ball',4,{want:99,save:99},'console');
  assert.equal(options[choice].parts[2],5);
  assert.equal(options[choice].parts.reduce((a,b)=>a+b,0)+options[choice].free,17);
 }
 s.goalsWon=E.GOALS.map(g=>g.id);
 assert.equal(planOptions(s).save.parts[2],0);
});

test('an already purchased preview cannot remain selected as the next dream',()=>{
 const s=ready();s.goalsWon=['console'];s.plannedGoal='bike';
 assert.equal(E.availableGoalChoice(s,'console'),'bike');
 s.goalsWon=E.GOALS.map(g=>g.id);assert.equal(E.availableGoalChoice(s,'bike'),undefined);
});

for(const strategy of ['saving','shopping','mixed'])test(`twelve paid cycles with ${strategy}: growth, purchases, deposits, reload and money conservation`,()=>{
 let s=intro();
 for(let day=1;day<=12;day++){
  const unowned=E.ITEMS.find(i=>!s.owned.includes(i.id));
  const goal=E.GOALS.find(g=>!s.goalsWon.includes(g.id));
  const choice=strategy==='saving'||(strategy==='mixed'&&day%2)||!unowned?'save':'want';
  const plan=choosePlayPlan(s,choice,unowned?.id,4,{},goal?.id)||choosePlayPlan(s,'save',null,4,{},goal?.id);
  assert(E.setPlan(s,plan));if(goal)assert(E.chooseGoal(s,goal.id));
  if(day>=3&&s.deposit&&s.completedCycles>=s.deposit.due)assert(E.collectDeposit(s));
  if(plan[1]>0){assert(E.buy(s,unowned.id));assert(E.acknowledgePurchase(s));}
  const amount=E.plannedSavingsAmount(s);if(amount)assert(E.transferToGoal(s,amount));
  if(goal&&E.goalRemaining(s)===0){assert(E.claimGoal(s));assert(E.acknowledgePurchase(s));}
  if(day>=3&&!s.deposit&&s.wallet>=5&&s.missions.save)assert(E.openDeposit(s,'wallet',1));
  if(s.wallet>=2&&s.needs.food<100)assert(E.feed(s,'apple'));
  for(let seconds=0;seconds<E.CYCLE_SECONDS;seconds+=2)E.tick(s,2);
  assert(E.finishDueCycle(s));conserved(s);
  s=E.restore(JSON.stringify(s),s.lastSeen);conserved(s);
  if(s.adultNotice)assert(E.acknowledgeGrowth(s));
  assert(E.nextCycle(s));assert(E.acknowledgeIncome(s));
 }
 assert.equal(s.stage,2);assert(s.owned.length+s.goalsWon.length>0);conserved(s);
});

test('growth event pupils stay centered rather than chasing pointer behind eyelids',()=>{
 const listeners={},values=new Map();
 const pet={closest:()=>({}),style:{setProperty:(k,v)=>values.set(k,v)}};
 installGaze({dataset:{},querySelectorAll:()=>[pet],addEventListener:(n,fn)=>listeners[n]=fn});
 listeners.pointermove({clientX:999,clientY:999});
 assert.equal(Number(values.get('--gaze-x')),0);assert.equal(Number(values.get('--gaze-y')),-.35);
});
