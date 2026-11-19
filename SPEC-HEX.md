# Hexagonal sprite spec

The hexagonal pack (`tileset-hex.json`, built into `pack-hex/`) draws civ.one's hexagonal grid (`hex-odd-r`) in the
same style as the square pack, from these descriptions and [SPEC.md](SPEC.md). Nothing was traced, sampled or
converted from another game's art. The interface's sprites (yield icons, citizens, meters, cursors, textures) are the
square pack's own, and so are the figures on the units and the specials: only what has the shape of a tile is drawn
again for a hexagon.

## Format

- **Tiles:** pointy-topped hexes in a 32 × 36 box. The hexagon's corners are at the middle of the top and bottom, and a
  quarter of the way (9px) down and up each side.
- **Rows:** 27px apart, and every odd row is shifted 16px right.
- **Pixels:** a sprite keeps exactly the pixels civ.one's hexagonal projection gives its tile, worked in half pixels,
  so neighbouring tiles meet with no gap and no pixel drawn twice. Everything outside them is transparent.
- **Textures:** they repeat on the grid's lattice, every 32px across and every 27px down with a 16px shift, so a
  sprite meets copies of itself, and its terrain's other join variants, with no seam on any of its six edges.
  - A pattern that repeats every few pixels fits the lattice: it repeats every 4px (or 8px, 16px) across and every
    3px (or 9px, 27px) down. Dithers use a 4 × 3 table, and glints on water keep to their own 4 × 3 cells.
  - A 1px checker can't fit, since the 27px row step is odd, so none is used where tiles meet. (The fort's palisade,
    which is wholly inside its hex, alternates its stakes.)
- **Neighbours:** the six are named as the engine names them, clockwise from the top right: `ne`, `e`, `se`, `sw`,
  `w`, `nw`. A sprite for some of them names them in that order, joined by `-`: `forest_ne-e-sw`.
- **Colours:** the player colour keys, outline and lighting are the square pack's.

## Terrain

- **Variants:** each terrain has an isolated sprite and 63 join variants, one for every set of edges whose neighbour
  is the same terrain.
- **Edges:** along an edge whose neighbour differs, the terrain stops in a ragged fringe at most 8px deep, where the
  land base shows through. The grounds are the square pack's, in its colours.
  - The fringe's depth is set by the point of the edge it is beside, and near a corner by the corner itself.
  - So where two joined tiles both stop at a third, their fringes meet at the same depth, with no notch.
  - It has broad, rounded bites as well as small ragged ones, and where two edges that both stop meet at a corner, the
    terrain's own corner is rounded off.
- **Desert and plains:** their patterns are fitted to the lattice. The desert's dune ripples are 9px apart, so a row is
  three of them. The plains' wheat strokes each keep to their own 4 × 3 cell.
- **Features:** these are the square pack's drawings (peaks, mounds, trees, palms, reeds, rocks, cacti, ice). They sit
  in the same places on every hex:
  - one placed at the middle of an edge runs on into that neighbour when it is joined, and both tiles draw it, which
    is what lets ranges and forests run on from hex to hex. It is left out when that neighbour isn't joined;
  - one wholly inside the hex is left out of some join variants, so neighbouring hexes differ;
  - none reaches two neighbours.
- **Mountains and hills:** a big peak or mound in the lower middle, smaller ones either side, and ones at the middles
  of the west and north-east edges.
- **Rivers:** a blue channel with muddy banks from the middle of the hex to the middle of each joined edge, where the
  neighbour's channel carries on. It bends once and comes in straight at the edge. Rivers also join the sea. An
  isolated river is a small pool.

## Variants and flavour

As in the square pack ([SPEC.md](SPEC.md)): variants of each terrain's fully joined sprite, keeping a different
selection of the features wholly inside the tile, and the square pack's flavour pictures, moved to the left of the
tile's middle, clear of the special.

## Water

- **Ocean:** the square pack's deep blue with short wave crests, each crest kept to its own cell.
- **Coast:** six wedges, `coast_{edge}_{bits}`, each from the middle of the hex out to one edge.
  - Each wedge is picked by the three neighbours whose shore can reach it: the one beyond its edge and the two either
    side, in clockwise order, `1` for land.
  - Inside every edge with land beyond, it draws sand, wet sand, a foam line and a band of shallow water, on its own
    part of the hex only.
  - The six together make one shore. The descriptor puts them together as named corners at the tile's corner.
  - The beach widens and narrows in broad swells along the shore, and curves round where two shores meet in a bay.
- **River mouths:** `river_mouth_{edge}`, on the ocean tile, the river's own channel, in its colours and at its width where it
  crosses the edge, carrying on a little way into the sea, widening as it goes, and fading into the sea's water through
  an ordered dither, with a little wet sand where it leaves the shore.

## Improvements and map

- **specials:** the square pack's, moved 2px left and 1px down onto the hex, except the shield, which the descriptor
  places.
- **irrigation:** diagonal water channels between earth ridges, inside an earth border 4px in from the hexagon's edge.
- **mine, pollution, hut:** the square pack's, 2px lower.
- **road_{edge}, railroad_{edge}:**
  - a road is a packed-dirt track from the middle to the middle of that edge, its width and edges wandering a little by
    noise on the lattice, with darker ruts and the odd stone;
  - a railroad is two steel rails on wooden sleepers, spaced every 4px counted back from the edge, so neighbouring
    tiles' sleepers line up.
- **fog_{edge}:** a black fade in from that edge, about 7–12px deep, dithered with the lattice's 4 × 3 table. Its depth
  meets the neighbouring tiles' at each corner, as a fringe's does.
- **fort:** an earth bank and a stake palisade just inside the hexagon's edge, with a gate at the bottom and an open
  centre.
- **fortify:** a crenellated stone wall about 4px thick round the inside of a unit's badge. The descriptor's
  `cities.walls` draws it over a walled city too.
- **city:** drawn for the hexagon, with the square pack's buildings. The game draws `city_rim` over it.
  - At the back are a temple with a house and a keep either side, and two more houses stand at the sides.
  - A stone wall runs along the two lower edges, with a tower at each end and a gatehouse at the bottom corner.
  - The middle is left open for the size number.
  - All of it is inside `city_rim`, a 2.5px rim inside the hexagon's edge in the two player colour keys, which the game
    swaps for the owner's colours.

## Units

The badge is a hexagon in the player colour, 1px in from the tile's edge, with a 1px border in the border key. The
square pack's figure stands on it 2px lower than on the square badge, and casts the same shadow. The combat frames are
the square pack's, also 2px lower.
