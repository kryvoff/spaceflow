// ─── HUD overlay drawn on top of each game mode ───────────────────────
function drawHUD() {
  const p = getCurrentPlayer();
  const modeLabel = mode==='flo' ? '👾 FLO' : mode==='jan' ? '⚽ JAN' : mode==='felix' ? '🏈 FELIX' : '🏃 SAMY';
  const modeColor = mode==='flo' ? '#00ddff' : mode==='jan' ? '#44cc44' : mode==='felix' ? '#44aaff' : '#ffaa00';

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "Courier New"';
  ctx.textAlign = 'left';
  ctx.fillText(p.name, 10, 18);

  ctx.fillStyle = modeColor;
  ctx.font = '11px "Courier New"';
  ctx.fillText(modeLabel, 10, 32);

  ctx.fillStyle = '#888';
  ctx.font = '10px "Courier New"';
  ctx.fillText(`ROUND ${globalRound}`, 10, 44);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "Courier New"';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${p.totalScore + Math.max(0, Math.floor(roundScore))}`, W-10, 18);

  if (mode === 'flo') {
    ctx.fillStyle = '#ff4444';
    ctx.font = '12px "Courier New"';
    let ls = '';
    for (let i = 0; i < lives; i++) ls += '♥ ';
    ctx.fillText(ls, W-10, 34);
    const maxTime = FLO_ROUND_DURATION + globalRound*30;
    const pct = roundTimer / maxTime;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(W/2-100, 8, 200, 6);
    ctx.fillStyle = modeColor;
    ctx.fillRect(W/2-100, 8, 200*pct, 6);
  } else if (mode === 'jan') {
    ctx.fillStyle = '#44ff44';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`SAVES: ${janSaves}`, W-10, 34);
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`GOALS: ${janGoalsConceded}/3`, W-10, 48);
    ctx.fillStyle = '#888';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(`SHOTS LEFT: ${janMaxShots - janShotsTotal + janBalls.filter(b=>b.active).length}`, W/2, 14);
  } else if (mode === 'felix') {
    ctx.fillStyle = '#44aaff';
    ctx.font = '12px "Courier New"';
    ctx.fillText(`TACKLES: ${felixTackles}`, W-10, 34);
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`MISSED: ${felixMissed}/${felixMaxMissed}`, W-10, 48);
  } else {
    ctx.fillStyle = '#888';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(`SPEED: ${samySpeed.toFixed(1)}`, W/2, 14);
  }
}
