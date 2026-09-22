/**
 * Som e vibração sintetizados — sem arquivo de áudio, sem dependência.
 * Tudo roda só depois de um gesto do usuário (o AudioContext é criado no
 * primeiro clique), respeita a preferência salva e falha em silêncio em
 * qualquer ambiente sem WebAudio.
 */

const PREF_KEY = "apolo:sound";

// Pentatônica maior de Dó: cada missão concluída toca a nota seguinte, então
// fechar todas as ações do dia forma uma pequena melodia ascendente.
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context ??= new Ctor();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
  } catch {
    /* sem storage disponível — preferência fica só nesta sessão */
  }
}

function tone(frequency: number, at: number, duration: number, gain: number, type: OscillatorType) {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, at);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(amp).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

/** "Pluck" suave — índice escolhe a nota da escala (0 = mais grave). */
export function playNote(index: number) {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const freq = SCALE[Math.max(0, Math.min(SCALE.length - 1, index))]!;
  const now = ctx.currentTime;
  tone(freq, now, 0.55, 0.16, "triangle");
  tone(freq * 2, now, 0.3, 0.035, "sine");
}

/** Acorde arpejado — fechar o dia / colheita. */
export function playChord() {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  [0, 2, 4, 5, 7].forEach((step, i) => {
    tone(SCALE[step]!, now + i * 0.09, 1.1, 0.13, "triangle");
    tone(SCALE[step]! * 2, now + i * 0.09, 0.6, 0.03, "sine");
  });
}

/** Virada de carta — dois blips curtos e claros. */
export function playFlip() {
  if (!soundEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(SCALE[7]!, now, 0.12, 0.08, "sine");
  tone(SCALE[9]!, now + 0.1, 0.22, 0.1, "sine");
}

/** Toque tátil curto — ignorado silenciosamente onde não existe `vibrate`. */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* alguns navegadores lançam quando o gesto não é reconhecido */
  }
}
