import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../src/engine.mjs';
import {kidOverlay} from '../src/kid-overlays.mjs';

function playing() {
  const s=E.createProfile('Тест');
  Object.assign(s,{wallet:20,savings:5,tutorial:'done',plan:[4,4,12],cycle:3,completedCycles:2});
  for(const id of ['feed','wash','plan','goal','save'])s.missions[id]={cycle:1,rewardPaid:0,resolution:'completed'};
  return s;
}
const view=(s,modal,extra={})=>kidOverlay(s,{modal,transferAmount:1,journalTab:'active',...extra});
const markup=v=>v.body+v.footer;
const actions=v=>[...markup(v).matchAll(/data-act="([^"]+)"/g)].map(m=>m[1]);

test('planned savings after paid care are not presented as eating into the same reserve twice',()=>{
 const s=playing();s.wallet=14;s.plan=[4,0,12];
 E.record(s,'expense',2,'Яблоко','food');
 const amount=E.plannedSavingsAmount(s),before=JSON.stringify(s);
 assert.equal(amount,12);
 const v=view(s,'goal',{transferAmount:amount});
 assert.match(v.body,/Отложим[\s\S]*<span>12<\/span>/);
 assert.doesNotMatch(v.body,/останется мало/i);
 assert.equal(JSON.stringify(s),before);
});

test('savings still warn when a proposed extra transfer takes the remaining care money',()=>{
 const s=playing();s.wallet=3;s.plan=[4,0,12];
 E.record(s,'expense',2,'Яблоко','food');
 const v=view(s,'goal',{transferAmount:2,transferMode:'manual'});
 assert.match(v.body,/Если отложить ещё, останется мало/);
});

