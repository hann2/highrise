# Gun art

Each gun as it's held, seen from above, one SVG per gun. The game rasterizes them when it starts (`../gunArt.ts`), so these files are the source: edit them (by hand, in BoxySVG, or by an agent) and reload.

## Where things are

- The gun points along +x: the muzzle on the right, the stock on the left. +y is the gun's right side (down the page), where ejection ports and the AK's charging handle are.
- 1 unit is a millimeter, and 0,0 is the gun's origin, which `GunStats.points` (in meters) are measured from: a point at `[-0.23, 0]` is at `x="-230"` here. The viewBox is the whole gun, wherever it goes. (The guns are bigger than real ones, drawn to look right next to the bodies.)

## How a file is laid out

- The top-level groups are the gun's parts, in drawing order, bottom first, each with an `id` saying what it is: `stock`, `receiver`, `barrel`, `handguard`, `frame`, `rail`, `front-sight`... A part that's a single shape can be that shape, with the id on it.
- Pieces of a part that are worth naming have ids too (`slide-serrations`, `ejection-port`, `butt-pad`). Ids are unique within a file, not across files.
- Moving parts are top-level groups of their own, named from this list, so the game can find them and move them separately:

  | id                | what                                                   |
  | ----------------- | ------------------------------------------------------ |
  | `slide`           | a pistol's slide, with everything on it (sights, port) |
  | `pump`            | a pump shotgun's forend                                |
  | `bolt`            | a bolt or bolt carrier that shows from above           |
  | `charging-handle` | a rifle's charging handle                              |
  | `hammer`          | a hammer you can see                                   |
  | `cylinder`        | a revolver's cylinder                                  |
  | `magazine`        | a magazine you can see from above (the P90's)          |
  | `barrels`         | a break action's barrels, which tip down to load       |
  | `top-lever`       | the lever that opens a break action                    |

  Everything else stays put. What each gun has: the Glock and Five-seven a `slide`; the Desert Eagle a `slide` and `hammer`; the revolver a `cylinder` and `hammer`; the double barrel `barrels` and a `top-lever`; the 870 and SPAS-12 a `pump`; the AK and AR a `charging-handle`; the P90 a `charging-handle` and `magazine`.

- The game draws each moving part on a layer of its own, with what's between them on layers that stay put (`../gunArt.ts`), so a part moves over what's drawn before it and under what's drawn after. How far and which way each moves is in the gun's stats (`GunStats.parts`: an offset, a turn or a shortening about a pivot, at the end of its stroke), and what moves it is its animations (`GunTracks.parts`, 0 to 1 of the stroke) or each shot (`GunStats.cycles`). The `magazine` is hidden while the magazine's out of the gun.
- Rounds you can see (the P90's, through its magazine) are a group with the id `rounds`, top-level or directly in a moving part, drawn full, with whatever comes after the last round (a follower) in it too. It has a `clip-path` of a single `rect`, the window they show through. The game draws them as a layer of their own, between what's before and after them in the part, and slides them along the gun as it empties, showing only what's in the window: `GunStats.rounds` says how many are drawn and how far they slide from full to empty. Whatever's at the end they slide toward (the P90's feed) is drawn after them, over the window's end, so rounds go under it.
- Whatever a moving part uncovers has to be drawn under it, hidden until it moves: the barrel, chamber and the frame's top and rails under a pistol's slide, the magazine tube under a pump (which shows along the barrel in front of it too), the cylinder's window in a revolver's frame and the channel its hammer comes forward in, the magazine well under the P90's magazine.
- A short comment above anything that isn't obvious says what it is.

## What's allowed

- Plain SVG: groups, `rect`, `circle`, `ellipse`, `path`, linear gradients and clip paths. No transforms, filters, text or embedded images, so coordinates are where things are.
- Colors are attributes (`fill="#2d2d2d"`), not CSS. Many shapes of one color can share a `fill` on their group.
- Gradient and clip ids start with the file's name and say what they're for (`ak-47-stock-wood`, `p90-round-shading`), so they don't clash when several guns share a document. Most gradients are the shading across a round part, top to bottom.
- A new gun's file has to be imported in `gunArt.ts`, and named by the gun's `art`.

## History

They were drawn in Affinity Designer (`assets/source/images/weapons/{pistols,rifles,shotguns}.afdesign`), exported, tidied by `bin/clean-svg.ts`, moved to millimeters about the origin, and then sorted into parts by hand, rendering the same as the export.
