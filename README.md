# Dungeon Quest
An atmospheric, single-switch dungeon roguelike. Every action is a tactical choice; enemies never move while you are scanning.

## Play the first vertical slice
Serve the repository root over HTTP (for example, python -m http.server) and open index.html. Space selects the highlighted choice on release. Enter selects in two-switch mode; Space advances. Mouse and touch also work. Settings include scan speed, speech and reduced motion. No reaction-time challenge.

The Forgotten Crypt prototype has seeded connected rooms, treasure, skeletons with declared intentions, movement, attack, guard, healing and a staircase goal. Inspect surroundings without taking a turn.

## Architecture
- engine.js: deterministic simulation and legal action enumeration; no DOM or timers.
- art.js: original procedural Canvas 2D artwork, depth sorting and optional atmospheric effects.
- app.js: switch scanning, speech, UI and preference persistence.

The renderer is dependency-free for this initial slice. The interface is not yet integrated into NARBE's shared platform. Artwork is an original procedural first pass, not a completed sprite pack.

## Development
Run node --test tests/engine.test.js. A single quick CI job checks syntax and engine tests. GitHub Pages can serve the root without a build step once configured.

See DESIGN.md for scope and quality gates.
