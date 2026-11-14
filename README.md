# BUILT: an architect's career

A roguelite architecture game. You start as a junior architect with no clients. Take commissions, design the building (plan plus low-poly 3D), get reviewed, build a reputation and unlock bigger work. Three disasters and the studio closes; after 10 commissions you retire. The next architect inherits every card you collected.

## Loop
1. **Commission board**: 3 offers from the tiers you've unlocked, plus a locked teaser from the next tier. Each offer rolls a client, two style preferences, a budget and sometimes a twist (heritage district, green mandate, tight budget…).
2. **Design 2D**: draw rooms, place doors and windows, furnish and equip. Multi-level briefs need stairs and lifts stacked between levels.
3. **Decorate 3D**: tap inside the model to set floor finishes, per-room wall paint and the facade, place decor and landscaping, and hang ceiling lights (day/night toggle). Furniture, decor, lights, floors and paint come in Basic / Standard / Premium: premium lifts Functionality and Aesthetics at roughly twice the cost.
4. **Review**: four ratings, averaged. Functionality (circulation, access, walking distance, adjacencies, crowding, wet-room floors, vertical links, lighting, equipment quality), Requirements (room program, equipment, levels, twist rules), Aesthetics (daylight, proportions, style fit, palette, finish quality, lighting mood, landscape, facade, massing, signature pieces) and Budget (rewarded under, punished over).
5. **Reputation and cards**: 3★+ earns a pick of 3 cards (materials, special items, perks). Score < 50 is a strike.

Tiers: café / bakery / boutique → bistro / clinic / library → apartments / school / museum → office tower / mall / national museum.

## Controls
- Plan: one finger uses the current tool, two fingers pan and pinch-zoom. Mouse: wheel zooms, right-drag pans.
- 3D: drag to orbit, pinch to zoom. "Cutaway" slices at the active level.

## Code
- `src/game/`: data (rooms, items, materials, briefs, cards)
- `src/engine/`: pure logic (plan model, scoring, career/meta), covered by `npm test`
- `src/ui/`: React screens, SVG plan editor, Three.js scene

`npm install && npm run dev`
