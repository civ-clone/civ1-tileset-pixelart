# Sprite spec

Every sprite in the pack is drawn from these descriptions by the code in `src/`. Nothing was traced, sampled or
converted from another game's art: whoever wrote the drawing code worked from this spec and the pack's own renders
only. The sprite names and sizes follow the tileset format civ.one already reads (the names in `tileset.json`), so the
pack fits the renderer as it is.

## Format

- 32 × 32 square tiles. Interface icons keep the small sizes the interface lays out for them (listed below).
- Player colour keys: `#60E064` (fill) and `#2C7800` (border and shadow), which the game swaps for each player's
  colours. The city picture uses `#000000` for the owner's second colour instead.
- Figures have a 1px near-black outline (`#141018`) and are lit from the top left (light top and left edges, dark
  bottom and right) with 3–4 tone colour ramps.
- Terrain is a sparse overlay on a land base. Textures repeat every 32px, so a sprite meets copies of itself, and the
  other join variants of its terrain, with no seam.

## Units

A rounded badge in the player colour fills the tile with a 1px transparent margin. The figure stands on it and casts
a 1px shadow down and to the right in the border key, so the shadow takes the player's colour too. Ships sit on a
band of water with white foam.

| Unit | Picture |
| --- | --- |
| settlers | Worker in a wide-brimmed straw hat, shovel over the shoulder, bundle on the back |
| warrior | Bare-legged fighter in a fur tunic, raising a knobbed wooden club |
| spearman | Soldier behind a big round bronze shield, crested helmet, tall spear |
| swordman | Legionary with a curved rectangular red shield and bronze boss, short sword raised, plumed helmet |
| horseman | Rider on a brown horse facing right, lance pointed forward |
| chariot | Two-wheeled war chariot, one horse, driver with a spear, facing right |
| knight | Armoured knight on a barded horse in a heraldic caparison, lance, facing right |
| catapult | Wooden frame on two spoked wheels, arm cocked back with a loaded stone |
| musketman | Soldier in a tricorn and long coat, musket at port arms |
| rifleman | Soldier in a brimmed helmet and khaki uniform, rifle with a bayonet |
| mechanizedinfantry | Wheeled armoured personnel carrier facing right, with a small turret |
| cannon | Bronze barrel on a wooden two-wheeled field carriage, facing right |
| artillery | Modern field gun with a shield plate, long barrel raised to the right, split trail |
| tank | Olive tank facing right: tracks with road wheels, sloped hull, turret, long gun |
| diplomat | Figure in a dark long coat and top hat, holding a scroll and a briefcase |
| caravan | Camel facing right, laden with bundles and rolled carpets |
| trireme | Low galley with a ram, a row of oars and a striped square sail |
| sail | Small single-masted cog with a big square sail, facing right |
| frigate | Three-masted sailing warship with gun ports along the hull, facing right |
| ironclad | Low dark iron steamship with one funnel and smoke, facing right |
| transport | Big cargo steamship, two funnels, black hull with a red waterline |
| cruiser | Grey warship with two gun turrets and a mast, facing right |
| battleship | Larger and heavier than the cruiser: three turrets, tall superstructure, longer hull |
| carrier | Long flat flight deck from a high angle, island on the right, a tiny plane on deck |
| submarine | Low dark hull, conning tower and periscope, partly awash |
| fighter | Single-engine plane from above, nose up, with roundels |
| bomber | Four-engine plane from above, nose up, wider and heavier than the fighter |
| nuclear | Missile on a launch angle: white body, red nose cone, fins, exhaust flame |

`combat_1`–`combat_8`: on a transparent tile with no badge, a small flash grows into a fireball of yellow, orange and
red with sparks, then shrinks inside dark smoke, which turns grey and breaks up as it fades.

## Terrain

Each terrain has an isolated sprite and 15 join variants, named by the edges (`n`, `e`, `s`, `w`) whose neighbour is
the same terrain. Along an edge whose neighbour differs, the overlay stops in a ragged fringe at most 8px deep, where
the land base shows through. Features (peaks, mounds, trees) sit in the same places in every tile:

- a feature may cross into a joined neighbour if it keeps 8px clear of the corners, and is then drawn by both tiles.
  That is what lets mountain ranges, hills and forests run on from tile to tile;
- a feature wholly inside one tile may be left out of some join variants, so neighbouring tiles differ.

