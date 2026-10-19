import {cycleSummary, planOutcome, growthProgress, GROWTH_AWARDS, freeCare} from './engine.mjs';
import {icon, pet} from './visuals.mjs';
import {completionSticker} from './completion-sticker.mjs';

const n=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(value)||0);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasons=['Купили еду или воду','Уложились в свой план','Отложили штучки'];
const countPlans=s=>(s.periods||[]).filter(p=>(p.growthReasons||[]).includes(reasons[1])).length;
const planWord=k=>k%10===1&&k%100!==11?'раз':k%10>=2&&k%10<=4&&(k%100<12||k%100>14)?'раза':'раз';
const puppet=(s,stage=s.stage,emotion='neutral')=>`<div class="gr-pet-frame" aria-hidden="true">${pet({...s,stage},true,emotion).replace('data-pet','disabled')}</div>`;
const careArt=()=>`<span class="gr-care-art">${icon('apple')}${icon('cloud')}</span>`;
function sources(gained=null,awards=null,explain=false,statuses=null,decorated=false){return `<div class="gr-sources">${[['Уход',careArt(),'care'],['План',icon('task'),'plan'],['Копилка',icon('jar'),'savings']].map(([label,picture,key],i)=>{
 const value=gained?(awards?.[key]??Number(gained.includes(reasons[i]))):GROWTH_AWARDS[key];
 const status=statuses?.[key]||(gained&&value>0?'Сделано!':''),missed=status==='Не по плану'||status==='Не сделано';
 return `<div class="gr-source gr-source-${i}${status?' has-completion':''}${missed?' gr-source-missed':''}">${status?completionSticker(status):''}${decorated?`<span class="gr-source-picture">${picture}</span>`:picture}<strong>${label} +${value}</strong>${explain?`<small>${['Купи еду<br>или воду','Соблюдай<br>план дня','Отложи<br>штучки'][i]}</small>`:''}</div>`;
 }).join('')}</div>`;}
function progress(s,heading,withSources=null,awards=null){
 const p=growthProgress(s),target=p.nextThreshold,filled=Math.min(target,Math.max(0,Math.floor(p.points)));
 if(p.complete)return `<section class="gr-progress"><h3>Пито уже вырос!</h3><p>Можно копить на новые мечты и собирать вещи.</p>${withSources?sources(withSources,awards):''}</section>`;
 return `<section class="gr-progress"><h3>${heading}</h3>${withSources?sources(withSources,awards):''}<div class="gr-dots" role="img" aria-label="${filled} из ${target} шагов роста">${Array.from({length:target},(_,i)=>`<i class="${i<filled?'filled':''}"></i>`).join('')}</div><strong class="gr-progress-count">${filled} из ${target} шагов</strong></section>`;
}
const counter=s=>`<div class="gr-plan-count">${icon('check')}<strong>План выполнен ${countPlans(s)} ${planWord(countPlans(s))}</strong></div>`;
const stages=s=>`<div class="gr-stages">${['Малыш','С усиками','С ножками'].map((label,stage)=>`<div class="gr-stage ${s.stage===stage?'current':''}" ${s.stage===stage?'aria-current="step"':''}>${puppet(s,stage)}<strong>${label}</strong></div>`).join('')}</div>`;
export function growthPlanHelp(s,{saved=false}={}){
 return `<section class="planning-intro"><div class="planning-intro-scene"><img class="planning-intro-art" src="assets/revision/plan-intro-scene-top.png" alt="Пример плана: еда 2 штучки, мытьё 2, хотелки 4, копилка 12"><div class="planning-intro-pet" aria-hidden="true">${puppet(s,s.stage,'neutral')}</div></div><div class="planning-intro-copy"><p><strong>Давай составим финансовый план!</strong></p><p>Каждый день решай, сколько потратить на еду, мытьё и новую хотелку, а сколько отложить в копилку на мечту.</p><p>Звучит сложно, но мы справимся. Давай начинать!</p></div></section>`;
}

