# Dungeon Quest — art and design direction

High-detail 2.5D dark-fantasy pixel-inspired presentation, with warm amber crypt lighting, cool slate masonry and readable characters. The floor must remain readable even without lighting. Clear type and high-contrast outlined scanning, not a generic card dashboard. No flicker or mandatory motion. The artwork is original.

## First slice
One crypt biome, warrior, skeleton, treasure and exit. Seeded rooms and corridors. All simulation changes result from explicit player choices. Enemy attacks are declared before resolution. Inspect, settings and scanning do not consume turns. Test with one switch and two switches. Aim for few choices per scan; later add safe corridor traversal and contextual action grouping.

## Subsequent phases
- Sprite atlas with consistent direction and animation, richer environmental art and audio.
- Safe travel, fog of war, multiple floors, distinct enemies and combat tactics.
- Data-driven inventory, effects and synergies; four starting classes.
- Biomes, bosses, events, shops, progression and daily seeds.
- Versioned run saves, shared NARBE scanning/speech integration, offline validation, real switch-user testing.

## Release gates
A reachable exit on every seed, deterministic resolution, no time-based player harm, visible and spoken status/intent, high contrast, reduced motion, no inaccessible dead ends, touch and switch parity. Visual quality must be approved using real browser screenshots, not inferred from source or tests. No claim of NARBE compliance until integration and user review.

## Expedition challenge (phase 3)
Three floors, each with a key-bearing guardian. Strike/guard/riposte/retreat with a visible recovery turn. Two upgrade choices over the expedition (blade, armour, vitality), replenished draught after a floor, and a final Warden. Clear victory or defeat report. Gold is currently a score, not a spendable currency. Layout variation is deliberately limited to corridor and encounter placement pending full procedural generation. Next: measure real run completion and switch cost, then add path travel and item synergies; avoid expanding content before core combat works.