| Terrain | Ground | Features |
| --- | --- | --- |
| land (base) | Three greens with darker grass tufts | — |
| grassland | Lusher green patches with a few flowers | Occasional shrubs |
| plains | Golden green with rows of wheat strokes | Occasional shrub |
| desert | Sand with wavy dune ripples | Cacti and small rocks, sparse |
| tundra | Grey-green with frost and lichen flecks | Low shrubs and rocks |
| arctic | Pale blue-white ice with fine cracks | Low pressure ridges, sparse |
| swamp | Dark olive mud with pools of still water | Reeds with cattails |
| forest | Dark forest floor | Mixed conifers and round-topped trees |
| jungle | Bright dense green with leaf flecks | Palms and flowering broad-leaf bushes |
| hills | Olive | Rounded, shaded grassy mounds |
| mountains | Rocky grey-brown with scree | Peaks with a lit left face, shadowed right face and snow caps |
| river | (on land) | A blue channel with muddy banks from the centre to each joined edge (rivers also join the sea); a small pool when isolated |

- **ocean**: deep blue with scattered short wave crests.
- **coast_sprite**: 8 cells. Each holds, in its four quarters, the coast for that corner's three land neighbours as
  the renderer reads them: sand, wet sand, a foam line and a band of shallow water, all on the ocean side.
- **river_mouth_{n,e,s,w}**: on the ocean tile, fresh water fanning out from that edge between sand bars.

## Specials

Drawn over the terrain, in the lower right of the tile unless noted.

| Special | Picture |
| --- | --- |
| shield | A small bronze shield, 11 × 12, placed near the middle (grassland) |
| fish | A teal fish leaping over a splash |
| horse | A brown horse grazing |
| doe | A doe (game on forest) |
| game | An antlered beast with a pale ruff (game on tundra) |
| coal | A heap of black coal lumps |
| gold | Gold nuggets with a glint |
| gems | Three cut gems: red, blue and green |
| oil | A derrick over a black pool |
| oasis | A pool under a palm |
| seal | A grey seal |

## Improvements and map

- **irrigation**: a field of diagonal water channels between earth ridges, inside an earth border. Drawn over the
  terrain (`irrigation.overTerrain`), as this pack's terrain covers the land.
- **mine**: a timbered shaft in a rock heap, with a pick.
- **pollution**: olive-grey sludge splats.
- **road_{dir}**: a packed-dirt track from the centre towards each of 8 directions.
- **railroad_{dir}**: two steel rails on wooden sleepers, every 4px counted from the tile edge so they line up.
- **fog_{n,e,s,w}**: a black ordered-dither fade from that edge, about 7–12px deep.
- **hut**: a thatched village hut with a smaller hut and a totem.
- **fort**: an earth bank with a stake palisade round the tile edge and a gate at the front; transparent centre.
- **fortify**: a crenellated stone wall frame, about 4px thick, drawn over a fortified unit's badge.
- **city** (30 × 30, on a box of the owner's main colour): houses with red and brown roofs, a columned temple and a
  stone tower, a crenellated wall along the front in the owner's second colour with a wooden gate, and a calm area in
  the lower middle where the game prints the city's size.

## Interface

| Sprite | Size | Picture |
| --- | --- | --- |
| city/food | 7 × 7 | Scored bread loaf |
| city/production | 7 × 7 | Hammer |
| city/trade | 7 × 7 | Two opposed arrows |
| city/gold | 7 × 7 | Coin |
| city/luxury | 7 × 7 | Gem |
| city/bulb | 7 × 7 | Light bulb |
| city/sad | 7 × 7 | Frowning face |
| city/people_happy_{m,f} | 8 × 16 | Bright figure, arms up |
| city/people_content_{m,f} | 8 × 16 | Neutral standing figure |
| city/people_unhappy_{m,f} | 8 × 16 | Dark, slumped figure |
| city/people_tax(_f) | 8 × 16 | Figure in gold, holding a coin |
| city/people_science(_f) | 8 × 16 | Figure in white and blue, holding a flask |
| city/people_luxury(_f) | 8 × 16 | Entertainer in purple and red with a lute |
| city/pollution | 16 × 16 | Smokestack with grey-brown puffs |
| status/science_{0,25,50,75} | 8 × 8 | A bulb brightening in four steps |
| status/pollution_{0,25,50,75} | 8 × 8 | A sun going from calm to hot red |
| cursor/go | 12 × 12 | Green arrow, tip at the top left |
| cursor/torch | 13 × 13 | Flaming torch, tip at the top left |
| general/texture_1 | 16 × 16 | Seamless warm parchment |
| general/texture_2 | 16 × 16 | Seamless dark stone |
