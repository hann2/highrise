# Long guns redrawn by a team of agents (plan, 2026-10-08)

As the pistols were (`notes/gun-art-pistols-plan.md`, and the `gun-art` skill's "A team of agents"), one agent per gun in its own worktree, the lead integrating. This time the first round is construction **and** drawing together (Simon: the base shapes are hard to judge before any shading is in): each agent blocks out, then draws and shades the side view, checks it region by region, and makes a materials options sheet before reporting.

| Generator (`bin/gun-art/guns/`) | Model | Finish | References (`assets/source/images/weapons/references/<name>/`) |
|---|---|---|---|
| `ak-47.ts` | AK-47, milled, wood furniture, steel magazine | blued steel, wood | `ak-47-worn.jpg` (main), `ak-47.jpg`, `model/` (3D) |
| `p90.ts` | FN P90, standard, ring sight | black polymer | `p90.webp` |
| `remington-870.ts` | Remington 870 Marine Magnum, 18" | nickel, black synthetic stock and pump | `remington-870-marine.jpeg` (main, small), `-black-and-wood.jpg`, `-tactical.jpg` (shapes, and skins later) |
| `spas-12.ts` | Franchi SPAS-12, **no stock** | black and parkerized gray | `spas-12-unfolded.jpg` (main), `spas-12-folded.webp`, `model/` (3D, stockless) |
| `double-barrel-shotgun.ts` | Sawn-off side-by-side, from a hammer coach gun | blued, case-hardened lock, walnut | `hammer-coach-gun.png` (main), `stoeger-coach-gun.png`, `old-hammerless.jpg`, `percussion-double.png` |
| `ar-15` | AR-15 | | No photos yet: starts when Simon adds them |

Simon wants gun skins someday (the 870's other finishes): keep each gun's colors as generator options, so a skin is a set of them.

Rounds: 1. construction + shaded side view + materials sheet; 2. polish; 3. top views (the P90's rounds window and the moving parts its art has now: pumps, charging handles, the double's barrels). Integration as for the pistols.
