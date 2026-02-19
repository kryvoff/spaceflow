// ─── LocalStorage persistence ─────────────────────────────────────────
function savePlayers() {
  try {
    const data = players.map(p => ({ name: p.name, highScore: p.highScore || 0 }));
    localStorage.setItem('spaceflow_players', JSON.stringify(data));
  } catch(e) {}
}

function loadPlayers() {
  try {
    const raw = localStorage.getItem('spaceflow_players');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    players = data.slice(0, 8).map(d => ({
      name: String(d.name || '').slice(0, 12),
      totalScore: 0,
      highScore: Number(d.highScore) || 0
    })).filter(p => p.name);
    renderPlayerList();
    startBtn.disabled = players.length < 1;
  } catch(e) {}
}
