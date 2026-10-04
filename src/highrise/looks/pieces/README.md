# Pieces

Hand-drawn SVGs a look can wear, for things the generator doesn't draw:
`head/` for hats, headphones, masks; `torso/` for badges, armor, wings. A
look lists them in `pieces` (the character editor's Appearance tab has them
under "Pieces"), each with a color and an optional secondary color.

How to draw one (in Affinity or anything else that saves SVG):

- Start from `assets/source/pieces/head-template.svg` or `torso-template.svg`.
  1 unit is 1 mm, the middle of the page is the middle of the head or body,
  and the front is to the right (+x).
- Keep the `guide` layer if you like; it's taken out when the piece is drawn.
- `#ff00ff` (magenta) is replaced by the piece's color and `#00ffff` (cyan) by
  its secondary color, so a piece can be any color. Other colors stay as
  they are.
- Head pieces are drawn over everything else on the head (hair, hats);
  torso pieces over the clothes. They're drawn as they are, with no outline
  or shading added, so draw those in if you want them.
- The file name (without `.svg`) is the piece's name.

`npx tsx bin/look-sheet.ts` shows how it looks on everyone that wears it.
