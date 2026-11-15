# BUILT: an architect's career

A roguelite architecture game. Start as a junior architect with a corner shop. Grades decide where your career goes next, and what every future architect can build with.

## Loop
1. **Commission board.** The first job is one of three basics: Neighbourhood Boutique, Fast-food Counter or Corner Grocery. After that the board offers jobs at your level on a 1–10 ladder, a safer job one level down or a stretch job after an A or S, plus a locked teaser two levels up. The ladder covers 22 briefs in 10 industries: boutique → fast fashion → chain flagship → luxury maison, café → bistro → fine dining, corner grocery → supermarket → food hall, gym → sports hall → arena, library → school → museum → national museum, apartments, office tower, shopping centre, airport terminal.
2. **Design 2D.**
   - The Room and Furnish tools open a catalog. Pick one thing, place as many as you like, then press the red ✕ to stop. The catalog has a **This project / All** filter.
   - Select a room to get a bubble with **Move** (the room and everything in it), **Merge** (with a same-type neighbour) and **Erase** (asks for confirmation).
   - The Erase tool only removes objects.
   - **Fixtures plus products.** Place a Clothes rack, Chiller, Aisle or Display, then assign its product (Women / Men / Kids, Produce / Meat / Dairy / Frozen / Drinks, Snacks / Condiments / Pasta & tins / Bakery...).
   - **Merchandising** counts toward Functionality: keep each department together, put displays and mannequins next to their racks and produce crates by the produce chiller, and keep tills near the door. The plan draws link lines between fixtures that work together.
3. **Decorate 3D.** Floors, wall paint, ceilings, facade and entrance doors, decor and landscaping, and ceiling lights, with a day/night toggle. Quality tiers: Basic, Standard, Premium.
4. **Review.** Functionality, Requirements, Aesthetics and Budget, averaged into a grade:
   | Grade | Score | Effect |
   |---|---|---|
   | S | ≥ 90 | +2 levels |
   | A | ≥ 80 | +1 level |
   | B | ≥ 68 | +1 level |
   | C | ≥ 55 | −1 level |
   | F | < 55 | fails: retry for a strike, or abandon the career |
5. **Rewards.**
   - **Permanent, for all architects:** B, A and S unlock that industry's basic, advanced and special items and product lines. Examples: boutique displays and mannequins (B), shoe walls and jewellery cases (A), a VIP salon and runway (S), or drinks chillers (B), a bakery aisle, in-store bakery and deli (A) and a juice bar (S) for grocery.
   - **This architect only:** fees earn cash for supplier packs: paints, floors, facades, lighting, ceilings, entrance doors, decor and studio services (intern, contractor, mentor, renders).

Ten commissions per career, and three strikes closes the studio. Finished careers go to the legacy hall.

## Controls
- Plan: one finger uses the tool, two fingers pan and pinch-zoom. Mouse: wheel zooms, right-drag pans.
- 3D: drag to orbit, pinch to zoom.

## Code
- `src/game/`: data (rooms, items, materials, briefs, packs)
- `src/engine/`: pure logic (plan, scoring, career and meta), covered by `npm test`
- `src/ui/`: React screens, SVG plan editor, Three.js scene, feedback layer
- `.claude/skills/`: vendored game-dev skills (see `AUDIT.md`)

`npm install && npm run dev`
