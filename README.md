# Built it! An architect's career

A roguelite architecture game. Start as a junior architect with a corner shop. Grades decide where your career goes next, and what every future architect can build with.

## Loop
1. **Commission board.** The first job is one of three basics: Neighbourhood Boutique, Fast-food Counter or Corner Grocery. After that the board offers jobs at your level on a 1–10 ladder, a safer job one level down or a stretch job after an A or S, plus a locked teaser two levels up. The ladder covers 22 briefs in 10 industries: boutique → fast fashion → chain flagship → luxury maison, café → bistro → fine dining, corner grocery → supermarket → food hall, gym → sports hall → arena, library → school → museum → national museum, apartments, office tower, shopping centre, airport terminal.
2. **Design 2D.**
   - The Room and Furnish tools open a catalog. Pick one thing, place as many as you like, then press the red ✕ to stop. The catalog has a **This project / All** filter.
   - Select a room to get a bubble with **Move** (the room and everything in it), **Merge** (with a same-type neighbour) and **Erase** (asks for confirmation).
   - The Erase tool only removes objects.
   - **Fixtures plus products.** Place a Clothes rack, Chiller, Aisle or Display, then assign its product (Women / Men / Kids, Produce / Meat / Dairy / Frozen / Drinks, Snacks / Condiments / Pasta & tins / Bakery...).
   - **Merchandising** counts toward Functionality: keep each department together, put displays and mannequins next to their racks and produce crates by the produce chiller, and keep tills near the door. The plan draws link lines between fixtures that work together.
3. **Decorate 3D.** Floors, wall paint, ceilings, facade, entrance doors and roof finishes, decor and landscaping, and ceiling lights, with a day/night toggle. Quality tiers: Basic, Standard, Premium.
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

## Architects
Ten playable profiles. Name, age, country and gender stay editable.
- **Two studio founders** (open from the start): no rating bonus, but a founders kit with paper wallpaper and paper lanterns.
- **Eight specialists**, unlocked by completing a career (5+ approved commissions) with a founder. Each founder trains four:
  - **Background bonus:**
    - Pure: a little of everything.
    - Art: +6 Aesthetics.
    - Engineering: missed requirements cost 30% less.
    - Business: −10% construction cost.
  - **Expertise** in one or two industries (civic, housing, fashion, food, sport, health, grocery…): +5 Functionality and +10% fees on those projects.
  - **Signature finishes** that match the expertise: a wall, a floor, a ceiling and a roof only that architect can use, such as Venetian plaster, Nero marble, a barrel vault and a patinated copper roof.

## Placement and layout checks
- Any item can go in any room. A drinks station in the WC still works, but **Item placement** lowers Functionality. Items marked for outdoor use (tables, grill, displays, plants…) can also go outside on the lot. Toilets, ranges and similar can't.
- Rotation is always allowed. If a rotated item overlaps something, it turns red and doesn't count until you move it.
- **Key checks** for each building type measure walking distance through doors between what matters and rate it Close, Mid or Far. Examples: tables to the kitchen, counter next to the kitchen, fitting rooms to the shop floor, tills by the door, chillers near stock.
- **Signature features** for each type: booths, women's/men's restrooms or fitting rooms (set a room's gender in its bubble), premium seating, and premium finishes (worth less in fast food). Bonus features such as booths or prepared food in grocery add extra points.
- On the review screen, tap Functionality, Requirements, Aesthetics or Budget to see a breakdown of what earned or cost points. Examples: walls that miss the client's taste, rooms without windows, windows blocked by tall shelving, cheap furniture, missing features.

## Design
The menus use **Monograph**, a design language based on architects' presentation decks: off-white paper, floating white cards, hairlines, light/bold title pairs, large condensed numerals (Antonio), self-drawing linework, a white massing-model 3D hero, and diamond-cropped project images with numbered markers. Motion is calm: pages wipe in like deck slides, windows unfold and fold away, and lists stagger in. The plan drawing keeps its CAD mono type.

Project icons load from `public/art/projects/<id>.jpg`. See `ART_PROMPTS.md` for the image prompts and `scripts/slice-art.cjs` to cut a 6×4 grid into tiles.

## Install as an app
Built it! is a PWA. Open the site on a phone and use **Settings → Install Built it!**. If the browser has no install prompt, the button shows the manual steps for your browser. On iPhone, use Safari's **Share → Add to Home Screen**. It runs fullscreen and works offline after the first visit, because the service worker caches the game and all its art. Icons are rendered by `scripts/make-icons.cjs`.

## Controls
- Plan: one finger uses the tool, two fingers pan and pinch-zoom. Mouse: wheel zooms, right-drag pans.
- 3D: drag to orbit, pinch to zoom.

## Code
- `src/game/`: data (rooms, items, materials, briefs, packs)
- `src/engine/`: pure logic (plan, scoring, career and meta), covered by `npm test`
- `src/ui/`: React screens, SVG plan editor, Three.js scene, feedback layer
- `.claude/skills/`: vendored game-dev skills (see `AUDIT.md`)

`npm install && npm run dev`
