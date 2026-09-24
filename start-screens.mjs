import {pet, world, icon, shelf, poop} from './visuals.mjs';
import {ITEMS, GOALS} from './item-catalog.mjs';

const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pages = [
  'В путешествии по космосу ты встречаешь маленькое существо. Оно открывает глаза и улыбается.',
  'Тебе повезло встретить Пито. Кажется, ты ему понравился.',
  'Помоги ему освоиться. Покупайте нужное, выбирайте хотелки и копите на мечту.'
];
const colors = [
  {value:'#b76ace', name:'Сиреневый'},
  {value:'#e7a04b', name:'Оранжевый'},
  {value:'#62bba0', name:'Мятный'}
];
const hairs = [0,1,2];
const primary = (label, action) => `<button class="btn ss-primary" data-act="${action}">${label}</button>`;
const homeIcon = icon('home');

/** Pure renderer. All state stays in app.mjs; existing action names are retained. */
export function renderStart(screen, profile, {story=0, color=0, hair=0, petName='Пито', face=0}={}) {
  if (screen === 'start') {
    const currentFace=Math.abs(Number(face)||0)%3;
    const snapshot=profile?{owned:[],goalsWon:[],poops:[],...profile}:null;
    const scene=snapshot
      ? `<div class="ss-start-scene face${currentFace}" aria-hidden="true" inert>${shelf(snapshot,[...ITEMS,...GOALS])}${pet(snapshot)}${snapshot.poops.map(poop).join('')}</div>`
      : `<div class="start-face face${currentFace}" aria-hidden="true" inert>${pet({stage:0,color:0,hair:0},false,['neutral','happy','neutral'][currentFace])}</div>`;
    return world()+`<section class="ss-screen ss-start"><header><h1 class="logo"><img src="assets/ui-v8/logo.png" alt="Пито-Пито" fetchpriority="high"></h1><p class="ss-tagline">Твой финансовый дружище</p></header>${scene}<footer>${primary(profile?'Продолжить':'Новый Пито',profile?'continue':'new')}</footer></section>`;
  }
  if (screen === 'story') {
    const index = Math.max(0, Math.min(2, Number(story)||0));
    return `<section class="ss-screen ss-story"><div class="ss-story-paper"><p>${pages[index]}</p><div class="ss-dots" aria-label="Часть ${index+1} из 3">${pages.map((_,i)=>`<i class="${index===i?'active':''}" aria-hidden="true"></i>`).join('')}</div></div><div class="ss-pet-preview ss-story-pet" aria-hidden="true" inert>${pet({stage:0,color:0,hair:0},false,'neutral')}</div><footer>${primary(index===2?'Начать':'Дальше','story-next')}</footer></section>`;
  }
  if (screen === 'create') {
    const currentColor = Math.max(0, Math.min(2, Number(color)||0));
    const currentHair = Math.max(0, Math.min(2, Number(hair)||0));
    return `<section class="ss-screen ss-create"><nav><button class="ss-home" data-act="back-start" aria-label="На старт">${homeIcon}</button></nav><div class="ss-name"><label for="pet-name">Как тебя зовут?</label><input id="pet-name" aria-label="Имя Пито" value="${esc(petName)}" maxlength="24" autocomplete="off" enterkeyhint="done" spellcheck="false"></div><div class="ss-pet-preview" aria-hidden="true">${pet({stage:0,color:currentColor,hair:currentHair},true,'neutral')}</div><fieldset class="ss-choices"><legend>Выбери цвет</legend><div>${colors.map((c,i)=>`<button class="ss-color ${currentColor===i?'selected':''}" data-act="color" data-id="${i}" style="--choice-color:${c.value}" aria-label="${c.name}" aria-pressed="${currentColor===i}"><span aria-hidden="true">${currentColor===i?'✓':''}</span></button>`).join('')}</div></fieldset><fieldset class="ss-choices"><legend>Выбери причёску</legend><div>${hairs.map(i=>`<button class="ss-hair ${currentHair===i?'selected':''}" data-act="hair" data-id="${i}" aria-label="Причёска ${i+1}" aria-pressed="${currentHair===i}"><img src="assets/${i===1?'ui-v10':'pet-v8'}/hair-${i}.png" alt="" aria-hidden="true"></button>`).join('')}</div></fieldset><footer>${primary('Родиться','birth')}</footer></section>`;
  }
  return '';
}
