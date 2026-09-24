import {groundBottom} from './meadow-ground.mjs';
import {ITEM_ART} from './item-catalog.mjs';
import {ownedPlaces} from './collection-layout.mjs';
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// SVG remains available for functional charts, not decorative illustrations.
export const svg=(body,cls='icon',view='0 0 64 64')=>`<svg class="${cls}" viewBox="${view}" aria-hidden="true">${body}</svg>`;
const newIcons=new Set(['coin','heart','drop','settings','task','ball','comic','puzzle','kite','console','bike','house','hand','arrow','lock','home','sun','check','close','star','cloud']);
const previousIcons=new Set(['apple','jar','care-basket','toy-box','drum','telescope']);
export function icon(id,cls='icon'){
 if(ITEM_ART[id])return `<img class="${cls}" src="assets/items-v14/${ITEM_ART[id]}.png" alt="" aria-hidden="true">`;
 if(['arrow','chevron','plus','minus'].includes(id))return `<img class="${cls}" src="assets/ui-v11/${id==='arrow'?'chevron':id}.png" alt="" aria-hidden="true">`;
 const key=id==='rain'?'cloud':id,version=newIcons.has(key)?'ui-v8':previousIcons.has(key)?'ui-v7':'ui-v8',name=newIcons.has(key)||previousIcons.has(key)?key:'task';
 return `<img class="${cls}" src="assets/${['hand','cloud','comic','arrow','bike'].includes(key)?'ui-v10':version}/${name}.png" alt="" aria-hidden="true">`;
}
export const art=(id,cls='art')=>icon(id,cls);
export const world=()=>'<div class="world" aria-hidden="true"></div>';
const part=(name,cls)=>`<img class="${cls}" src="assets/${name==='body'?'ui-v13':name==='eyes-happy'?'ui-v11':['body','hair-1','mouth-smile','mouth-grin'].includes(name)?'ui-v10':'pet-v8'}/${name}.png" alt="" aria-hidden="true" draggable="false">`;
const shape=(name,cls)=>{const url=`assets/${name==='body'?'ui-v13':'pet-v8'}/${name}.png`;return `<span class="${cls} sprite-shape" style="mask-image:url('${url}');-webkit-mask-image:url('${url}')" aria-hidden="true">${part(name,'shape-source')}</span>`;};
export function pet(profile,preview=false,emotion){
 const p=profile||{},stage=Number(p.stage)||0,h=Math.max(0,Math.min(2,Number(p.hair)||0)),color=Math.max(0,Math.min(2,Number(p.color)||0));
 const mood=emotion||((p.needs&&Math.min(...Object.values(p.needs))<25)?'sad':'neutral');
 const safeMood=['neutral','happy','sad','eating','washing','sleeping'].includes(mood)?mood:'neutral';
 return `<button class="pet pet-v8 ${stage===2?'grown':''} pet-color-${color}" data-pet data-emotion="${safeMood}" aria-label="Пито, нажать или погладить" ${preview?'tabindex="-1"':''}>
 ${stage===2?shape('legs','pet-legs'):''}
 <span class="pet-body">${stage>0?shape('feelers','pet-feelers'):''}${shape('body','pet-silhouette')}${part('hair-'+h,'pet-hair hair-'+h+' color-part')}
 <span class="pet-eyes">${['neutral','happy','sad','closed'].map(x=>part('eyes-'+x,'eye-layer eyes-'+x)).join('')}
 <span class="pet-pupils"><span class="pupil-left">${part('pupil','pupil')}</span><span class="pupil-right">${part('pupil','pupil')}</span></span></span>
 <span class="pet-mouth">${['smile','open','frown','grin','o'].map(x=>part('mouth-'+x,'mouth-layer mouth-'+x)).join('')}</span>
 </span></button>`;
}
export function poop(p){
 return `<button class="poop poop-v8" data-poop="${p.id}" style="left:${p.x}%;bottom:${groundBottom(p.x,4)-.56}%" aria-label="Убрать какашку, ещё ${6-p.taps} нажатий">${part('poop-sleep','poop-sprite poop-sleep')}${part('poop-awake','poop-sprite poop-awake')}${part('poop-run','poop-sprite poop-run')}<span class="poop-progress"><i style="width:${Math.max(p.taps/6,p.wet/1.8)*100}%"></i></span></button>`;
}
export function shelf(s,catalog,page=0){
 if((!s.owned.length&&!s.goalsWon.length)||(!s.shelfSeen&&s.pendingPurchase))return '';
 const places=ownedPlaces(s);
 return `<div class="world-collection" aria-label="Вещи Пито на лужайке">${places.map(([id,p])=>`<button class="location-item" data-act="play-item" data-id="${esc(id)}" data-support="${p.support}" style="--item-x:${p.x}%;--item-bottom:${p.bottom}%;--item-width:${p.width}cqw;--item-height:${p.height}cqw" aria-label="Играть: ${esc(catalog.find(x=>x.id===id)?.name||id)}">${art(id)}</button>`).join('')}</div>`;
}
