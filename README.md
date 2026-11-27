# Dungeon Quest
An atmospheric, single-switch dungeon roguelike. Every action is a tactical choice; enemies never move while you are scanning.

## Play the first vertical slice
Serve the repository root over HTTP (for example, python -m http.server) and open index.html. The dedicated title menu opens a short, visible and narrated prologue when you begin an expedition. Enter the crypt immediately, repeat the narration, or return to the menu. Continue returns to an in-memory expedition without replaying the intro. Choose Controls on the main menu or in Settings. In one-switch mode, Space selects the automatically highlighted choice on release. In two-switch mode, Space advances the highlight and Enter selects it, both on release; automatic scanning is disabled. Switching to two switches requires confirmation. The chosen mode is saved locally. Mouse and touch also work. Settings include scan speed, speech and reduced motion. No reaction-time challenge.

The Forgotten Crypt is a three-floor expedition. Defeat the key-bearing guardian of each floor to unlock its stairs. Guard a declared strike to prepare a riposte, or dodge away; enemies recover after a strike. Choose a blade, armour or health upgrade between floors, receive a healing draught, and defeat the Bell Warden. The final report tracks floors, kills, treasure, gold and turns. Gold is a score for now. Layouts currently vary by passages and encounter locations, not fully procedural rooms. Inspect surroundings without taking a turn.

## Architecture
- engine.js: deterministic simulation and legal action enumeration; no DOM or timers.
- art.js: original procedural Canvas 2D artwork, depth sorting and optional atmospheric effects.
- app.js: switch scanning, speech, UI and preference persistence.

The renderer is dependency-free for this initial slice. The interface is not yet integrated into NARBE's shared platform. Artwork is an original procedural first pass, not a completed sprite pack.

## Development
Run node --test tests/*.test.js. A single quick CI job checks syntax and engine tests. GitHub Pages can serve the root without a build step once configured.

See DESIGN.md for scope and quality gates.
