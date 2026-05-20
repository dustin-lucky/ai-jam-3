# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server at http://localhost:5173 (hot-reload)
npm run build     # Production build → dist/
npm run preview   # Serve the production build locally
```

No linter or test suite is configured.

## Architecture

This is a Phaser 4 browser game using Matter.js physics (bundled with Phaser). Built with Vite, deployed as a static site to Vercel.

**Scene flow:** `BettingScene` → `ArenaScene` → `ResultsScene` → back to `BettingScene`

Cross-scene state lives in a single `GameState` instance stored on `this.registry` (Phaser's global key-value store). Scenes read it via `this.registry.get('gameState')`. `BettingScene` initializes it on first load and calls `state.reset()` each round; `ArenaScene` writes race results into it; `ResultsScene` reads and settles bets.

**`src/game/constants.js`** is the primary tuning file — all physics values, arena dimensions, marble counts/colors, and bumper positions live here. When adjusting feel, start here before touching scene code.

**`src/game/MarbleData.js`** owns the `GameState` class (wallet, bets, settlement logic) and `makeMarbleData()` which produces the per-round marble array. Bet settlement (`isBetWon`) is co-located here.

**`src/scenes/ArenaScene.js`** is the core simulation. Key methods:
- `buildArena()` — constructs the circular physics wall from 64 static line segments
- `buildPerimeterObstacles()` — 4 rotating static rectangles centered on the arena edge, updated each frame via `Matter.Body.setAngle()`
- `setupCollisions()` — hooks `collisionstart`; directional damage uses dot product of attacker velocity against collision normal, only dealing damage within a 45° forward cone
- `sustainMarbleSpeed()` — enforces a global speed floor that ramps from `MIN_SPEED_START` to `MIN_SPEED_END` over 90 seconds
- `accelerateWallMarbles()` — multiplicative speed boost per frame when a marble's center is within `MARBLE_RADIUS + 4` px of the arena boundary
- All rendering is done imperatively each frame via `this.marbleGraphics.clear()` + redraw (no Phaser sprites)

**Collision filter convention:** walls/bumpers/obstacles use `category: 0x0001`, marbles use `category: 0x0002`. Marble-marble and marble-wall collisions are both enabled; obstacle-obstacle is not.

**Speeds are in Matter.js units (pixels/frame at 60 fps).** `LAUNCH_SPEED_MIN/MAX` are in px/s and divided by 60 when set as velocity. The `sustainMarbleSpeed` floor and wall `BOOST` are already in per-frame units.
