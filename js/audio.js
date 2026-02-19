// ─── Audio System ─────────────────────────────────────────────────────
let audioCtx = null, musicGain = null, sfxGain = null;
let musicInterval = null, musicStep = 0, musicPlaying = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.gain.value = 0.12;
  musicGain.connect(audioCtx.destination);
  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 0.25;
  sfxGain.connect(audioCtx.destination);
}

function playTone(freq, dur, type, gv, dest) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(gv || 0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

// ─── Sound effects ───────────────────────────────────────────────────
function sfxShoot()    { playTone(880,0.08,'square',0.12); playTone(1200,0.06,'square',0.08); }
function sfxKill()     { playTone(200,0.15,'sawtooth',0.12); playTone(150,0.2,'square',0.08); }
function sfxBunnyHit() { playTone(600,0.1,'sine',0.1); playTone(400,0.15,'sine',0.08); }
function sfxScore()    { playTone(1047,0.05,'sine',0.06); }
function sfxSave()     { playTone(523,0.1,'sine',0.12); playTone(784,0.12,'sine',0.1); setTimeout(()=>playTone(1047,0.15,'sine',0.08),80); }
function sfxGoal()     { playTone(200,0.3,'sawtooth',0.15); playTone(100,0.4,'sawtooth',0.1); }
function sfxKick()     { playTone(150,0.06,'square',0.15); playTone(300,0.04,'square',0.08); }
function sfxTackle()   { playTone(120,0.12,'sawtooth',0.15); playTone(80,0.15,'square',0.1); }
function sfxDodge()    { playTone(500,0.08,'sine',0.1); playTone(700,0.06,'sine',0.08); }
function sfxWhistle()  { playTone(1200,0.3,'sine',0.12); setTimeout(()=>playTone(1400,0.15,'sine',0.1),200); }

function sfxJump() {
  if (!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='sine'; o.frequency.setValueAtTime(300,audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(600,audioCtx.currentTime+0.12);
  g.gain.setValueAtTime(0.15,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.15);
  o.connect(g); g.connect(sfxGain); o.start(); o.stop(audioCtx.currentTime+0.15);
}

function sfxDeath() {
  if (!audioCtx) return;
  const o=audioCtx.createOscillator(), g=audioCtx.createGain();
  o.type='sawtooth'; o.frequency.setValueAtTime(400,audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(60,audioCtx.currentTime+0.6);
  g.gain.setValueAtTime(0.2,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.6);
  o.connect(g); g.connect(sfxGain); o.start(); o.stop(audioCtx.currentTime+0.6);
}

function sfxRoundEnd() {
  playTone(523,0.15,'square',0.1);
  setTimeout(()=>playTone(659,0.15,'square',0.1),120);
  setTimeout(()=>playTone(784,0.25,'square',0.12),240);
}

// ─── Music ───────────────────────────────────────────────────────────
const floMelody   = [261,330,392,523,392,330,261,196,261,330,392,523,659,523,392,330];
const samyMelody  = [330,392,440,523,440,392,330,294,330,392,440,523,587,523,440,392];
const janMelody   = [392,392,523,523,440,440,349,349,330,330,294,294,330,392,440,523];
const felixMelody = [196,247,294,330,294,247,196,165,196,247,330,392,330,294,247,196];
const baseLine    = [130,130,165,165,196,196,165,165];

function startMusic(mt) {
  stopMusic();
  if (!audioCtx) return;
  musicStep = 0;
  const mel = mt==='flo' ? floMelody : mt==='jan' ? janMelody : mt==='felix' ? felixMelody : samyMelody;
  const bpm = mt==='flo' ? 180 : mt==='jan' ? 160 : mt==='felix' ? 150 : 220;
  const iv  = 60000 / bpm;
  musicInterval = setInterval(() => {
    if (!audioCtx) return;
    playTone(mel[musicStep%mel.length],    iv/1000*0.8, 'square',   0.06, musicGain);
    playTone(baseLine[musicStep%baseLine.length], iv/1000*0.9, 'triangle', 0.08, musicGain);
    if (musicStep%2===0) playTone(80, 0.05, 'square', 0.1, musicGain);
    if (musicStep%4===2) playTone(4000+Math.random()*2000, 0.03, 'sawtooth', 0.04, musicGain);
    musicStep++;
  }, iv);
  musicPlaying = true;
}

function stopMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  musicPlaying = false;
}
