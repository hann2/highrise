import { V, V2d } from "../../core/Vector";
import { LayoutName } from "./arenaConfig";

type Segment = [[number, number], [number, number]];

/** A shape for the arena room, in meters with the top left corner at 0, 0 */
export interface ArenaLayout {
  width: number;
  height: number;
  /** Walls inside the room (the outside walls come with every layout) */
  walls: Segment[];
  /** Where the player starts */
  playerStart: V2d;
  /** The far end, where waves come from when they come together or trickle in */
  spawnArea: { center: V2d; radius: number };
  /** Spots all around the edge that are clear of walls, for surrounding waves */
  edgeSpots: V2d[];
}

/** The four sides of a square pillar of `size` meters centered on `x`, `y` */
function pillar(x: number, y: number, size: number = 1.2): Segment[] {
  const h = size / 2;
  return [
    [
      [x - h, y - h],
      [x + h, y - h],
    ],
    [
      [x + h, y - h],
      [x + h, y + h],
    ],
    [
      [x + h, y + h],
      [x - h, y + h],
    ],
    [
      [x - h, y + h],
      [x - h, y - h],
    ],
  ];
}

/** Spots every `spacing` meters around a rectangle `inset` meters in from the walls */
function edgeSpots(
  width: number,
  height: number,
  inset: number = 1,
  spacing: number = 2,
): V2d[] {
  const spots: V2d[] = [];
  for (let x = inset; x <= width - inset; x += spacing) {
    spots.push(V(x, inset), V(x, height - inset));
  }
  for (let y = inset + spacing; y < height - inset; y += spacing) {
    spots.push(V(inset, y), V(width - inset, y));
  }
  return spots;
}

const OPEN: ArenaLayout = {
  width: 30,
  height: 20,
  walls: [],
  playerStart: V(5, 10),
  spawnArea: { center: V(26, 10), radius: 3 },
  edgeSpots: edgeSpots(30, 20),
};

const PILLARS: ArenaLayout = {
  width: 30,
  height: 20,
  walls: [
    ...pillar(10, 5),
    ...pillar(10, 15),
    ...pillar(15, 10),
    ...pillar(20, 5),
    ...pillar(20, 15),
    // A bit of low cover in front of the player
    [
      [8, 8.5],
      [8, 11.5],
    ],
  ],
  playerStart: V(5, 10),
  spawnArea: { center: V(26, 10), radius: 3 },
  edgeSpots: edgeSpots(30, 20),
};

/**
 * A 3 m wide hallway out of the player's room, for testing choke points. The
 * far room is where waves gather.
 */
const CORRIDOR: ArenaLayout = {
  width: 36,
  height: 16,
  walls: [
    // The player's room ends at x = 10, the far room starts at x = 26
    [
      [10, 0],
      [10, 6.5],
    ],
    [
      [10, 9.5],
      [10, 16],
    ],
    [
      [26, 0],
      [26, 6.5],
    ],
    [
      [26, 9.5],
      [26, 16],
    ],
    // The hallway between them
    [
      [10, 6.5],
      [26, 6.5],
    ],
    [
      [10, 9.5],
      [26, 9.5],
    ],
  ],
  playerStart: V(4, 8),
  spawnArea: { center: V(31, 8), radius: 3 },
  // Only the player's room: its walls, and the mouth of the hallway
  edgeSpots: edgeSpots(10, 16),
};

/**
 * A big room with pillars scattered around it, with the player in the middle:
 * room for hundreds of enemies, for stress testing (see
 * `tests/enemies.benchmark.spec.ts`)
 */
const HALL: ArenaLayout = {
  width: 60,
  height: 40,
  walls: [
    ...pillar(12, 8),
    ...pillar(24, 12),
    ...pillar(36, 8),
    ...pillar(48, 12),
    ...pillar(12, 32),
    ...pillar(24, 28),
    ...pillar(36, 32),
    ...pillar(48, 28),
    ...pillar(8, 20),
    ...pillar(52, 20),
  ],
  playerStart: V(30, 20),
  spawnArea: { center: V(55, 20), radius: 4 },
  edgeSpots: edgeSpots(60, 40),
};

export const ARENA_LAYOUTS: Record<LayoutName, ArenaLayout> = {
  open: OPEN,
  pillars: PILLARS,
  corridor: CORRIDOR,
  hall: HALL,
};
