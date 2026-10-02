import { V, V2d } from "../../core/Vector";
import { LayoutName } from "./arenaConfig";

type Segment = [[number, number], [number, number]];

/** A shape for the arena room, in meters with the top left corner at 0, 0 */
export interface ArenaLayout {
  width: number;
  height: number;
  /** Walls inside the room (the outside walls come with every layout) */
  walls: Segment[];
  /**
   * The gaps in the walls that are doorways, from one side to the other: with
   * the `doors` option there's a door in each, hinged at the first point
   */
  doorways: Segment[];
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
  doorways: [],
  walls: [],
  playerStart: V(5, 10),
  spawnArea: { center: V(26, 10), radius: 3 },
  edgeSpots: edgeSpots(30, 20),
};

const PILLARS: ArenaLayout = {
  width: 30,
  height: 20,
  doorways: [],
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
  doorways: [],
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
  doorways: [],
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

/**
 * A grid of `columns` by `rows` rooms filling `width` by `height`, with a
 * doorway `door` meters wide in every wall between two rooms: the walls, and
 * the doorways. The doorways sit a third or two thirds of the way along,
 * alternating, so they don't line up into corridors.
 */
function rooms(
  width: number,
  height: number,
  columns: number,
  rows: number,
  door: number = 1.4,
): { walls: Segment[]; doorways: Segment[] } {
  const walls: Segment[] = [];
  const doorways: Segment[] = [];
  const roomWidth = width / columns;
  const roomHeight = height / rows;
  // A wall from `from` to `to` along one axis, at `at` on the other, with a doorway
  const withDoor = (
    vertical: boolean,
    at: number,
    from: number,
    to: number,
    which: number,
  ) => {
    const middle = from + ((to - from) * (which % 2 === 0 ? 1 : 2)) / 3;
    const point = (along: number): [number, number] =>
      vertical ? [at, along] : [along, at];
    walls.push(
      [point(from), point(middle - door / 2)],
      [point(middle + door / 2), point(to)],
    );
    doorways.push([point(middle - door / 2), point(middle + door / 2)]);
  };
  for (let i = 1; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      withDoor(
        true,
        i * roomWidth,
        j * roomHeight,
        (j + 1) * roomHeight,
        i + j,
      );
    }
  }
  for (let j = 1; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      withDoor(
        false,
        j * roomHeight,
        i * roomWidth,
        (i + 1) * roomWidth,
        i + j,
      );
    }
  }
  return { walls, doorways };
}

/**
 * The hall's size, divided into rooms about the size of a floor's offices,
 * with doorways between them: as many walls near any one spot as on a real
 * floor, for stress testing what walls cost (shadows and vision; see
 * `tests/fire.benchmark.spec.ts`). The player starts in a room in the middle.
 */
const OFFICES: ArenaLayout = {
  width: 60,
  height: 40,
  ...rooms(60, 40, 9, 5),
  playerStart: V(30, 20),
  spawnArea: { center: V(56.5, 20), radius: 2 },
  edgeSpots: edgeSpots(60, 40),
};

/**
 * The offices sixteen times over: 240 by 160 meters of the same rooms, far
 * bigger than any floor, for stress testing how lighting holds up when the
 * level is huge and most of its walls are far from any light. The player
 * starts in a room in the middle.
 */
const SPRAWL: ArenaLayout = {
  width: 240,
  height: 160,
  ...rooms(240, 160, 36, 20),
  playerStart: V(123.3, 84),
  spawnArea: { center: V(236.5, 84), radius: 2 },
  edgeSpots: edgeSpots(240, 160),
};

export const ARENA_LAYOUTS: Record<LayoutName, ArenaLayout> = {
  open: OPEN,
  pillars: PILLARS,
  corridor: CORRIDOR,
  hall: HALL,
  offices: OFFICES,
  sprawl: SPRAWL,
};
