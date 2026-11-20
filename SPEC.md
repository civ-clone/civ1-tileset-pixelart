# Sprite spec

Every sprite in the pack is drawn from these descriptions by the code in `src/`. Nothing was traced, sampled or
converted from another game's art: whoever wrote the drawing code worked from this spec and the pack's own renders
only. The sprite names follow the tileset format civ.one already reads (the names in `tileset.json`), so the pack fits
the renderer as it is. Interface sprites are drawn at the size the renderer shows them, which `ui` in `tileset.json`
gives.

## Format

- 32 × 32 square tiles. Interface sprites have their own sizes (listed below).
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
| archer | Bowman in a green hooded tunic, drawing a longbow to the right, quiver of arrows on the back |
| pikeman | Soldier in a steel morion and breastplate, a very long pike held upright and slanting forward |
| crusader | Rider in a white surcoat with a red cross, on a grey horse facing right, sword raised |
| elephant | War elephant facing right, with tusks, a red saddle cloth and a rider with a spear |
| dragoon | Rider in a blue coat and a crested brass helmet, on a horse facing right, carbine on the shoulder |
| cavalry | Rider in khaki with a slouch hat, on a galloping horse facing right, sabre pointed forward |
| alpinetrooper | Soldier in white snow gear and goggles with a pack and a coil of rope, ice axe raised |
| fanatic | Figure in a dark robe and a red headband, rifle raised over the head in both hands |
| partisan | Figure in a beret and a green jacket, bandolier across the chest, rifle held across the body |
| paratrooper | Soldier hanging under an open white parachute canopy by its lines |
| marine | Soldier in a dark green helmet and fatigues standing in the surf, rifle held up |
| engineer | Worker in a yellow hard hat and orange overalls, a pickaxe over the shoulder |
| explorer | Figure in a pith helmet and a khaki jacket with a backpack, a walking staff and a telescope |
| spy | Figure in a belted trench coat with the collar up, a fedora and dark glasses |
| howitzer | Sand-coloured tracked gun facing right, a big boxy turret and a long, thick barrel raised high |
| helicopter | Helicopter from the side facing right, rotor blur on top, tail boom and tail rotor, skids |
| stealthfighter | Black faceted jet from above, nose up, sharply swept wings and two canted fins |
| stealthbomber | Black flying wing from above, nose up, with a saw-tooth trailing edge |
| cruisemissile | Slim grey missile flying right on a slight climb, stubby wings and tail fins, a short flame |
| destroyer | Slim grey warship facing right, one turret forward, a raked funnel, a bow wave |
| missilecruiser | Grey warship facing right, a block superstructure with a radar mast, box launchers fore and aft |
| galleon | Big sailing ship facing right, a high gilded stern castle, two masts of square sails and a pennant |
| freight | Cargo ship facing right, its deck stacked with red, blue and yellow containers, the bridge at the stern |

`combat_1`–`combat_8`: on a transparent tile with no badge, a small flash grows into a fireball of yellow, orange and
red with sparks, then shrinks inside dark smoke, which turns grey and breaks up as it fades.

## Terrain

Each terrain has an isolated sprite and 15 join variants, named by the edges (`n`, `e`, `s`, `w`) whose neighbour is
the same terrain. Along an edge whose neighbour differs, the overlay stops in a ragged fringe at most 8px deep, where
the land base shows through. It has broad, rounded bites as well as small ragged ones, so a stretch of terrain has a
soft outline rather than following the squares. Features (peaks, mounds, trees) sit in the same places in every tile:

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
| river | (on land) | A blue channel with muddy banks to each joined edge (rivers also join the sea), as below |

- **ocean**: deep blue with scattered short wave crests.
- **coast_sprite**: 8 cells. Each holds, in its four quarters, the coast for that corner's three land neighbours as
  the renderer reads them: sand, wet sand, a foam line and a band of shallow water, all on the ocean side. The beach
  widens and narrows in broad swells along the shore, and curves round where two shores meet in a bay.
- **river**: the channel crosses the middle of each joined edge at the same width, square on. It runs in one smooth
  curve between two edges, meandering gently on a straight run, and comes in straight for the first fifth of the way
  from each edge, so it meets the neighbour's channel exactly. Three or more channels meet a little off the
  middle, a lone one ends in a spring, and an isolated river is a small pond. The water is darker along its line, and
  the bank is wider here and there, with sand and reeds, away from the edges.
- **river_mouth_{n,e,s,w}**: on the ocean tile, the river's own channel, in its colours and at its width where it
  crosses the edge, cutting through the beach and its foam, then turning the coast's shallow-water colour and fading out
  through an ordered dither a few pixels into the sea, with a little wet sand where it leaves the shore.

## Variants and flavour

A stretch of one terrain shouldn't be the same tile over and over. Where a square's terrain is joined on every edge,
the descriptor's `families.terrain.variants` and `flavour` give the game other pictures of it, which it picks by a
stable hash of the square's position (`counts` says how many each terrain has, by engine name).

- **{terrain}_v{n}:** the fully joined sprite again, keeping a different selection of the features that sit wholly
  inside the tile, and fewer of them. Features that cross into a neighbour are the same as in the usual sprite, so a
  variant meets its neighbours as the usual one does. A variant identical to the usual sprite, or to another, is left
  out, so some terrains have fewer.
- **{terrain}_flavour_{n}:** a small picture drawn over the fully joined terrain, on about 30% of such squares, and
  never on a square with a special or a hut, which the game leaves it off. Each is drawn left of the middle, and none
  is an animal or a crop, so none reads as a special.

