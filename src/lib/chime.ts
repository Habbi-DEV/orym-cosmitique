/**
 * NOTIFICATION SONORE — nouvelle commande (admin)
 * ------------------------------------------------
 * Deux notes courtes générées via Web Audio API : aucun fichier audio à
 * charger/héberger. Échoue silencieusement si le navigateur bloque l'audio
 * (politique autoplay) — l'alerte visuelle reste dans tous les cas.
 */
let ctx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
};

const note = (audio: AudioContext, freq: number, start: number, duration: number) => {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(0.18, audio.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration);
};

export const playOrderChime = () => {
  try {
    const audio = getCtx();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume();
    note(audio, 880, 0, 0.16);
    note(audio, 1174.66, 0.14, 0.22);
  } catch {
    // silencieux — l'alerte visuelle suffit si l'audio échoue
  }
};
