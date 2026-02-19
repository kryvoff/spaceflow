// ─── Keyboard input ───────────────────────────────────────────────────
const keys = {};
let enterPressed = false;

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Enter') { enterPressed = true; e.preventDefault(); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
