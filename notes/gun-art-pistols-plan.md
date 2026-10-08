# Pistols redrawn by a team of agents (plan, 2026-10-07; done)

**Done 2026-10-07**: all four drawn (side views and top views), in the game at true scale, the materials in `bin/gun-art/lib/style.ts`, and what we learned in the `gun-art` skill ("A team of agents"). The plan as it was:

Redraw the four pistols still on old art, each by its own agent following the `gun-art` skill (`.claude/skills/gun-art/SKILL.md`), the way the M1911 was drawn (`bin/gun-art/guns/m1911.ts` is the worked example). Claude (the lead, in the main session) sets up, reviews, and integrates; Simon reviews one combined sheet per round.

## The guns

| Generator (`bin/gun-art/guns/`) | Model | Finish | Photos (`assets/source/images/weapons/references/<name>/`) | Replaces |
|---|---|---|---|---|
| `glock.ts` | Glock 19 | black polymer frame, black slide | `glock-19.webp`, `glock-19-alternate.jpg` (from behind) | `glock-pickup.png`; top `art/glock.svg` |
| `five-seven.ts` | FN Five-seven **MK3** (its features read better at game scale) | **FDE** (flat dark earth) frame and slide | `five-seven-mk3.webp` (with a red dot, drawn without), `-alternate.webp`, `-alternate-2.webp` | `five-seven-pickup.png`; top `art/five-seven.svg` |
| `desert-eagle.ts` | Desert Eagle (.50 AE) | **polished stainless**, very shiny | `desert-eagle.png`, `desert-eagle-alternate.jpg` | `desert-eagle-pickup.png`; top `art/desert-eagle.svg` |
| `revolver.ts` | S&W Model 629, 8⅜" tapered barrel (not the Classic's full underlug), its left side mirrored | **polished stainless**, very shiny | `sw-629.jpg` (an 8⅜" from its left side; `sw-629-mirrored.jpg` is it flipped to draw over), `sw-629-alternate.jpg`, `sw-629-rosewood-grip.jpg` (a Classic from the right) | `magnum-pickup.png` (the pickup becomes `revolverPickup`); top `art/revolver.svg` |

All four have photos (2026-10-07). The M1911's photos are the model for what each needs.

## Setup (lead, before any agent starts)

1. ~~Sort the loose photos into `references/<name>/` folders, and look at each: which side, how straight, what it shows. Note any that won't do.~~ Done
2. ~~Shared style, so ten hands draw one set: move the M1911's colors into `bin/gun-art/lib/style.ts` (blued steel, polished stainless, black polymer, FDE polymer, the barrel's polish, walnut) for every generator to import.~~ Done
3. ~~A stub generator per gun (`guns/<name>.ts`, photo list and scale only, an empty drawing) registered in `guns/index.ts`, so the agents never touch shared files and the CLI finds their gun from the start.~~ Done: each is a `draft` (built into `tests/output/gun-art/`, skipped by the tests) until it's integrated.
4. Commit that on master; each agent then works in its own worktree off it.

## The agents

One per gun (the Agent tool with `isolation: "worktree"`, running in the background; or a Workflow, which Simon has to ask for with "use a workflow"). Each brief: the gun row above, the skill, the M1911 as the example, and these rules:

- Write only `bin/gun-art/guns/<name>.ts` (and images in `tests/output/gun-art/`). Not the stats, the manifest, `IMAGE_SOURCES.md` or other guns: the lead integrates.
- Follow the skill: construction pass first, measure don't eyeball, smooth splines and true arcs, region-by-region self-critique with `grid` before reporting.
- Report back: what you did, image paths, construction notes, and questions for Simon. Stop at the end of each round and wait.

Continue each agent with SendMessage between rounds, so it keeps its context.

## Rounds (Simon sees one combined sheet per round)

1. **Construction**: each agent grids its photos, writes up how its gun is built (parts, layers, planes, what's flush or proud, true shapes), finds the real dimensions, and blocks out the side view's silhouette. Lead: a sheet with every gun's photo, notes and blockout, plus all the questions in one list.
2. **Drawing**: the side views, drawn and self-checked region by region, plus a materials options sheet (the Five-seven's FDE, the stainless's shine, the Glock's blacks). Lead: one sheet with every pistol beside its photo, the four (and the M1911) side by side at 128 px on white and on the floor's dark, to check they read as one set; Simon picks materials.
3. **Polish**: Simon's notes on the side views, one or two rounds.
4. **Top views**: at real scale, from the side views' numbers, with registered photos from above where there are any, and the moving parts the guns have now (slides; the Desert Eagle's hammer; the revolver's cylinder and hammer, whose window and open cylinder need drawing). Same review rhythm.

## Integration (lead, one gun at a time)

Merge each agent's branch; per gun: `build`, regenerate the manifest, delete the old pickup PNG, the stats (`textures.pickup`, `size` = the pickup's square, `art`, `points`, `parts`, `muzzleLength`), a row in `assets/IMAGE_SOURCES.md`. Then `npm run test:gun-art`, `npm run tsc`, `npm test`, and rig clips of each pistol firing and reloading (the shared pistol reload and the revolver's own animations are keyed to the points, so check the hands land right at real scale). Copy the reference photos into the main checkout if the worktrees had them.

## Open

- ~~The revolver: its photos are of an 8⅜" barrel, and of its left side.~~ Simon: the 8⅜" (the only photos with the tapered shroud), and the left side, mirrored.
- Top views this round, or pickups only first? (The plan above does both, pickups first.)
