// ─── Audio System — Tron / Electronic ────────────────────────────────
let audioCtx = null, musicGain = null, sfxGain = null;
let musicInterval = null, musicStep = 0, musicPlaying = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.13;
  musicGain.connect(audioCtx.destination);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.28;
  sfxGain.connect(audioCtx.destination);
}

// ─── Core synth helpers ──────────────────────────────────────────────

// Simple envelope oscillator
function playTone(freq, dur, type, gv, dest) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gv || 0.15, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t); o.stop(t + dur);
}

// Frequency sweep (Tron light-cycle engine effect)
function playSweep(f0, f1, dur, type, gv, dest) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(gv, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t); o.stop(t + dur);
}

// FM synthesis: modulator → carrier frequency (metallic / digital textures)
function playFM(carrier, modRatio, modDepth, dur, gv, dest) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  dest = dest || sfxGain;
  const c = audioCtx.createOscillator(), m = audioCtx.createOscillator();
  const mg = audioCtx.createGain(), eg = audioCtx.createGain();
  c.type = 'sine';   c.frequency.setValueAtTime(carrier, t);
  m.type = 'sine';   m.frequency.setValueAtTime(carrier * modRatio, t);
  mg.gain.setValueAtTime(modDepth, t);
  mg.gain.exponentialRampToValueAtTime(1, t + dur);
  eg.gain.setValueAtTime(gv, t);
  eg.gain.exponentialRampToValueAtTime(0.001, t + dur);
  m.connect(mg); mg.connect(c.frequency);
  c.connect(eg); eg.connect(dest);
  m.start(t); m.stop(t + dur);
  c.start(t); c.stop(t + dur);
}

// ─── Sound effects — Tron / electronic style ─────────────────────────

function sfxJump() {
  // Light-cycle launch: rising square sweep + FM shimmer
  playSweep(200, 880, 0.18, 'square', 0.17);
  playFM(440, 2, 300, 0.12, 0.06);
}

function sfxDeath() {
  // System crash: descending saw + sub-thud + FM crunch
  playSweep(660, 40, 0.7, 'sawtooth', 0.20);
  playTone(55, 0.35, 'square', 0.13);
  playFM(220, 4, 500, 0.08, 0.07);
}

function sfxShoot() {
  // Laser pulse: descending FM blip + short sweep
  playFM(1400, 2.5, 700, 0.10, 0.13);
  playSweep(900, 300, 0.09, 'square', 0.06);
}

function sfxKill() {
  // Digital explosion
  playTone(55, 0.35, 'sawtooth', 0.14);
  playFM(180, 0.5, 100, 0.25, 0.14);
  playSweep(2400, 100, 0.15, 'square', 0.04);
}

function sfxBunnyHit() {
  playSweep(700, 300, 0.13, 'sine', 0.10);
  playTone(1400, 0.04, 'square', 0.04);
}

function sfxScore() {
  // Digital ping with single echo
  playTone(1320, 0.07, 'square', 0.07);
  setTimeout(() => playTone(1320, 0.06, 'square', 0.04), 110);
}

function sfxSave() {
  // Rising triad stab
  playTone(523, 0.14, 'square', 0.09);
  setTimeout(() => playTone(659, 0.14, 'square', 0.09), 70);
  setTimeout(() => { playTone(784, 0.20, 'square', 0.10); playFM(784, 2, 300, 0.18, 0.05); }, 140);
}

function sfxGoal() {
  // Low digital alarm with echo
  playTone(175, 0.45, 'sawtooth', 0.15); playTone(87, 0.50, 'square', 0.09);
  setTimeout(() => { playTone(175, 0.35, 'sawtooth', 0.10); }, 280);
}

function sfxKick() {
  playSweep(300, 80, 0.07, 'square', 0.17);
  playFM(80, 0.5, 50, 0.06, 0.13);
}

function sfxTackle() {
  // Heavy sub thud + electronic crunch
  playTone(45, 0.20, 'sawtooth', 0.15);
  playFM(120, 0.75, 90, 0.15, 0.13);
  playSweep(400, 80, 0.12, 'square', 0.07);
}

function sfxDodge() {
  playSweep(300, 1100, 0.13, 'square', 0.09);
}

function sfxWhistle() {
  // Electronic siren
  playSweep(1200, 1700, 0.25, 'sine', 0.12);
  setTimeout(() => playSweep(1700, 1200, 0.20, 'sine', 0.09), 210);
}

function sfxRoundEnd() {
  // Power-up chord stab
  playTone(523, 0.15, 'square', 0.08);
  setTimeout(() => playTone(659, 0.15, 'square', 0.08), 110);
  setTimeout(() => { playTone(784, 0.22, 'square', 0.09); playFM(784, 2, 400, 0.22, 0.06); }, 220);
  setTimeout(() => playSweep(1047, 1568, 0.30, 'square', 0.07), 370);
}

// ─── Music — A-minor pentatonic, Tron / Daft Punk feel ───────────────
// A-min pent: A=110/220/440, C=130/261/523, D=147/294, E=165/330/659, G=196/392
const samyMelody  = [440,523,659,523,440,392,440,523, 659,784,659,523,440,330,440,523];
const floMelody   = [220,294,330,440,330,294,220,196, 220,261,294,440,330,261,220,165];
const janMelody   = [220,261,294,330,294,261,220,165, 220,294,330,392,294,220,165,220];
const felixMelody = [110,165,220,165,110, 82,110,165, 220,165,110, 82,110,165,220,110];
const baseLine    = [110,110,110,165, 110,110, 82, 82];

function startMusic(mt) {
  stopMusic();
  if (!audioCtx) return;
  musicStep = 0;
  const mel = mt==='flo' ? floMelody : mt==='jan' ? janMelody : mt==='felix' ? felixMelody : samyMelody;
  const bpm = mt==='flo' ? 160 : mt==='jan' ? 118 : mt==='felix' ? 140 : 200;
  const iv  = 60000 / bpm;
  musicInterval = setInterval(() => {
    if (!audioCtx) return;
    const step = musicStep;
    const noteDur = iv / 1000 * 0.72;
    // Melody — sawtooth for that Daft Punk grind
    playTone(mel[step % mel.length], noteDur, 'sawtooth', 0.055, musicGain);
    // Bass pulse — square, driving low end
    playTone(baseLine[step % baseLine.length], noteDur * 1.1, 'square', 0.085, musicGain);
    // Kick on beats 1 & 3
    if (step % 2 === 0) playTone(60, 0.06, 'square', 0.09, musicGain);
    // Off-beat hi-hat
    if (step % 2 === 1) playTone(7000, 0.03, 'square', 0.022, musicGain);
    // Every 8 steps: octave-up fill
    if (step % 8 === 7) {
      const fill = mel[(step + 1) % mel.length] * 2;
      setTimeout(() => playTone(fill, 0.05, 'square', 0.035, musicGain), iv * 0.5);
    }
    musicStep++;
  }, iv);
  musicPlaying = true;
}

function stopMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  musicPlaying = false;
}
