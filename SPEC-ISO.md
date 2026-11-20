# Isometric sprite spec

The isometric pack (`tileset-iso.json`, built into `pack-iso/`) draws civ.one's staggered isometric grid
(`staggered-iso`) in the same style as the square pack, from these descriptions and [SPEC.md](SPEC.md). Nothing was
traced, sampled or converted from another game's art. The interface's sprites (yield icons, citizens, meters, cursors,
textures) are the square pack's own, and so are the figures on the units and the specials: only what has the shape of
a tile is drawn again for a diamond.

## Format

- **Tiles:** diamonds in a 64 × 32 box. The diamond's corners are at the middles of the box's four sides.
- **Rows:** 16px apart, and every odd row is shifted 32px right.
- **Pixels:** a sprite on a tile keeps exactly the pixels civ.one's isometric projection gives its tile, so neighbouring
  tiles meet with no gap and no pixel drawn twice. Everything outside them is transparent.
- **Tall sprites:** units, the city, its rim and the fortified wall are 64 × 48. The tile's diamond is their bottom 32 rows,
  and they may reach up to 16px above it, but never beside the diamond's lower half, where the tiles in front are. The
  descriptor anchors them 16px up and gives the grid 16px of overhang above.
- **Textures:** they repeat on the grid's lattice, every 64px across and every 16px down with a 32px shift, so a sprite
  meets copies of itself, and its terrain's other join variants, with no seam on any of its four edges.
  - Every period is a power of two, so a pattern that repeats every 4px (or 8px) across and down fits the lattice.
    Dithers use a 4 × 4 table, and glints on water keep to their own 4 × 4 cells.
- **Neighbours:** the four that share an edge are named as the engine names them: `ne`, `se`, `sw`, `nw`. A sprite for
  some of them names them in that order, joined by `-`: `forest_ne-sw`. Roads also join the four that touch only at a
  corner, `n`, `e`, `s` and `w`.
- **Colours:** the player colour keys, outline and lighting are the square pack's.

## Terrain

- **Variants:** each terrain has an isolated sprite and 15 join variants, one for every set of edges whose neighbour is
  the same terrain.
- **Edges:** along an edge whose neighbour differs, the terrain stops in a ragged fringe at most about 7px deep, where
  the land base shows through. It is shallower than the hex pack's, as a diamond is only 32px tall. The grounds are the
  square pack's, in its colours.
  - The fringe's depth is set by the point of the edge it is beside, and near a corner by the corner itself.
  - So where two joined tiles both stop at a third, their fringes meet at the same depth, with no notch.
  - It wanders in broad, rounded bites as well as small ragged ones, so a stretch of terrain has a soft outline rather
    than following the diamonds.
  - Where two edges that both stop meet at a corner, the terrain's own corner is rounded off.
- **Desert and plains:** their patterns are fitted to the lattice. The desert's dune ripples are 8px apart, so a row is
  two of them. The plains' wheat strokes each keep to their own 4 × 4 cell.
- **Features:** these are the square pack's drawings (peaks, mounds, trees, palms, reeds, rocks, cacti, ice). The
  diamond is wide and low, so each terrain's are spread across it. They sit in the same places on every diamond:
  - one placed at the middle of an edge runs on into that neighbour when it is joined, and both tiles draw it, which
    is what lets ranges and forests run on from tile to tile. It is left out when that neighbour isn't joined;
  - one wholly inside the diamond is left out of some join variants, so neighbouring tiles differ;
  - none reaches two neighbours.
- **Mountains and hills:** a big peak or mound in the middle, and smaller ones at the middles of the edges.
- **Rivers:** a blue channel with muddy banks from the middle of the diamond to the middle of each joined edge, where
  the neighbour's channel carries on. It runs in one smooth curve between two edges, meandering gently on a straight
  run, and comes in straight for the first fifth of the way from each edge, so it meets the neighbour's channel exactly.
  Three or more channels meet a little off the middle, a lone one ends in a spring, and an isolated river is a
  small pond. The water is darker along its line, and the bank is wider here and there, with sand and reeds, away from
  the edges. Rivers also join the sea.

## Water

- **Ocean:** the square pack's deep blue with short wave crests, each crest kept to its own 8 × 8 cell.
- **Coast:** four quarters, `coast_{corner}_{bits}`, each a half-size diamond at one of the tile's corners (`n`, `e`,
  `s`, `w`). The four together are the whole diamond.
  - Each quarter is picked by the three neighbours that touch its corner: the edge neighbour on one side, the corner
    neighbour, and the edge neighbour on the other side (`n` is `nw`, `n`, `ne`), `1` for land.
  - Inside every edge with land beyond, and round a corner with land beyond it, it draws sand, wet sand, a foam line and
    a band of shallow water, on its own quarter only.
  - The beach widens and narrows in broad swells along the shore, and where two shores meet in a bay it curves round
    rather than meeting in a point, so the coastline reads as rounded rather than following the diamonds.
  - The descriptor puts them together as named corners, each at the tile's corner.
- **River mouths:** `river_mouth_{edge}`, on the ocean tile: the river's own channel, in its colours and at its width
  where it crosses the edge, cutting through the beach and its foam, then turning the coast's shallow-water colour and
  fading out through the lattice's dither a few pixels into the sea, with a little wet sand where it leaves the shore.

## Other rules' names

The descriptor names what other rules call by another name: Civilization II's Glacier is drawn with the arctic
sprites, and its River, a feature on any land rather than a terrain of its own (`families.terrain.features`), with the
river sprites over that land's terrain. The river sprites are only the channel and its banks, so the terrain under them
shows.

## Improvements and map

- **specials:** the square pack's, moved from its lower right to just right of the diamond's middle, except the
  shield, which the descriptor places.
- **irrigation:** water channels between earth ridges running down to the right, inside an earth border 3px in from the
  diamond's edge.
- **mine, pollution, hut:** the square pack's, moved to the diamond's middle.
- **road_{dir}, railroad_{dir}:** for all eight neighbours, from the middle to the middle of that edge, or to that
  corner.
  - A road is a packed-dirt track. Its width and edges wander a little, by noise on the lattice so neighbouring tiles'
    roads meet, with darker ruts and the odd stone, so a long road isn't a ruled line. It bends like a lane, each
    direction its own way and by its own amount with a smaller wiggle on top, and comes in square on where it leaves the
    tile, so neighbouring tiles' roads meet.