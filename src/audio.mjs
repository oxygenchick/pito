// Licensed local recordings (see assets/audio/SOURCES.md); UI feedback stays synthesized.
export const AUDIO_SETTING_KEY = 'pito.audio.enabled';
export const INTRO_MUSIC_SRC = 'assets/audio/shop-theme.ogg';
export const MUSIC_SRC = 'assets/audio/childrens-march-theme.ogg';
// Older iOS WebKit cannot decode Ogg, even in Chrome/Firefox on an iPhone.
export function compatibleAudioSource(source, Audio) {
  if (!source.endsWith('.ogg')) return source;
  try {
    if (Audio?.prototype?.canPlayType && !Audio.prototype.canPlayType.call(new Audio(), 'audio/ogg; codecs="vorbis"'))
      return source.replace(/\.ogg$/, '.mp3');
  } catch {}
  return source;
}
const MUSIC_VOLUME = .12;
const MUSIC_CROSSFADE_MS = 1200;
const CLIP_COUNTS = {cute:10,eat:4,bubble:4,cheer:1,poopWet:5,poopRun:5};
const CLIP_VOLUME = {cute:.38,eat:.50,bubble:.56,cheer:.52,poopWet:.42,poopRun:.5};
const SELECT = new Set(['color','hair','goal-choice','goal-step','plan-item-step','plan-goal-step','plan-category','plan-food','journal-tab','budget-tab','shelf-page']);
const STEP = new Set(['plan-step','plan-care-step','plan-allocation-step','plan-saving-step','transfer-step','transfer-preset','bank-step']);
const BUBBLE = new Set(['settings','help','growth','last-period','journal','expenses','goal','choose-goal','shop','bank']);
export function soundForAction(action) {
  if (['pet','play-item'].includes(action)) return 'pet';
  if (action === 'stroke') return 'stroke';
  if (action === 'mission-arrived') return 'mission';
  if (action === 'clean-poop') return 'clean';
  if (action === 'feed-confirm') return 'feed';
  if (action === 'rain') return 'rain';
  if (action === 'poop-wet') return 'poopWet';
  if (action === 'poop-run') return 'poopRun';
  if (action === 'intro-fanfare') return 'introFanfare';
  if (action === 'income-fanfare') return 'incomeFanfare';
  if (action === 'plan-confirm') return 'plan';
  if (['transfer','withdraw-confirm','bank-open'].includes(action)) return 'coins';
  if (action === 'buy-confirm') return 'purchase';
  if (action === 'claim-goal') return 'dream';
  if (action === 'growth-achieved') return 'growth';
  if (action === 'review-success') return 'success';
  if (action === 'review-missed') return 'missed';
  if (['reward','money-explained','birth','bank-collect'].includes(action)) return 'reward';
  if (BUBBLE.has(action)) return 'bubble';
  if (STEP.has(action)) return 'step';
  if (SELECT.has(action)) return 'select';
  return 'tap';
}
/** Audio never touches game state: unsupported sound must not prevent play. */
export function installAudio(root, options = {}) {
  const host=options.host??globalThis, doc=options.document??root.ownerDocument;
  let storage; try { storage=options.storage??host.localStorage; } catch {}
  let enabled=true;try{enabled=storage?.getItem(AUDIO_SETTING_KEY)!=='false';}catch{}
  let context,master,effects,timer,noiseBuffer,soundtrack,fadingMusic,musicFadeTimer;
  let musicScene='intro';
  let unlocked=false,disposed=false,pageActive=true,nativeActive=true;
  let step=0,lastEffect=-Infinity,lastKind='',rainWanted=false,strokeCount=0,lastCreature=-Infinity;
  const clipBags=Object.fromEntries(Object.keys(CLIP_COUNTS).map(key=>[key,[]]));
  const lastClip=Object.fromEntries(Object.keys(CLIP_COUNTS).map(key=>[key,0]));
  const activeClips=new Set();
  const decodedClips=new Map();
  let activeCheer;
  const Audio=options.Audio??host.Audio;
  const sourceFor=source=>compatibleAudioSource(source,Audio);
  function bufferFor(source){
    if(!decodedClips.has(source)){
      const request=host.fetch(source).then(response=>{
        if(!response.ok)throw new Error('Audio HTTP '+response.status);
        return response.arrayBuffer();
      }).then(data=>context.decodeAudioData(data)).catch(error=>{decodedClips.delete(source);throw error;});
      decodedClips.set(source,request);
    }
    return decodedClips.get(source);
  }
  const voices=new Set(),hz=midi=>440*2**((midi-69)/12);
  const audible=()=>enabled&&unlocked&&!disposed&&pageActive&&nativeActive&&!doc.hidden;
  function nextClip(kind){
    const bag=clipBags[kind],count=CLIP_COUNTS[kind];
    if(!bag.length){
      for(let i=1;i<=count;i++)bag.push(i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag[bag.length-1]===lastClip[kind]&&bag.length>1)[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
    }
    return lastClip[kind]=bag.pop();
  }
  function playClip(kind){
    if(!audible()||!Audio)return;
    try{
      const name=kind==='poopWet'||kind==='poopRun'?'grunt':kind;
      const source=sourceFor(`assets/audio/${name}_${String(nextClip(kind)).padStart(2,'0')}.${kind==='bubble'?'wav':'ogg'}`);
      // One unlocked AudioContext also works for delayed rewards and rain ticks;
      // new HTMLAudioElements can require a fresh user gesture on iOS.
      if(context?.decodeAudioData&&host.fetch){
        let voice,gain,cancelled=false;
        const clip={pause(){cancelled=true;try{voice?.stop();}catch{}activeClips.delete(clip);}};
        if(kind==='cheer'){activeCheer?.pause?.();activeClips.delete(activeCheer);activeCheer=clip;}
        activeClips.add(clip);
        void bufferFor(source).then(buffer=>{
          if(cancelled||!audible()||context.state!=='running'){activeClips.delete(clip);return;}
          voice=context.createBufferSource();gain=context.createGain();
          voice.buffer=buffer;gain.gain.value=CLIP_VOLUME[kind];
          voice.playbackRate.value=kind==='poopWet'?1.12:kind==='poopRun'?.88:1;
          voice.connect(gain);gain.connect(context.destination);
          voice.onended=()=>{activeClips.delete(clip);voice.disconnect();gain.disconnect();};
          voice.start();
        }).catch(()=>activeClips.delete(clip));
        return;
      }
      const clip=new Audio(source);clip.preload='auto';clip.volume=CLIP_VOLUME[kind];
      if(kind==='cheer'){
        // Fast successive achievements should not pile multiple choruses together.
        activeCheer?.pause?.();activeClips.delete(activeCheer);activeCheer=clip;
      }
      if(kind==='poopWet')clip.playbackRate=1.12;
      if(kind==='poopRun')clip.playbackRate=.88;
      activeClips.add(clip);clip.addEventListener?.('ended',()=>activeClips.delete(clip),{once:true});
      clip.play()?.catch?.(()=>activeClips.delete(clip));
    }catch{/* A missing recording must not interrupt play. */}
  }
  function playMusic(){
    if(!Audio)return;
    try{
      if(!soundtrack){soundtrack=new Audio(sourceFor(musicScene==='game'?MUSIC_SRC:INTRO_MUSIC_SRC));soundtrack.preload='auto';soundtrack.loop=true;soundtrack.volume=MUSIC_VOLUME;}
      if(soundtrack.paused!==false)return soundtrack.play();
    }catch{/* WebView or browser may lack a media decoder. */}
  }
  function clearMusicFade(){
    if(musicFadeTimer!==undefined)host.clearInterval(musicFadeTimer);
    musicFadeTimer=undefined;
    fadingMusic?.pause?.();fadingMusic=undefined;
    if(soundtrack)soundtrack.volume=MUSIC_VOLUME;
  }
  function setScene(scene){
    const next=scene==='game'?'game':'intro';
    if(next===musicScene)return;
    musicScene=next;
    if(!soundtrack)return;
    clearMusicFade();
    const source=sourceFor(next==='game'?MUSIC_SRC:INTRO_MUSIC_SRC);
    if(!audible()||soundtrack.paused!==false){
      soundtrack.pause();soundtrack.src=source;soundtrack.currentTime=0;soundtrack.load?.();
      if(audible())playMusic()?.catch?.(()=>{});
      return;
    }
    const outgoing=soundtrack;
    try{
      const incoming=new Audio(source);incoming.preload='auto';incoming.loop=true;incoming.volume=0;
      soundtrack=incoming;fadingMusic=outgoing;
      const started=(host.performance?.now?.()??Date.now());
      musicFadeTimer=host.setInterval(()=>{
        const elapsed=(host.performance?.now?.()??Date.now())-started;
        const progress=Math.min(1,Math.max(0,elapsed/MUSIC_CROSSFADE_MS));
        outgoing.volume=MUSIC_VOLUME*(1-progress);
        incoming.volume=MUSIC_VOLUME*progress;
        if(progress>=1)clearMusicFade();
      },40);
      incoming.play()?.catch?.(()=>{
        if(soundtrack!==incoming)return;
        if(musicFadeTimer!==undefined)host.clearInterval(musicFadeTimer);
        musicFadeTimer=undefined;fadingMusic=undefined;
        incoming.pause();soundtrack=outgoing;outgoing.volume=MUSIC_VOLUME;
        // Reuse the element already unlocked by the first tap on iOS.
        outgoing.src=source;outgoing.load?.();
        if(audible())outgoing.play()?.catch?.(()=>{});
      });
    }catch{
      if(musicFadeTimer!==undefined)host.clearInterval(musicFadeTimer);
      musicFadeTimer=undefined;fadingMusic=undefined;
      soundtrack=outgoing;outgoing.volume=MUSIC_VOLUME;
    }
  }
  function tryAutoplay(){
    if(!enabled||disposed||doc.hidden||!pageActive||!nativeActive)return;
    playMusic()?.then?.(()=>{unlocked=true;},()=>{});
  }
  function tone(midi,at,duration,volume,timbre='wood',bus=effects) {
    if(!context||!bus||voices.size>48)return;
    const parts=timbre==='wood'?[[1,1,'sine'],[2,.19,'sine'],[3,.055,'sine']]
      :timbre==='bell'?[[1,1,'sine'],[2.01,.26,'sine'],[3.92,.095,'sine']]
      :timbre==='bass'?[[1,1,'sine'],[2,.10,'triangle']]:[[1,1,'sine']];
    for(const [ratio,level,type] of parts){
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type=type;oscillator.frequency.setValueAtTime(hz(midi)*ratio,at);
      gain.gain.setValueAtTime(0,at);
      gain.gain.linearRampToValueAtTime(volume*level,at+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      oscillator.connect(gain);gain.connect(bus);voices.add(oscillator);
      oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(at+duration+.02);
    }
  }
  function getNoise(){
    if(noiseBuffer||!context?.createBuffer)return noiseBuffer;
    const rate=context.sampleRate||44100;noiseBuffer=context.createBuffer(1,rate,rate);
    const data=noiseBuffer.getChannelData(0);let seed=137;
    for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=seed/1073741823-1;}
    return noiseBuffer;
  }
  function noise(at,duration,volume,frequency=3000,bus=effects){
    if(!context?.createBufferSource||!context?.createBiquadFilter||!getNoise()||!bus)return;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.setValueAtTime(frequency,at);
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
    source.connect(filter);filter.connect(gain);gain.connect(bus);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(at);source.stop(at+duration+.02);
  }
  function glide(midi,at,duration,volume,ending=1.2,bus=effects){
    if(!context||!bus||voices.size>46)return;
    for(const [ratio,level] of [[1,1],[2,.16]]){
      const oscillator=context.createOscillator(),gain=context.createGain(),base=hz(midi)*ratio;
      oscillator.type='sine';
      oscillator.frequency.setValueAtTime(base*.84,at);
      oscillator.frequency.exponentialRampToValueAtTime(base*ending,at+duration*.55);
      oscillator.frequency.exponentialRampToValueAtTime(base*.96,at+duration);
      gain.gain.setValueAtTime(0,at);
      gain.gain.linearRampToValueAtTime(volume*level,at+.018);
      gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
      oscillator.connect(gain);gain.connect(bus);voices.add(oscillator);
      oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(at);oscillator.stop(at+duration+.02);
    }
  }
  function plop(at,index=0,volume=.052){
    if(!context||!effects||voices.size>46)return;
    const oscillator=context.createOscillator(),gain=context.createGain(),pitch=[420,500,465,555,440][index%5];
    oscillator.type='sine';
    oscillator.frequency.setValueAtTime(pitch*1.48,at);
    oscillator.frequency.exponentialRampToValueAtTime(pitch*.72,at+.095);
    gain.gain.setValueAtTime(0,at);
    gain.gain.linearRampToValueAtTime(volume,at+.006);
    gain.gain.exponentialRampToValueAtTime(.0001,at+.115);
    oscillator.connect(gain);gain.connect(effects);voices.add(oscillator);
    oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
    oscillator.start(at);oscillator.stop(at+.13);
  }
  function setRain(value){
    rainWanted=Boolean(value);
    if(rainWanted&&audible()&&context?.state==='running'){
      plop(context.currentTime+.015,step,.064);
      glide(79,context.currentTime+.08,.23,.045,1.12);
      playClip('cute');
      if(timer===undefined)timer=host.setInterval(schedule,280);
    }else if(!rainWanted&&timer!==undefined){host.clearInterval(timer);timer=undefined;
    }
  }
  function schedule(){
    if(!rainWanted||!audible()||context?.state!=='running')return;
    const at=context.currentTime+.015;
    plop(at,step,.032+(step%4)*.003);
    if(step%10===0){glide(76,at+.05,.23,.054,1.17);playClip('cute');}
    step++;
  }
  function stop(){
    if(timer!==undefined)host.clearInterval(timer);timer=undefined;
    clearMusicFade();
    soundtrack?.pause?.();if(soundtrack)soundtrack.volume=MUSIC_VOLUME;
    for(const clip of activeClips)clip.pause?.();activeClips.clear();
    if(context&&master){
      setRain(false);master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0,context.currentTime);
      for(const voice of voices){try{voice.stop();}catch{}}
      voices.clear();context.suspend()?.catch?.(()=>{});
    }
  }
  async function start(){
    if(!audible())return;
    playMusic()?.catch?.(()=>{});
    // A denied pointerdown resume can stay pending until a valid touchend/click.
    // Never await that promise before retrying resume inside the new gesture.
    if(context?.state==='running'){if(rainWanted&&timer===undefined)timer=host.setInterval(schedule,280);return;}
    try{
      if(!context){
        const AudioContext=options.AudioContext??host.AudioContext??host.webkitAudioContext;
        if(!AudioContext)return;
        context=new AudioContext();master=context.createGain();effects=context.createGain();
        master.gain.value=0;effects.gain.value=1;
        effects.connect(master);master.connect(context.destination);
      }
      await context.resume();
      if(!audible()){stop();return;}
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(master.gain.value,context.currentTime);
      master.gain.linearRampToValueAtTime(.62,context.currentTime+.28);
      if(rainWanted)setRain(true);
    }catch{/* Audio must never prevent gameplay. */}
  }
  function unlock(){unlocked=true;return start();}
  function onAction(action){
    if(!audible())return;
    if(context?.state!=='running'){void start().then(()=>{if(audible()&&context?.state==='running')onAction(action);});return;}
    const at=context.currentTime+.008,kind=soundForAction(action);
    if(at-lastEffect<(kind===lastKind ? .085 : .045))return;
    lastEffect=at;lastKind=kind;
    const hit=(midi,offset=0,duration=.17,volume=.10,timbre='wood')=>tone(midi,at+offset,duration,volume,timbre,effects);
    const click=(offset=0,bright=false)=>{
      noise(at+offset,.045,bright?.045:.038,bright?2600:1400,effects);
      hit(bright?72:67,offset,.06,bright?.058:.054,'bass');
    };
    switch(kind){
      case 'select':click(0,true);break;
      case 'step':click();click(.075,true);break;
      case 'bubble':click(0,true);playClip('bubble');break;
      case 'poopWet':playClip('poopWet');break;
      case 'poopRun':playClip('poopRun');break;
      case 'introFanfare':
        [72,76,79,84,88].forEach((pitch,i)=>hit(pitch,i*.11,.42,.11,'bell'));
        playClip('cheer');break;
      case 'incomeFanfare':
        [76,79,83,88].forEach((pitch,i)=>hit(pitch,i*.12,.42,.1,'bell'));
        playClip('cheer');break;
      case 'pet':
        if(at-lastCreature>.42){playClip('cute');lastCreature=at;}
        break;
      case 'stroke':
        noise(at,.14,.045,2200,effects);
        plop(at+.03,strokeCount++,.058);
        playClip('cute');
        break;
      case 'clean':hit(74,0,.11,.085);hit(81,.07,.20,.072,'bell');break;
      case 'feed':
        playClip('eat');
        noise(at,.075,.032,1150,effects);
        glide(76,at+.6,.25,.04,1.14);
        break;
      case 'rain':plop(at,step,.072);glide(79,at+.06,.19,.059,1.15);break;
      case 'mission':plop(at,1,.055);hit(72,.055,.17,.08);hit(79,.18,.23,.075,'bell');break;
      case 'coins':for(let i=0;i<3;i++)hit([79,83,86][i],i*.085,.34,.105,'bell');break;
      case 'purchase':hit(72,0,.18,.105);hit(79,.10,.24,.10,'bell');hit(84,.19,.33,.09,'bell');playClip('cheer');break;
      case 'plan':for(let i=0;i<3;i++)hit([72,76,79][i],i*.115,.32,.105);playClip('cheer');break;
      case 'missed':hit(69,0,.23,.07);hit(67,.15,.25,.06);break;
      case 'reward':case 'success':case 'growth':case 'dream':{
        const pitches=kind==='dream'?[72,76,79,84,88]:kind==='growth'?[67,72,76,79,84]:[72,76,79,84];
        pitches.forEach((pitch,i)=>hit(pitch,i*.13,.48,.105,kind==='growth'?'wood':'bell'));
        playClip('cheer');
        break;
      }
      default:click();break;
    }
  }
  function clicked(event){
    const button=event.target?.closest?.('[data-act]');
    if(!button||button.disabled||button.getAttribute('aria-disabled')==='true'||button.dataset.act==='audio-toggle')return;
    const action=button.dataset.act;
    // Commit effects play only after success in app.mjs.
    if(['birth','money-explained','feed-confirm','plan-confirm','transfer','withdraw-confirm','bank-open','bank-collect','buy-confirm','claim-goal'].includes(action))return;
    if(context?.state==='running')onAction(action);
    else void unlock().then(()=>onAction(action));
  }
  function visibility(){if(doc.hidden)stop();else void start();}
  function pageHide(){pageActive=false;stop();}
  function pageShow(){pageActive=true;visibility();}
  function nativePause(){nativeActive=false;stop();}
  function nativeResume(){nativeActive=true;visibility();}
  function setEnabled(value){
    enabled=Boolean(value);try{storage?.setItem(AUDIO_SETTING_KEY,String(enabled));}catch{}
    if(enabled){unlocked=true;void start();}else stop();
    options.onChange?.(enabled);return enabled;
  }
  root.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  root.addEventListener('touchend',unlock,{capture:true,passive:true});
  root.addEventListener('click',unlock,true);
  root.addEventListener('keydown',unlock,true);root.addEventListener('click',clicked,true);
  doc.addEventListener('visibilitychange',visibility);
  host.addEventListener('pagehide',pageHide);host.addEventListener('pageshow',pageShow);
  host.addEventListener('pito-native-pause',nativePause);host.addEventListener('pito-native-resume',nativeResume);
  return{getEnabled:()=>enabled,setEnabled,toggle:()=>setEnabled(!enabled),onAction,setRain,setScene,tryAutoplay,
    dispose(){
      if(disposed)return;disposed=true;stop();
      root.removeEventListener('pointerdown',unlock,true);root.removeEventListener('keydown',unlock,true);
      root.removeEventListener('touchend',unlock,true);root.removeEventListener('click',unlock,true);
      root.removeEventListener('click',clicked,true);doc.removeEventListener('visibilitychange',visibility);
      host.removeEventListener('pagehide',pageHide);host.removeEventListener('pageshow',pageShow);
      host.removeEventListener('pito-native-pause',nativePause);host.removeEventListener('pito-native-resume',nativeResume);
      context?.close()?.catch?.(()=>{});
    }
  };
}