export function dayReviewView(s){
 const raw=s.periods?.at(-1)||cycleSummary(s),planned=raw.planned||{care:raw.plan?.[0]||0,wants:raw.plan?.[1]||0,savings:raw.plan?.[2]||0},actual=raw.actual||{care:0,wants:0,savings:0};
 const saved=Math.max(0,(actual.savings||0)+(raw.savingsBasis==='new-contributions'?0:Math.max(0,-(raw.bankSaved||0))));
 const outcome=planOutcome(raw),gained=raw.growthReasons||[],hasPlan=raw.walletAtPlan!=null||(!Object.hasOwn(raw,'walletAtPlan')&&Array.isArray(raw.plan))||(s.plans||[]).some(p=>p.cycle===raw.cycle)||(s.cycle===raw.cycle&&Array.isArray(s.plan));
 const acted=(actual.care||0)+(actual.wants||0)+Math.max(0,actual.savings||0)>0;
 const met=hasPlan&&outcome.met,heading=!hasPlan?'Завтра составим план':met?(acted?'План выполнен!':'День без трат'):'Не всё по плану';
 const differences=[['На еду и воду ушло больше',planned.care,actual.care,'Потрачено'],['На хотелки ушло больше',planned.wants,actual.wants,'Потрачено'],['В копилку отложили меньше',planned.savings,saved,'Отложено']].filter((x,i)=>i===2?x[2]<x[1]:x[2]>x[1]);
 const details=!hasPlan?'<p class="gr-praise">План поможет оставить штучки на нужное.</p>':met?'':`<div class="gr-differences">${differences.map(([label,a,b,verb])=>`<section class="gr-difference"><h3>${label}</h3><div class="gr-comparison"><span>План <b>${n(a)}</b></span><span>${verb} <b>${n(b)}</b></span></div></section>`).join('')}</div>`;
 const confetti=met&&acted?`<span class="gr-scattered-confetti" aria-hidden="true">${Array.from({length:12},(_,i)=>`<img src="assets/celebration/confetti-${i%6}.png" alt="">`).join('')}</span>`:'';
 const portrait=`<div class="gr-portrait">${confetti}${puppet(s,s.stage,hasPlan&&!met?'sad':met&&acted?'happy':'neutral')}</div>`;
 const p=growthProgress(s),left=Math.max(0,p.nextThreshold-Math.floor(p.points)),stepWord=left%10===1&&left%100!==11?'шаг':left%10>=2&&left%10<=4&&(left%100<12||left%100>14)?'шага':'шагов';
 const missedStatuses=!met?Object.fromEntries(['care','plan','savings'].map((key,i)=>[key,(raw.growthAwards?.[key]??Number(gained.includes(reasons[i])))>0?'Сделано!':key==='plan'&&hasPlan?'Не по плану':'Не сделано'])):null;
 const growth=progress(s,p.complete?'Пито уже вырос!':left===0?'Шаги для роста собраны':`До роста — ${left} ${stepWord}`),earned=sources(gained,raw.growthAwards,false,missedStatuses,true);
 const savingsPlate=met?`<div class="gr-saved-today"><strong>На мечту<br>отложено</strong><span>${icon('coin')}<b>${n(saved)}</b></span></div>`:'';
const body=`<div class="growth-review gr-day gr-painted-day ${met?'gr-met':'gr-missed'} ${differences.length>1?'gr-many-differences':''}" data-plan-success="${met&&acted}"><header class="gr-day-heading"><h3 class="gr-result-title">${heading}</h3><p class="gr-day-subtitle">День ${raw.cycle} завершён</p></header>${portrait}${details}${savingsPlate}${growth}${earned}</div>`;
 return {title:`День ${raw.cycle} завершён`,body,footer:'<button class="btn primary wide" data-act="next-cycle">Новый день</button>',closable:false};
}
export function growthReviewView(s){
 if(freeCare(s))return {title:'Пито растёт',body:`<div class="growth-review gr-details"><div class="gr-stages">${['Малыш','С усиками','С ножками'].map((label,stage)=>`<div class="gr-stage ${stage===0?'current':''}">${puppet(s,stage)}<strong>${label}</strong></div>`).join('')}</div><p class="gr-lesson">Сейчас Пито ещё малыш. Заботься о нём! Скоро узнаешь, как помогать ему расти быстрее.</p></div>`,footer:'<button class="btn primary wide" data-act="close">К Пито</button>',closable:true};
 const today=cycleSummary(s),a=today.growthAwards||{},statuses={care:a.care?'Сделано!':'',savings:a.savings?'Сделано!':'',plan:s.plan&&a.plan?(s.review?'Сделано!':'По плану'):''};
 const body=`<div class="growth-review gr-details gr-painted"><div class="gr-growth-board">${stages(s)}${progress(s,'До нового роста')}</div>${counter(s)}${sources(null,null,false,statuses)}<p class="gr-lesson gr-painted-lesson">${s.stage===2?'Ты помог Пито вырасти.<br>Впереди новые мечты!':'Выполняй план —<br>Пито будет расти быстрее!'}</p></div>`;
 return {title:s.stage===2?'Пито вырос!':'Пито растёт',body,footer:'<button class="btn primary wide" data-act="close">К Пито</button>',closable:true};
}
