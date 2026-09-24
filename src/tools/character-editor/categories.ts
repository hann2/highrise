import { CharacterSoundClass } from "../../highrise/characters/CharacterData";

/** What each category is called in the editor, and when the game plays it */
export const CATEGORY_INFO: Record<
  CharacterSoundClass,
  { label: string; when: string }
> = {
  joinParty: {
    label: "Join party",
    when: "A survivor joins the party.",
  },
  newLevel: {
    label: "New floor",
    when: "Two seconds into a floor, from someone in the party (this or Misc). In the lobby, on being picked if they have no Misc lines.",
  },
  misc: {
    label: "Misc",
    when: "Two seconds into a floor, from someone in the party (this or New floor). In the lobby, on being picked.",
  },
  lookHere: {
    label: "Look here",
    when: "Nothing plays these yet.",
  },
  pickupGun: {
    label: "Pick up gun",
    when: "Half a second after picking up a gun.",
  },
  pickupMelee: {
    label: "Pick up melee",
    when: "Half a second after picking up a melee weapon.",
  },
  pickupHealth: {
    label: "Pick up health",
    when: "On picking up health.",
  },
  pickupItem: {
    label: "Pick up item",
    when: "Nothing plays these yet.",
  },
  taunts: {
    label: "Taunts",
    when: "After a kill by a party member, one time in five, half a second later.",
  },
  worried: {
    label: "Worried",
    when: "Nothing plays these yet.",
  },
  hurt: {
    label: "Hurt",
    when: "Taking damage with 30 HP or more left. Doesn't interrupt a line already playing.",
  },
  nearDeath: {
    label: "Near death",
    when: "Taking damage with under 30 HP left. Interrupts whatever they were saying.",
  },
  death: {
    label: "Death",
    when: "Dying. Interrupts whatever they were saying.",
  },
  relief: {
    label: "Relief",
    when: "Reaching the exit stairwell at the end of a floor: every rescued survivor says one, one after another, or the leader if nobody was rescued.",
  },
};
