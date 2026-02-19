# ⚡ SpaceFlow

A browser-based **turn-based multiplayer party game** — four mini-games, one shared scoreboard. Add up to 8 players and take turns battling through every round. Scores accumulate; high scores persist across sessions.

## Play

**[▶ Play now on GitHub Pages](https://cdeil.github.io/spaceflow/)**

Or run locally:

```bash
python3 -m http.server 8742
# open http://localhost:8742
```

## Games

| Mode | Player | Controls | Goal |
|------|--------|----------|------|
| 👾 **Flo** | Flo | ← → to move, Space to shoot | Shoot aliens, protect bunnies |
| 🏃 **Samy** | Samy | Space to jump | Survive the endless obstacle course |
| ⚽ **Jan** | Jan | ↑ ↓ to move, Space to dive | Goalkeep — allow max 3 goals |
| 🏈 **Felix** | Felix | ↑ ↓ to move, Space to tackle, ↓ to duck | Tackle incoming rugby runners |

Modes rotate in order: **Samy → Flo → Jan → Felix → …**  
Each round is harder than the last.

## Multiplayer

1. Add 1–8 player names in the sidebar.
2. Click **▶ START GAME**.
3. Players take turns one at a time; press **Enter** when ready.
4. Scores accumulate per game session; all-time high scores are saved automatically in the browser (`localStorage`).
5. Click **↺ New Game** to reset session scores, or **✕ Reset All Players & Scores** to clear everything.

## Tests

Open [tests.html](tests.html) in the browser (while the server is running) to run the test suite.

```bash
open http://localhost:8742/tests.html
```

## Project Structure

```
spaceflow/
├── index.html          # HTML shell + script load order
├── style.css           # All CSS
├── tests.html          # In-browser test suite
└── js/
    ├── canvas.js       # Canvas setup (W, H, rectsOverlap)
    ├── input.js        # Keyboard state (keys{}, enterPressed)
    ├── audio.js        # Web Audio synthesis — music & SFX
    ├── particles.js    # Particle explosions
    ├── stars.js        # Scrolling star background
    ├── state.js        # Game state, turn management
    ├── storage.js      # localStorage persistence
    ├── hud.js          # In-game HUD overlay
    ├── screens.js      # Menu & turn-announce screens
    ├── sidebar.js      # DOM sidebar, player management
    ├── main.js         # Game loop entry point
    └── modes/
        ├── flo.js      # 👾 Space Invaders + bunnies
        ├── samy.js     # 🏃 Geometry Dash runner
        ├── jan.js      # ⚽ Soccer goalkeeper
        └── felix.js    # 🏈 Rugby tackle/dodge
```

## Tech

Pure HTML5 Canvas + Web Audio API — no frameworks, no build step, no dependencies.
