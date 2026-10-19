import {GOALS,planOutcome} from './engine.mjs';
import {adultLearning} from './learning-copy.mjs';

// Show observed actions, not a claim that a child has passed a knowledge test.
export function parentSkills(s){
 const m=s.missions||{},ledger=s.ledger||[];
 const goal=GOALS.find(g=>g.id===s.goal);
 const challengeDone=kind=>[...(s.periods||[]).map(p=>p.dailyChallenge),s.dailyChallenge].some(d=>d?.kind===kind&&d.status==='done');
 return [
  {id:'care',title:'Заботиться о питомце',description:'Кормить, мыть и гладить Пито.',done:!!(m.feed&&m.wash&&m['intro-pet'])},
  {id:'plan',title:'Распределять деньги',description:'Составить план расходов.',done:!!(m.plan||s.plans?.length||s.plan)},
  {id:'choose',title:'Выбирать мечту',description:'Решить, на что хочется накопить.',done:!!m.goal},
  {id:'reach',title:'Достигать цели',description:'Накопить всю сумму на мечту.',done:!!(s.goalsWon?.length||m['dream-first']||goal&&m.goal&&s.savings>=goal.price)},
  {id:'follow',title:'Следовать плану',description:'Завершить день по своему плану.',done:!!s.periods?.some(p=>(p.plan||p.planned)&&planOutcome(p).met)},
  {id:'deposit',title:'Разбираться во вкладах',description:'Открыть вклад ради дохода.',done:!!(s.deposit||ledger.some(e=>e.kind==='bank-in'))},
  {id:'gift',title:'Выбирать хотелки',description:'Выбрать первую вещь для Пито.',done:!!m.buy},
  {id:'play',title:'Играть с питомцем',description:'Порадовать Пито новой вещью.',done:!!m['intro-play']},
  {id:'save',title:'Пополнять копилку',description:'Отложить штучки на мечту.',done:!!m.save},
  {id:'second',title:'Исполнить вторую мечту',description:'Накопить и купить ещё одну мечту.',done:(s.goalsWon||[]).length>=2},
  {id:'income',title:'Получить доход',description:'Забрать вклад с прибылью.',done:ledger.some(e=>e.kind==='income'&&e.label==='Награда по вкладу'&&e.amount>0)},
  {id:'day-save',title:'День мечты',description:'Отложить в копилку без покупки хотелок.',done:challengeDone('save')},
  {id:'day-wants',title:'День хотелок',description:'Купить хотелку без пополнения копилки.',done:challengeDone('wants')},
  {id:'big-deposit',title:'Вклад побольше',description:'Положить на вклад больше 10 штучек.',done:challengeDone('deposit')||!!m['deposit-big']}
 ].map(skill=>({...skill,description:adultLearning(skill.id,skill.done)}));
}
