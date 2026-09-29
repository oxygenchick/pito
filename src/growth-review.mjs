import {cycleSummary, planOutcome, growthProgress, GROWTH_AWARDS} from './engine.mjs';
import {icon, pet} from './visuals.mjs';

const n=value=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(Number(value)||0);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasons=['Купили еду или воду','Уложились в свой план','Отложили штучки'];
const countPlans=s=>(s.periods||[]).filter(p=>(p.growthReasons||[]).includes(reasons[1])).length;
const planWord=k=>k%10===1&&k%100!==11?'раз':k%10>=2&&k%10<=4&&(k%100<12||k%100>14)?'раза':'раз';
const puppet=(s,stage=s.stage,emotion='neutral')=>`<div class="gr-pet-frame" aria-hidden="true">${pet({...s,stage},true,emotion).replace('data-pet','disabled')}</div>`;
const careArt=()=>`<span class="gr-care-art">${icon('apple')}${icon('cloud')}</span>`;
function sources(gained=null,awards=null,explain=false){return `<div class="gr-sources">${[['Уход',careArt(),'care'],['План',icon('task'),'plan'],['Копилка',icon('jar'),'savings']].map(([label,picture,key],i)=>{
 const value=gained?(awards?.[key]??Number(gained.includes(reasons[i]))):GROWTH_AWARDS[key];
 return `<div class="gr-source gr-source-${i}">${picture}<strong>${label} +${value}</strong>${explain?`<small>${['Купи еду<br>или воду','Соблюдай<br>план дня','Отложи<br>штучки'][i]}</small>`:''}</div>`;
 }).join('')}</div>`;}
function progress(s,heading,withSources=null,awards=null){
 const p=growthProgress(s),target=p.nextThreshold,filled=Math.min(target,Math.max(0,Math.floor(p.points)));
 if(p.complete)return `<section class="gr-progress"><h3>Пито уже вырос!</h3><p>Можно копить на новые мечты и собирать вещи.</p>${withSources?sources(withSources,awards):''}</section>`;
 return `<section class="gr-progress"><h3>${heading}</h3>${withSources?sources(withSources,awards):''}<div class="gr-dots" role="img" aria-label="${filled} из ${target} шагов роста">${Array.from({length:target},(_,i)=>`<i class="${i<filled?'filled':''}"></i>`).join('')}</div><strong class="gr-progress-count">${filled} из ${target} шагов</strong></section>`;
}
const counter=s=>`<div class="gr-plan-count">${icon('check')}<strong>План выполнен ${countPlans(s)} ${planWord(countPlans(s))}</strong></div>`;
export function growthPlanHelp(s,{saved=false}={}){
 const message=saved?'<h3>Теперь следуй плану</h3><p>Ты составил план, но твои деньги ещё не потрачены. Теперь тебе нужно самому ухаживать за Пито, покупать вещи и откладывать в копилку.</p><p>Не переживай, мы всё расскажем на следующих этапах.</p>':'<h3>Выполняй план — Пито будет расти быстрее!</h3><p>Оставляй штучки, чтобы покормить и помыть Пито. Выделяй, сколько хочешь потратить на покупку вещей и сколько отложить в копилку на свою мечту.</p>';
 return `<section class="growth-review gr-plan-help"><div class="gr-lesson gr-plan-message">${message}</div><div class="gr-stages">${['Малыш','С усиками','С ножками'].map((label,stage)=>`<div class="gr-stage">${puppet(s,stage)}<strong>${label}</strong></div>`).join('')}</div>${sources(null,null,true)}</section>`;
}
export function dayReviewView(s){
 const raw=s.periods?.at(-1)||cycleSummary(s),planned=raw.planned||{care:raw.plan?.[0]||0,wants:raw.plan?.[1]||0,savings:raw.plan?.[2]||0},actual=raw.actual||{care:0,wants:0,savings:0};
 const saved=Math.max(0,(actual.savings||0)+(raw.savingsBasis==='new-contributions'?0:Math.max(0,-(raw.bankSaved||0))));
 const outcome=planOutcome(raw),gained=raw.growthReasons||[],hasPlan=raw.walletAtPlan!=null||(!Object.hasOwn(raw,'walletAtPlan')&&Array.isArray(raw.plan))||(s.plans||[]).some(p=>p.cycle===raw.cycle)||(s.cycle===raw.cycle&&Array.isArray(s.plan));
 const acted=(actual.care||0)+(actual.wants||0)+Math.max(0,actual.savings||0)>0;
 const met=hasPlan&&outcome.met,heading=!hasPlan?'Завтра составим план':met?(acted?'План выполнен!':'День без трат'):'Не всё по плану';
 const differences=[['На еду и воду ушло больше',planned.care,actual.care,'Потрачено'],['На хотелки ушло больше',planned.wants,actual.wants,'Потрачено'],['В копилку отложили меньше',planned.savings,saved,'Отложено']].filter((x,i)=>i===2?x[2]<x[1]:x[2]>x[1]);
 const details=!hasPlan?'<p class="gr-praise">План поможет оставить штучки на нужное.</p>':met?'':`<div class="gr-differences">${differences.map(([label,a,b,verb])=>`<section class="gr-difference"><h3>${label}</h3><div class="gr-comparison"><div><span>План</span><b>${n(a)}</b></div><div><span>${verb}</span><b>${n(b)}</b></div></div></section>`).join('')}</div>`;
 const portrait=`<div class="gr-portrait">${met&&acted?'<img class="gr-cheer left" src="assets/finance-polish/confetti.png" alt="">':''}${puppet(s,s.stage,hasPlan&&!met?'sad':met&&acted?'happy':'neutral')}${met&&acted?'<img class="gr-cheer right" src="assets/finance-polish/confetti.png" alt="">':''}</div>`;
 const body=`<div class="growth-review gr-day ${met?'gr-met':'gr-missed'}" data-plan-success="${met&&acted}"><h3 class="gr-result-title">${heading}</h3>${portrait}${details}${progress(s,gained.length?'Пито ближе к росту':'Прогресс сохранился',gained,raw.growthAwards)}<p class="gr-lesson"><img src="assets/finance-polish/bulb.png" alt=""><span>${met?'План помогает оставить деньги на нужное и мечту.':'Сверяйся с планом перед покупкой, чтобы хватило на нужное.'}</span></p></div>`;
 return {title:`День ${raw.cycle} завершён`,body,footer:'<button class="btn primary wide" data-act="next-cycle">Новый день</button>',closable:false};
}
export function growthReviewView(s){
 const body=`<div class="growth-review gr-details"><div class="gr-stages">${['Малыш','С усиками','С ножками'].map((label,stage)=>`<div class="gr-stage ${s.stage===stage?'current':''}" ${s.stage===stage?'aria-current="step"':''}>${puppet(s,stage)}<strong>${label}</strong></div>`).join('')}</div>${progress(s,'До нового роста')}${counter(s)}${sources()}<p class="gr-lesson">${s.stage===2?'Ты помог Пито вырасти. Впереди новые мечты!':'Каждый день эти решения помогают Пито расти.'}</p></div>`;
 return {title:s.stage===2?'Пито вырос!':'Пито растёт',body,footer:'<button class="btn primary wide" data-act="close">К Пито</button>',closable:true};
}
