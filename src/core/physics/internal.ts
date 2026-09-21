/**
 * Symbols for solver-internal properties on equations.
 * Import these only in solver code, not in game code.
 *
 * Using symbols hides these properties from autocomplete,
 * making the public API cleaner and more focused.
 */

// Equation solver internals
export const EQ_B = Symbol("B");
export const EQ_INV_C = Symbol("invC");
export const EQ_LAMBDA = Symbol("lambda");
export const EQ_MAX_FORCE_DT = Symbol("maxForceDt");
export const EQ_MIN_FORCE_DT = Symbol("minForceDt");

// Workspace index slots: which row of the SolverWorkspace per-body arrays
// this equation's bodies occupy for the current solve. Assigned once during
// setup via Equation.assignIndices(), read on every iteration.
export const EQ_INDEX_A = Symbol("indexA");
export const EQ_INDEX_B = Symbol("indexB");
export const EQ_INDEX_C = Symbol("indexC");

/**
 * Per-equation slot index into the workspace's flat Bs/invCs/lambda arrays.
 * Assigned once during prepareSolverStep, read on every iteration. Independent
 * of an equation's position in any group array, so equations can be partitioned
 * into per-kind groups without rewriting the slot mapping.
 */
export const EQ_SLOT = Symbol("eqSlot");
