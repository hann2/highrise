import Level1 from "./lvl1";
import Level2 from "./lvl2";

export function buildLevel(levelIndex: number) {
  switch (levelIndex) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
  }
  throw new Error("Level " + levelIndex + " does not exist");
}