test('matured principal does not inflate the amount planned for saving today',()=>{
 const s=playing();s.plan=[4,0,5];s.wallet=24;
 E.record(s,'bank-out',10,'Возврат вклада');
 E.record(s,'income',5,'Доход');
 const amount=E.plannedSavingsAmount(s);
 assert.equal(amount,5);
 assert.match(view(s,'goal',{transferAmount:amount}).footer,/<span>5<\/span>/);
 assert(E.transfer(s,amount));
 assert.equal(E.plannedSavingsAmount(s),0);
 assert.equal(E.cycleSummary(s).actual.savings,5);
 assert.equal(E.planOutcome(E.cycleSummary(s)).met,true);
});
function button(v,action){
  const match=[...markup(v).matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(m=>m[1].includes(`data-act="${action}"`));
  assert.ok(match,`Missing ${action}`);
  return {attributes:match[1],disabled:/\sdisabled(?:\s|$)/.test(match[1]),text:match[2]};
}

for(const modal of ['goal','choose-goal','withdraw','bank','journal']) {
  test(`${modal}: pure complete overlay contract`,()=>{
    const s=playing(),before=JSON.stringify(s),v=view(s,modal);
    assert.equal(JSON.stringify(s),before);
    assert.ok(v.title);
    assert.equal(typeof v.body,'string');
    assert.equal(typeof v.footer,'string');
    assert.equal(v.closable,true);
    assert.doesNotMatch(markup(v),/undefined|NaN/);
  });
}
test('unowned routes and absent profile fall through',()=>{
  assert.equal(view(playing(),'feed'),null);
  assert.equal(view(null,'goal'),null);
});
test('choose-goal keeps all five goals with actual prices',()=>{
  const v=view(playing(),'choose-goal');
  assert.equal(actions(v).filter(a=>a==='goal-choice').length,5);
  for(const g of E.GOALS){assert.ok(v.body.includes(`data-id="${g.id}"`));assert.ok(v.body.includes(`<span>${g.price}</span>`));}
});
test('owned dreams remain visible but cannot be selected',()=>{
  const s=playing();s.goalsWon=['console'];
  const v=view(s,'choose-goal');
  assert.match(v.body,/<button[^>]*data-id="console"[^>]*disabled/);
  assert.match(v.body,/Уже есть/);
});
test('goal exposes a bounded bar, target price and computed remaining amount',()=>{
  const s=playing(),v=view(s,'goal');
  assert.match(v.body,/aria-valuemax="24"/);
  assert.match(v.body,/aria-valuenow="5"/);
  assert.match(v.body,/В копилке[\s\S]*<span>5<\/span>/);
  assert.match(v.body,/Осталось[\s\S]*<span>19<\/span>/);
  assert.doesNotMatch(v.body,/В кошельке|stepper/);
});
test('goal preset uses remaining savings plan and protects four coins for care',()=>{
  const s=playing();s.wallet=9;s.plan=[4,0,12];
  s.ledger.push({cycle:3,kind:'transfer',amount:2,label:'Копилка'});
  const v=view(s,'goal',{transferAmount:5});
  assert.match(v.body,/data-act="transfer-mode"[^>]*data-id="plan"[^>]*aria-pressed="true"/);
  assert.match(v.body,/Отложим[\s\S]*<span>5<\/span>/);
  assert.ok(!actions(v).includes('transfer-preset'));
});
test('one planned coin does not duplicate presets',()=>{
  const s=playing();s.plan=[4,15,1];
  assert.ok(!actions(view(s,'goal')).includes('transfer-preset'));
});
test('zero, excessive, fractional and non-finite transfers are unavailable',()=>{
  for(const amount of [0,-1,21,1.5,NaN,Infinity])assert.ok(button(view(playing(),'goal',{transferAmount:amount,transferMode:'manual'}),'transfer').disabled);
});
test('positive affordable transfer remains available',()=>{
  assert.equal(button(view(playing(),'goal',{transferAmount:3,transferMode:'manual'}),'transfer').disabled,false);
});
test('goal purchase only appears when enough is saved',()=>{
  const s=playing();s.savings=24;
  const v=view(s,'goal');
  assert.equal(button(v,'claim-goal').disabled,false);
  assert.match(button(v,'claim-goal').attributes,/data-category="wants"/);
  assert.ok(!actions(v).includes('transfer'));
  assert.match(v.body,/aria-valuenow="24"/);
  s.savings=100;
  assert.match(view(s,'goal').body,/width:100%/);
});
test('won goal is not purchasable again',()=>{
  const s=playing();s.savings=100;s.goalsWon=['console'];
  assert.ok(!actions(view(s,'goal')).includes('claim-goal'));
});
test('withdraw confirmation shows exact post-withdraw balance',()=>{
  const s=playing(),v=view(s,'withdraw');
  assert.match(v.body,/Останется[\s\S]*<span>4<\/span>/);
  assert.match(v.body,/До мечты дальше на 1 штучку/);
  assert.equal(button(v,'withdraw-confirm').disabled,false);
  s.savings=0;
  assert.ok(button(view(s,'withdraw'),'withdraw-confirm').disabled);
});
test('model pause guards also disable transfer, goal selection, withdrawal and deposit',()=>{
  for(const field of ['review','pendingGrowth','pendingIncome','pendingReward']){
    const s=playing();s[field]=true;
    assert.ok(button(view(s,'goal'),'transfer').disabled,field);
    assert.ok(button(view(s,'choose-goal'),'goal-choice').disabled,field);
    assert.ok(button(view(s,'withdraw'),'withdraw-confirm').disabled,field);
    assert.ok(button(view(s,'bank'),'bank-open').disabled,field);
  }
});
test('bank offers ten to fifteen with a clear one day lock instead of unexplained suns',()=>{
  const v=view(playing(),'bank');
  assert.match(v.body,/<span>10<\/span>/);
  assert.match(v.body,/<span>15<\/span>/);
  assert.equal((v.body.match(/class="ko-day /g)||[]).length,0);
  assert.match(v.body,/Через 1 игровой день/);
  assert.match(v.body,/До конца срока эти штучки нельзя потратить/);
  assert.match(v.body,/assets\/ui-v8\/lock.png/);
  assert.equal(button(v,'bank-open').disabled,false);
});
test('bank respects day, mission, plan and cash guards',()=>{
  for(const configure of [s=>s.cycle=2,s=>delete s.missions.save,s=>delete s.missions.goal,s=>s.plan=null,s=>{s.wallet=0;s.savings=0;},s=>s.tutorial='wash']){
    const s=playing();configure(s);
    assert.ok(button(view(s,'bank'),'bank-open').disabled);
  }
});
test('bank explicitly confirms funding from savings when wallet has only care reserve',()=>{
  const s=playing();s.wallet=4;s.savings=16;
  const v=view(s,'bank');
  assert.equal(button(v,'bank-open').disabled,false);
  assert.match(v.body,/Из копилки/);
  assert.match(v.body,/штучки нельзя потратить/);
  assert.doesNotMatch(v.body,/потратить на мечту/);
  assert.match(button(v,'bank-open').text,/Положить из копилки/);
  assert.match(button(v,'bank-open').attributes,/data-funding-source="savings"/);
});
test('bank does not silently select savings when wallet can fund the deposit',()=>{
  const s=playing();s.savings=16;
  const v=view(s,'bank');
  assert.doesNotMatch(button(v,'bank-open').text,/из копилки/);
  assert.match(button(v,'bank-open').attributes,/data-funding-source="wallet"/);
});
test('bank can use savings without taking the remaining care coins',()=>{
  const s=playing();s.wallet=3;s.savings=20;
  assert.equal(button(view(s,'bank'),'bank-open').disabled,false);
  assert.match(button(view(s,'bank'),'bank-open').attributes,/data-funding-source="savings"/);
});
test('locked deposit offers return to play, not premature collect',()=>{
  const s=playing();s.deposit={principal:10,bonus:5,due:4};
  const v=view(s,'bank');
  assert.ok(actions(v).includes('close'));
  assert.ok(!actions(v).includes('bank-collect'));
  assert.match(v.body,/Осталось игровых дней: 2/);
  s.completedCycles=3;
  assert.match(view(s,'bank').body,/Через 1 игровой день/);
});
test('mature deposit returns actual legacy principal and bonus',()=>{
  const s=playing();s.deposit={principal:12,bonus:5,due:2};
  const v=view(s,'bank');
  assert.equal(button(v,'bank-collect').disabled,false);
  assert.match(button(v,'bank-collect').text,/<span>17<\/span>/);
  assert.match(v.body,/Срок закончился/);
  s.pendingIncome={amount:8};
  assert.ok(!actions(view(s,'bank')).includes('bank-collect'));
});
test('invalid legacy deposit cannot be collected',()=>{
  const s=playing();s.deposit={principal:-10,bonus:5,due:2};
  assert.ok(!actions(view(s,'bank')).includes('bank-collect'));
});
test('journal descriptions are disclosed, not duplicated on active list',()=>{
  const s=playing(),v=view(s,'journal');
  assert.match(v.body,/data-act="guide" data-id="paid-food"/);
  assert.doesNotMatch(v.body,/Пито проголодался/);
  const done=view(s,'journal',{journalTab:'done'});
  assert.match(done.body,/<details class="ko-completed">/);
  assert.match(done.body,/Яблоко стоило 2 штучки/);
});
test('legacy free onboarding is not described as a paid action',()=>{
  const s=playing();s.onboardingPaid=false;
  const v=view(s,'journal',{journalTab:'done'});
  assert.match(v.body,/Первое яблоко было бесплатным/);
  assert.doesNotMatch(v.body,/Яблоко стоило 2/);
});
test('error text is escaped and not executable markup',()=>{
  const v=view(playing(),'goal',{error:'<img src=x onerror="boom">'});
  assert.match(v.body,/&lt;img src=x onerror=&quot;boom&quot;&gt;/);
  assert.doesNotMatch(v.body,/<img src=x/);
});

test('dream choices are previews and require a separate confirmation button',()=>{
 const s=playing();delete s.missions.goal;s.plannedGoal=null;
 const before=JSON.stringify(s),empty=view(s,'choose-goal',{goalChoice:null});
 assert.equal(button(empty,'goal-confirm').disabled,true);
 const selected=view(s,'choose-goal',{goalChoice:'bike'});
 assert.equal(button(selected,'goal-confirm').disabled,false);
 assert.match(selected.body,/data-id="bike" aria-pressed="true"/);
 assert.equal(JSON.stringify(s),before);
 s.goalsWon=['bike'];assert.equal(button(view(s,'choose-goal',{goalChoice:'bike'}),'goal-confirm').disabled,true);
});

test('savings separates plan and manual modes and removes unrelated withdrawal actions',()=>{
 const v=view(playing(),'goal',{transferMode:'manual',transferAmount:3});
 assert.match(v.body,/data-id="manual" aria-pressed="true"/);
 assert.match(v.body,/data-act="transfer-step" data-delta="-1"/);
 assert.match(v.body,/data-act="transfer-step" data-delta="1"/);
 assert.ok(!actions(v).includes('withdraw'));
 assert.ok(!actions(v).includes('choose-goal'));
 assert.equal(actions(v).filter(a=>a==='goal-step').length,2);
 assert.equal(actions(v).filter(a=>a==='transfer').length,1);
});

test('completed plan has no accidental second transfer but manual saving remains available',()=>{
 const s=playing();s.plan=[4,4,12];s.ledger.push({cycle:3,kind:'transfer',amount:12,label:'Копилка'});
 const v=view(s,'goal',{transferMode:'plan',transferAmount:0,transferNotice:'Отложили 12 штучек'});
 assert.equal(actions(v).includes('transfer'),false);
 assert.equal(button(v,'close').disabled,false);
 assert.match(v.body,/Всё по плану уже отложили/);
 assert.match(v.body,/role="status"/);
 assert.equal(button(view(s,'goal',{transferMode:'manual',transferAmount:1}),'transfer').disabled,false);
});

test('a zero quote caused by empty wallet never claims the savings plan was fulfilled',()=>{
 const s=playing();s.wallet=0;
 const v=view(s,'goal',{transferMode:'plan',transferAmount:0});
 assert.match(v.body,/Пока не хватает свободных штучек/);
 assert.doesNotMatch(v.body,/Всё по плану уже отложили/);
 assert.equal(actions(v).includes('transfer'),false);
 assert.equal(button(v,'close').disabled,false);
});

test('growth and purchase events lock dream navigation and transfers',()=>{
 for(const field of ['adultNotice','pendingPurchase']) {
  const s=playing();s[field]=true;
  assert.equal(button(view(s,'goal'),'goal-step').disabled,true);
  assert.equal(button(view(s,'goal'),'transfer').disabled,true);
  assert.equal(button(view(s,'choose-goal',{goalChoice:'bike'}),'goal-confirm').disabled,true);
 }
});

test('after buying four dreams the last unowned dream is still reachable',()=>{
 const s=playing();s.goal='phone';s.goalsWon=['console','bike','house','phone'];
 assert.equal(button(view(s,'goal'),'goal-step').disabled,false);
 s.goal='guitar';assert.equal(button(view(s,'goal'),'goal-step').disabled,true);
 s.goalsWon.push('guitar');assert.equal(button(view(s,'goal'),'goal-step').disabled,true);
});
