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

## Binding accessibility requirements
All new work must follow [Benny’s Hub ACCESSIBILITY.md](https://github.com/NARBEHOUSE/Narbehouse.github.io/blob/main/bennyshub/ACCESSIBILITY.md), especially §§3–7 and the shipping checklist. Every Dungeon Quest menu, turn, blessing and result is a stationary CHOICE context; artwork does not advance the simulation. Reuse the shared managers rather than recreate scan policy. Review upstream changes before release; do not claim Hub compliance without complete integration and real switch-user testing.
