// ─── Main game loop & initialization ─────────────────────────────────
function gameLoop() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);
  updateStars();
  drawStars();

  switch (state) {
    case 'menu':
      drawMenu();
      break;

    case 'turnAnnounce':
      drawTurnAnnounce();
      turnAnnounceTimer--;
      if (enterPressed && turnAnnounceTimer < TURN_ANNOUNCE_DURATION-20) {
        enterPressed = false;
        startCurrentTurn();
      }
      break;

    case 'playing':
      if (mode === 'flo') {
        updateFlo();
        if (state === 'playing') drawFlo();
      } else if (mode === 'jan') {
        updateJan();
        if (state === 'playing') drawJan();
      } else if (mode === 'felix') {
        updateFelix();
        if (state === 'playing') drawFelix();
      } else {
        updateSamy();
        if (state === 'playing') drawSamy();
      }
      if (state === 'playing') {
        updateParticles();
        drawParticles();
        drawHUD();
      }
      break;
  }

  requestAnimationFrame(gameLoop);
}

// Boot
loadPlayers();
gameLoop();
nameInput.focus();
