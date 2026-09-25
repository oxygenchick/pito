// Original, sparse pentatonic lullaby. No downloads or third-party recordings.
export const AUDIO_SETTING_KEY = 'pito.audio.enabled';
const MELODY = [72,null,76,null,79,null,76,74,72,null,null,69,67,null,null,null,
  69,null,72,null,74,null,76,null,79,null,76,74,72,null,null,null];
const CHORDS = [[48,55,60],[45,52,57],[53,60,65],[48,55,60]];
export function soundForAction(action) {
  if (['pet','play-item'].includes(action)) return 'pet';
  if (action === 'feed-confirm') return 'feed';
  if (action === 'rain') return 'rain';
  if (['reward','money-explained','bank-collect','claim-goal','birth'].includes(action)) return 'reward';
  return 'tap';
}

/** A single disposable sound service, independent of game progress and saves. */
export function installAudio(root, options = {}) {
  const host = options.host ?? globalThis;
  const doc = options.document ?? root.ownerDocument;
  let storage;
  try { storage = options.storage ?? host.localStorage; } catch {}
  let enabled = true;
  try { enabled = storage?.getItem(AUDIO_SETTING_KEY) !== 'false'; } catch {}
  let context, master, timer, resumeTask, unlocked = false, disposed = false, pending = false, pageActive = true, nativeActive = true;
  let step = 0, nextNote = 0, lastEffect = -Infinity;
  const voices = new Set();
  const hz = midi => 440 * 2 ** ((midi - 69) / 12);
  const audible = () => enabled && unlocked && !disposed && pageActive && nativeActive && !doc.hidden;
  function note(midi, at, duration, volume, type = 'sine') {
    if (!context || !master || voices.size > 32) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(hz(midi), at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(volume, at + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain); gain.connect(master);
    voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + .025);
  }
  function schedule() {
    if (!audible() || context?.state !== 'running') return;
    // Never replay a backlog after timer throttling or application suspension.
    if (nextNote < context.currentTime) nextNote = context.currentTime + .04;
    while (nextNote < context.currentTime + .35) {
      const index = step % MELODY.length;
      if (MELODY[index] !== null) note(MELODY[index], nextNote, 1.1, .10, 'triangle');
      if (index % 8 === 0) CHORDS[index / 8].forEach((pitch, i) => note(pitch, nextNote + i * .07, 3.8, .037));
      nextNote += .72; step++;
    }
  }
  function stop() {
    if (timer !== undefined) host.clearInterval(timer);
    timer = undefined;
    if (context && master) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0, context.currentTime);
      for (const voice of voices) { try { voice.stop(); } catch {} }
      voices.clear();
      context.suspend()?.catch?.(() => {});
    }
  }
  async function start() {
    if (!audible()) return;
    if (pending) { try { await resumeTask; } catch {} return; }
    pending = true;
    try {
      if (!context) {
        const AudioContext = options.AudioContext ?? host.AudioContext ?? host.webkitAudioContext;
        if (!AudioContext) return;
        context = new AudioContext();
        master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
      }
      resumeTask = context.resume();
      await resumeTask;
      if (!audible()) { stop(); return; }
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(master.gain.value, context.currentTime);
      master.gain.linearRampToValueAtTime(.24, context.currentTime + .25);
      if (timer === undefined) {
        nextNote = context.currentTime + .15;
        schedule(); timer = host.setInterval(schedule, 150);
      }
    } catch { /* Unsupported or blocked audio must never prevent play. */ }
    finally { pending = false; }
  }
  function unlock() { unlocked = true; return start(); }
  function onAction(action) {
    if (!audible() || context?.state !== 'running') return;
    const at = context.currentTime + .005;
    if (at - lastEffect < .065) return;
    lastEffect = at;
    const kind = soundForAction(action);
    const notes = { tap:[79], pet:[76,79], feed:[72,76], rain:[81,76,72], reward:[72,76,79,84] }[kind];
    notes.forEach((pitch, i) => note(pitch, at + i * .09, kind === 'tap' ? .12 : .34, kind === 'tap' ? .21 : .18, 'sine'));
  }
  function clicked(event) {
    const button = event.target?.closest?.('[data-act]');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.dataset.act === 'audio-toggle') return;
    const action = button.dataset.act;
    if (context?.state === 'running') onAction(action);
    else void unlock().then(() => onAction(action));
  }
  function visibility() { if (doc.hidden) stop(); else void start(); }
  function pageHide() { pageActive = false; stop(); }
  function pageShow() { pageActive = true; visibility(); }
  function nativePause() { nativeActive = false; stop(); }
  function nativeResume() { nativeActive = true; visibility(); }
  function setEnabled(value) {
    enabled = Boolean(value);
    try { storage?.setItem(AUDIO_SETTING_KEY, String(enabled)); } catch {}
    if (enabled) { unlocked = true; void start(); } else stop();
    options.onChange?.(enabled);
    return enabled;
  }
  root.addEventListener('pointerdown', unlock, { capture:true, passive:true });
  root.addEventListener('keydown', unlock, true);
  root.addEventListener('click', clicked, true);
  doc.addEventListener('visibilitychange', visibility);
  host.addEventListener('pagehide', pageHide);
  host.addEventListener('pageshow', pageShow);
  host.addEventListener('pito-native-pause', nativePause);
  host.addEventListener('pito-native-resume', nativeResume);
  return {
    getEnabled: () => enabled,
    setEnabled,
    toggle: () => setEnabled(!enabled),
    onAction,
    dispose() {
      if (disposed) return;
      disposed = true; stop();
      root.removeEventListener('pointerdown', unlock, true);
      root.removeEventListener('keydown', unlock, true);
      root.removeEventListener('click', clicked, true);
      doc.removeEventListener('visibilitychange', visibility);
      host.removeEventListener('pagehide', pageHide);
      host.removeEventListener('pageshow', pageShow);
      host.removeEventListener('pito-native-pause', nativePause);
      host.removeEventListener('pito-native-resume', nativeResume);
      context?.close()?.catch?.(() => {});
    }
  };
}
