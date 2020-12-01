import Game from "../../../core/Game";
import Party from "../../entities/Party";
import Level from "./Level";
import Level1 from "./lvl1";
import Level2 from "./lvl2";

export const goToNextLevel = (game: Game) => {
  const oldLevel = [...game.entities.all].filter(
    (e) => e instanceof Level
  )[0] as Level;
  const party = [...game.entities.all].filter(
    (e) => e instanceof Party
  )[0] as Party;
  const newLevelIndex = oldLevel.index + 1;
  const newLevel = buildLevel(newLevelIndex);
  newLevel.placeEntities(party);
  game.addEntity(newLevel);
  oldLevel?.destroy();
};

const buildLevel = (levelIndex: number) => {
  switch (levelIndex) {
    case 1:
      return new Level1();
    case 2:
      return new Level2();
  }
  throw new Error("Level " + levelIndex + " does not exist");
};
