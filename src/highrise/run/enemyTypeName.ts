import { BaseEnemy } from "../enemies/base/Enemy";
import Crawler from "../enemies/crawler/Crawler";
import Heavy from "../enemies/heavy/Heavy";
import Necromancer from "../enemies/necromancer/Necromancer";
import Spitter from "../enemies/spitter/Spitter";
import Sprinter from "../enemies/sprinter/Sprinter";
import Zombie from "../enemies/zombie/Zombie";

// Class names are minified in production builds, so enemies get explicit names
const ENEMY_TYPE_NAMES: [abstract new (...args: any[]) => BaseEnemy, string][] =
  [
    [Crawler, "Crawler"],
    [Sprinter, "Sprinter"],
    [Heavy, "Heavy"],
    [Spitter, "Spitter"],
    [Necromancer, "Necromancer"],
    [Zombie, "Zombie"],
  ];

/** A player-facing name for the kind of enemy, like "Crawler". */
export function enemyTypeName(enemy: BaseEnemy): string {
  for (const [constructor, name] of ENEMY_TYPE_NAMES) {
    if (enemy instanceof constructor) {
      return name;
    }
  }
  return "Zombie";
}
