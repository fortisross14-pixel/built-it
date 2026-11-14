# BUILT: an architect's career

A roguelite architecture game. You start as a junior architect with no clients. Take commissions, design the building (plan plus low-poly 3D), get reviewed, build a reputation and unlock bigger work. Three disasters and the studio closes; after 10 commissions you retire. The next architect inherits every card you collected.

## Loop
1. **Commission board**: 3 offers from the tiers you've unlocked, plus a locked teaser from the next tier. Each offer rolls a client, two style preferences, a budget and sometimes a twist (heritage district, green mandate, tight budget…).
2. **Design**: draw rooms, place doors and windows, furnish, pick facade and floor materials. Multi-level briefs need stairs and lifts stacked between levels.
3. **Review**: scored on Functionality (circulation from the street door, access to equipment, walking distance, adjacencies, crowding, wet-room floors, vertical links), Requirements (room program, equipment, budget, levels, twist rules) and Aesthetics (daylight, proportions, style fit, palette, landscape, facade rhythm, massing, signature pieces). Overall = average.
4. **Reputation and cards**: 3★+ earns a pick of 3 cards (materials, special items, perks). Score < 50 is a strike.

Tiers: café / bakery / boutique → bistro / clinic / library → apartments / school / museum → office tower / mall / national museum.

## Controls
- Plan: one finger uses the current tool, two fingers pan and pinch-zoom. Mouse: wheel zooms, right-drag pans.
- 3D: drag to orbit, pinch to zoom. "Cutaway" slices at the active level.

## Code
- `src/game/`: data (rooms, items, materials, briefs, cards)
- `src/engine/`: pure logic (plan model, scoring, career/meta), covered by `npm test`
- `src/ui/`: React screens, SVG plan editor, Three.js scene

`npm install && npm run dev`
