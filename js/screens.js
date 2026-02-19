// ─── Menu & turn-announce screens ────────────────────────────────────
function drawMenu() {
  ctx.fillStyle = '#00ddff';
  ctx.font = 'bold 44px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText('SPACEFLOW', W/2, H/2-80);

  ctx.fillStyle = '#888';
  ctx.font = '13px "Courier New"';
  ctx.fillText('Four games. One challenge.', W/2, H/2-45);

  ctx.font = '12px "Courier New"';
  ctx.fillStyle = '#00ddff';
  ctx.fillText('👾 FLO — Defend the bunnies from aliens', W/2, H/2-15);
  ctx.fillStyle = '#ffaa00';
  ctx.fillText('🏃 SAMY — Jump & survive!', W/2, H/2+5);
  ctx.fillStyle = '#44cc44';
  ctx.fillText('⚽ JAN — Block the shots!', W/2, H/2+25);
  ctx.fillStyle = '#44aaff';
  ctx.fillText('🏈 FELIX — Tackle the runners!', W/2, H/2+45);

  ctx.fillStyle = '#666';
  ctx.font = '14px "Courier New"';
  ctx.fillText('← Add players in the sidebar', W/2, H/2+70);
  ctx.fillText('then press START', W/2, H/2+88);

  ctx.fillStyle = '#444';
  ctx.font = '10px "Courier New"';
  ctx.fillText('Players take turns. Rounds get harder.', W/2, H/2+115);
  ctx.fillText('ENTER = start next round', W/2, H/2+130);
}

function drawTurnAnnounce() {
  const p = getCurrentPlayer();
  const modeColor = mode==='flo' ? '#00ddff' : mode==='jan' ? '#44cc44' : mode==='felix' ? '#44aaff' : '#ffaa00';
  const modeEmoji = mode==='flo' ? '👾' : mode==='jan' ? '⚽' : mode==='felix' ? '🏈' : '🏃';
  const modeName  = mode==='flo' ? 'FLO' : mode==='jan' ? 'JAN' : mode==='felix' ? 'FELIX' : 'SAMY';

  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px "Courier New"';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT UP', W/2, H/2-65);

  ctx.fillStyle = modeColor;
  ctx.font = 'bold 36px "Courier New"';
  ctx.fillText(p.name, W/2, H/2-15);

  ctx.fillStyle = modeColor;
  ctx.font = '20px "Courier New"';
  ctx.fillText(`${modeEmoji} ${modeName} MODE`, W/2, H/2+25);

  ctx.fillStyle = '#888';
  ctx.font = '12px "Courier New"';
  ctx.fillText(`Round ${globalRound}`, W/2, H/2+55);

  if (mode === 'flo') {
    ctx.fillStyle = '#ffaadd';
    ctx.font = '11px "Courier New"';
    ctx.fillText('Defend the bunnies! 🐰', W/2, H/2+75);
  } else if (mode === 'jan') {
    ctx.fillStyle = '#44cc44';
    ctx.font = '11px "Courier New"';
    ctx.fillText('Up/Down to move, Space to dive! 3 goals = done!', W/2, H/2+75);
  } else if (mode === 'felix') {
    ctx.fillStyle = '#44aaff';
    ctx.font = '11px "Courier New"';
    ctx.fillText('Space=tackle, Down=duck, Up/Down=move!', W/2, H/2+75);
  } else {
    ctx.fillStyle = '#ffaa00';
    ctx.font = '11px "Courier New"';
    ctx.fillText('One hit = done! Jump to survive!', W/2, H/2+75);
  }

  const blink = Math.sin(performance.now()*0.005) > 0;
  if (blink && turnAnnounceTimer < TURN_ANNOUNCE_DURATION-30) {
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 14px "Courier New"';
    ctx.fillText('PRESS ENTER TO PLAY', W/2, H/2+110);
  }
}
