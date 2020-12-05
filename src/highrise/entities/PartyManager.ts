import BaseEntity from "../../core/entity/BaseEntity";
import Entity from "../../core/entity/Entity";
import { choose } from "../../core/util/Random";
import { V2d } from "../../core/Vector";
import AK47 from "./guns/AK-47";
import Gun from "./guns/Gun";
import { GUNS } from "./guns/Guns";
import Human from "./human/Human";

interface PartyEvent {
  human: Human;
}

export default class PartyManager extends BaseEntity implements Entity {
  id = "party_manager";

  partyMembers: Human[] = [];
  leader!: Human;

  handlers = {
    newGame: () => {},
  };

  reset() {
    this.partyMembers = [];
    this.leader = this.game!.addEntity(new Human());
    this.leader.giveWeapon(new (choose(...GUNS))());
  }

  respawn(spawnLocations: V2d[]) {
    this.partyMembers.forEach((partyMember, i) => {
      partyMember.setPosition(spawnLocations[i]);
    });
  }
}
