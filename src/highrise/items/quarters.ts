// How many quarters a floor holds. They're all placed when the floor is
// generated, so it's known how much a floor can pay for: some in piles in
// closets, the rest carried by enemies and dropped when they die. First
// guesses; tune in playtest.

/** Every quarter on a floor, piles and enemies together */
export const QUARTERS_PER_FLOOR = 20;
/** Piles of quarters in closets, and how many quarters are in each */
export const QUARTER_PILES_PER_FLOOR = 2;
export const QUARTERS_PER_PILE = 4;
