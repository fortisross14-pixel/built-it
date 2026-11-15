# Project art: prompts for the 24 project icons

The game shows one square icon per project type on the commission board, in the detail sheet, on the ladder and in the review. Until an image exists, a coloured tile with the industry icon stands in.

**Where the files go:** `public/art/projects/<id>.jpg`, square, at least 96 × 96 (256 × 256 looks better on retina phones).

## Option A: one grid image (fastest)

Paste this into ChatGPT image generation (or any image model):

> Create a single image, exactly **1536 × 1024 pixels**, laid out as a **6 columns × 4 rows grid of 24 equal square tiles (256 × 256 each)** with no gutters, borders or text.
> Each tile is a **semi-realistic miniature diorama** of one building type, seen in a **three-quarter isometric view from slightly above**, centred, filling about 80% of the tile. Style: soft natural daylight from the upper left, gentle ambient occlusion, matte materials, a tidy architectural-model look (like a high-end architect's presentation model with a touch of realism: real materials, glazing, signage shapes but **no readable text or logos**). Each building sits on a small rounded square plinth of pale warm grey ground with a couple of tiny trees or street details. Background of every tile: flat, very light warm grey (#ECEAE4). Consistent scale, lighting, camera angle and colour grading across all tiles. Muted, sophisticated palette.
> Tiles in reading order (left to right, top to bottom):
> Row 1: 1 Neighbourhood clothing boutique with a shop window and clothes racks visible · 2 Fast-food burger counter with a bright canopy · 3 Corner grocery store with fruit crates outside · 4 Corner café with a terrace and parasols · 5 Fast-fashion store with big glass frontage · 6 Neighbourhood bakery with bread in the window
> Row 2: 7 Bistro restaurant with outdoor tables and warm lighting · 8 Neighbourhood supermarket with car park and trolleys · 9 Dental clinic, clean white modern building with a tooth-shaped sign shape (no text) · 10 Boutique gym with large windows showing treadmills · 11 Branch library with tall windows and bookshelves visible · 12 Two-storey international fashion flagship store
> Row 3: 13 Four-storey apartment block with balconies · 14 Primary school with a playground · 15 Fine-dining restaurant, elegant dark facade · 16 Contemporary art museum with an atrium · 17 Luxury fashion maison, stone facade and awnings · 18 Community sports hall with a court visible through glazing
> Row 4: 19 Gourmet food hall, two-storey market building · 20 Glass office tower (8 storeys) · 21 Shopping centre with an atrium roof · 22 Grand national museum with a classical colonnade · 23 Indoor sports arena · 24 Regional airport terminal with a jet bridge and a small plane

Save it as `art-source/projects-grid.png`, then run:

```
node scripts/slice-art.cjs art-source/projects-grid.png
```

That writes the 24 files into `public/art/projects/`. Or just commit the grid image and ask me to slice it.

## Option B: one image per project

Use this style prefix for every prompt, then add the subject:

> Semi-realistic miniature diorama of a single building, three-quarter isometric view from slightly above, centred, soft daylight from the upper left, matte materials, architectural presentation model look, small pale-grey rounded plinth with a couple of tiny trees, flat very light warm grey background (#ECEAE4), no text, no logos, square 512 × 512. Subject:

| # | File name | Subject |
|---|---|---|
| 1 | `boutique.png` | neighbourhood clothing boutique with a shop window and clothes racks visible |
| 2 | `fastFood.png` | fast-food burger counter with a bright canopy |
| 3 | `cornerShop.png` | corner grocery store with fruit crates outside |
| 4 | `cafe.png` | corner café with a terrace and parasols |
| 5 | `fastFashion.png` | fast-fashion store with a big glass frontage |
| 6 | `bakery.png` | neighbourhood bakery with bread in the window |
| 7 | `bistro.png` | bistro restaurant with outdoor tables and warm lighting |
| 8 | `supermarket.png` | neighbourhood supermarket with a car park and trolleys |
| 9 | `clinic.png` | dental clinic, clean white modern building |
| 10 | `gym.png` | boutique gym with large windows showing treadmills |
| 11 | `library.png` | branch library with tall windows and bookshelves |
| 12 | `fashionChain.png` | two-storey international fashion flagship store |
| 13 | `apartments.png` | four-storey apartment block with balconies |
| 14 | `school.png` | primary school with a playground |
| 15 | `fineDining.png` | fine-dining restaurant with an elegant dark facade |
| 16 | `museum.png` | contemporary art museum with an atrium |
| 17 | `luxury.png` | luxury fashion maison with a stone facade and awnings |
| 18 | `sportsHall.png` | community sports hall with a court visible through glazing |
| 19 | `foodHall.png` | two-storey gourmet food hall |
| 20 | `tower.png` | glass office tower, 8 storeys |
| 21 | `mall.png` | shopping centre with a glazed atrium roof |
| 22 | `grandMuseum.png` | grand national museum with a classical colonnade |
| 23 | `arena.png` | indoor sports arena |
| 24 | `airport.png` | regional airport terminal with a jet bridge and a small plane |

## Other art sets (already in the game)

| Set | Source grid | Slice command | Output |
|---|---|---|---|
| Architect portraits (12 plaster busts) | `art-source/architects-grid.png` (6 × 2) | `node scripts/slice-art.cjs art-source/architects-grid.png architects` | `public/art/architects/a01–a12.jpg` |
| Supplier pack boards (19) | `art-source/packs-grid.png` (5 × 4, last tile empty) | `node scripts/slice-art.cjs art-source/packs-grid.png packs` | `public/art/packs/<packId>.jpg` |
