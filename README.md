# Dungeon Quest
An atmospheric, single-switch dungeon roguelike. Every action is a tactical choice; enemies never move while you are scanning.

## Play the expedition
Serve the repository root over HTTP (for example, python -m http.server) and open index.html. The dedicated title menu opens a short, visible and narrated prologue when you begin an expedition. Enter the crypt immediately, repeat the narration, or return to the menu. Continue returns to an in-memory expedition without replaying the intro. Choose Controls on the main menu or in Settings. In one-switch mode, Enter (including numpad Enter) selects the automatically highlighted choice on release; Space is the scan brake when enabled. In two-switch mode (the shared default), Space advances and Enter selects on release; held Space optionally scans backwards. Switching to two switches requires confirmation. Scan and speech preferences use the NARBE shared managers, with five scan intervals and voice selection. Same-origin Hub settings can be shared; standalone hosting uses its own origin storage. Mouse and touch also work. Reduced motion remains game-local. No reaction-time challenge.

Explore three floors: the Forgotten Crypt, the Bone Vault and the Bellkeeper's Sanctum. Enemies announce their strikes, and guarding reduces the damage and counters before a recovery opening. Treasure supplies gold and draughts. Choose one of three permanent or restorative blessings between floors. Defeat the Bellkeeper and claim the Bell of Dawn to win. Inspect surroundings without taking a turn. Floor layouts and encounters are deterministic for a seed; four room silhouettes, variable doorways and optional extra connections keep the map compact but varied. Travel toward treasure, stairs or the final boss combines ordinary movement turns in a single selection and stops at danger or an interactable objective. It never opens treasure, fights or descends automatically.

## Architecture
- engine.js: deterministic simulation and legal action enumeration; no DOM or timers.
- art.js: original procedural Canvas 2D artwork, depth sorting and optional atmospheric effects.
- app.js: switch scanning, speech, UI and preference persistence.

The renderer is dependency-free for this initial slice. The choice and voice layers use an unmodified, pinned MIT-licensed snapshot of NARBE shared modules (see vendor header). Hub packaging, shared visual preferences, pause/exit, run persistence and physical switch validation remain outstanding. Artwork is an original procedural first pass, not a completed sprite pack.

## Development
Run node --test tests/*.test.js. A single quick CI job checks syntax and engine tests. GitHub Pages can serve the root without a build step once configured.

See DESIGN.md for scope and quality gates.