| Terrain | Flavour |
| --- | --- |
| grassland | A patch of wildflowers; a small pond fringed with rushes |
| plains | A lone round-topped tree; a stony outcrop in the grass |
| desert | A tumbleweed; a patch of cracked, dry ground |
| tundra | A melt pond with an icy rim; a lichen-covered boulder |
| arctic | A dark crevasse in the ice; a snow drift |
| swamp | Lily pads on a pool of still water; a dead stump |
| forest | A fallen log; a ring of red toadstools |
| jungle | A great purple flower; a vine-covered rock |
| hills | A rocky outcrop; a cairn of stacked stones |
| mountains | A snowfield on the slope; a scree slide |

## Other rules' names

The descriptor names what other rules call by another name: Civilization II's Glacier is drawn with the arctic
sprites, its variants and flavour pictures among them, and its River, a feature on any land rather than a terrain of
its own (`families.terrain.features`), with the river sprites over that land's terrain. The river sprites are only the
channel and its banks, so the terrain under them shows.

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
| buffalo | A dark shaggy bison with short horns (plains) |
| wheat | Three tied golden sheaves of wheat (plains) |
| fruit | A cluster of red and orange fruits among broad leaves (jungle) |
| furs | A rolled brown pelt with a striped tail hanging from it (tundra) |
| iron | A heap of rust-red ore lumps beside a grey ingot (mountains) |
| ivory | Two curved white tusks, crossed (glacier) |
| peat | A stack of dark brown cut peat blocks (swamp) |
| pheasant | A pheasant with a red face, a white neck ring and a long barred tail (forest) |
| silk | A bolt of shimmering pink cloth, partly unrolled (forest) |
| spice | A sack spilling orange-red spice, with a few dark pods (swamp) |
| whales | A whale's grey back breaking the water, its tail fluke raised and a spout of spray (ocean) |
| wine | A bunch of purple grapes under a vine leaf (hills) |

## Improvements and map

- **irrigation**: a field of diagonal water channels between earth ridges, inside an earth border. Drawn over the
  terrain (`irrigation.overTerrain`), as this pack's terrain covers the land.
- **mine**: a timbered shaft in a rock heap, with a pick.
- **pollution**: olive-grey sludge splats.
- **road_{dir}**: a packed-dirt track from the centre towards each of 8 directions. Its width and edges wander a little,
  by noise that repeats every tile so neighbouring tiles' roads meet, with darker ruts and the odd stone. It bends like
  a lane, each direction its own way and by its own amount with a smaller wiggle on top, and comes in square on where it
  leaves the tile, so neighbouring tiles' roads meet.
- **railroad_{dir}**: two steel rails on wooden sleepers, every 4px counted from the tile edge so they line up.
- **fog_{n,e,s,w}**: a black ordered-dither fade from that edge, about 7–12px deep.
- **hut**: a thatched village hut with a smaller hut and a totem.
- **fort**: an earth bank with a stake palisade round the tile edge and a gate at the front; transparent centre.
- **fortify**: a crenellated stone wall frame, about 4px thick, drawn over a fortified unit's badge. The descriptor's
  `cities.walls` draws it over a walled city too, a pixel in, as Civ1 draws its fortified frame over a city with City
  Walls: the occupied box's top and left edges still show, and the renderer cuts off the frame's last row and column.
- **city** (30 × 30, on a box of the owner's main colour): houses with red and brown roofs, a columned temple and a
  stone tower, a crenellated wall along the front in the owner's second colour with a wooden gate, and a calm area in
  the lower middle where the game prints the city's size.

## Interface

The yield icons, citizens, pollution icon and torch cursor are drawn at the size the renderer shows them, given by
`ui` in `tileset.json` (14px icons, 16px-wide citizens standing 12px apart, a 26px cursor), so they are not enlarged.
Citizens keep to the middle 12px; only what they hold reaches the edges. Men (`_m`, and specialists without `_f`) have
short dark hair and trousers; women (`_f`) have long blond hair and a dress.

| Sprite | Size | Picture |
| --- | --- | --- |
| city/food | 14 × 14 | Bread loaf with three scored cuts |
| city/production | 14 × 14 | Hammer, steel head at the top left, wooden handle |
| city/trade | 14 × 14 | Two opposed arrows, blue pointing right over red pointing left |
| city/gold | 14 × 14 | Coin with a raised rim and a stamped bar |
| city/luxury | 14 × 14 | Cut gem, crown and pavilion facets |
| city/bulb | 14 × 14 | Light bulb with a glowing filament and a screw base |
| city/sad | 14 × 14 | Frowning face with worried brows |
| city/people_happy_{m,f} | 16 × 32 | Figure in green, both arms up, smiling |
| city/people_content_{m,f} | 16 × 32 | Figure in khaki, arms down |
| city/people_unhappy_{m,f} | 16 × 32 | Figure in dark grey, head bowed, arms hanging, frowning |
| city/people_angry_{m,f} | 16 × 32 | Figure in dark red, both fists raised, brows drawn down, scowling |
| city/people_tax(_f) | 16 × 32 | Figure in gold, holding a coin up in the right hand |
| city/people_science(_f) | 16 × 32 | Figure in white and blue, holding a blue flask in front |
| city/people_luxury(_f) | 16 × 32 | Entertainer in purple and red, strumming a lute |
| city/pollution | 14 × 14 | Brick smokestack with grey-brown puffs growing as they drift up and right |
| status/science_{0,25,50,75} | 8 × 8 | A bulb brightening in four steps |
| status/pollution_{0,25,50,75} | 8 × 8 | A sun going from calm to hot red |
| cursor/go | 12 × 12 | Green arrow, tip at the top left |
| cursor/torch | 26 × 26 | Flaming torch in a metal cup, flame tip at the top left, handle running down-right |
| general/texture_1 | 16 × 16 | Seamless warm parchment |
| general/texture_2 | 16 × 16 | Seamless dark stone |
