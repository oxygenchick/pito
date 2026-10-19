export function needsPortrait({touch,landscape,angle,editing}){
 if(!touch||!landscape)return false;
 if(Number.isFinite(angle))return Math.abs(angle)%180===90;
 return !editing;
}
export function installPortraitGuard(root,onChange){
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='styles/portrait-guard.css';document.head.append(sheet);
 const notice=document.createElement('section');notice.className='portrait-notice';notice.hidden=true;notice.setAttribute('role','status');
 notice.innerHTML='<span class="portrait-phone" aria-hidden="true">↻</span><h1>Поверни телефон<br>вертикально</h1><p>Пито подождёт. Игра на паузе.</p>';document.body.append(notice);
 const touch=matchMedia('(pointer: coarse)'),landscape=matchMedia('(orientation: landscape)');let blocked=false;
 function update(){
  const next=needsPortrait({touch:touch.matches,landscape:landscape.matches,angle:window.screen.orientation?.angle??window.orientation,editing:document.activeElement?.matches('input,textarea,[contenteditable="true"]')});
  if(next===blocked)return;
  blocked=next;notice.hidden=!next;root.inert=next;document.documentElement.classList.toggle('portrait-blocked',next);onChange(next);
 }
 touch.addEventListener('change',update);landscape.addEventListener('change',update);
 window.addEventListener('resize',update);window.addEventListener('orientationchange',update);window.screen.orientation?.addEventListener('change',update);
 document.addEventListener('focusout',()=>setTimeout(update,0));update();
}
