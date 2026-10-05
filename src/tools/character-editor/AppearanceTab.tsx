import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { makeRandom } from "../../core/util/Random";
import {
  BodyLook,
  Build,
  DEFAULT_LOOK,
  EYE_COLOR,
  Extra,
  Zombification,
} from "../../highrise/looks/BodyLook";
import { composeBodySvg, svgDataUrl } from "../../highrise/looks/composeBody";
import { BODY_LAYERS, BodyLayer } from "../../highrise/looks/drawBody";
import { pantsCoverage } from "../../highrise/looks/parts/legs";
import { sleeveColor } from "../../highrise/looks/parts/limbs";
import { randomLook } from "../../highrise/looks/randomLook";
import { pieceNames, piecePlace } from "../../highrise/looks/pieces";
import { PlayerStats } from "../../highrise/human/PlayerStats";
import {
  PREVIEW_MODES,
  PreviewMode,
  PreviewShow,
} from "../../highrise/rig/previewMessages";
import {
  ColorField,
  Field,
  Group,
  Picker,
  Segmented,
  Slider,
  Swatch,
  Toggle,
} from "./controls";
import {
  capitalize,
  COLLARED,
  CUT_OPTIONS,
  EXTRA_OPTIONS,
  EYE_PRESETS,
  GLASSES_OPTIONS,
  HAIR_PRESETS,
  HAIRLINE_OPTIONS,
  HAT_OPTIONS,
  PANTS_OPTIONS,
  PATTERN_OPTIONS,
  SHOE_OPTIONS,
  SKIN_PRESETS,
  SNEAKERS,
  TOP_OPTIONS,
  TOP_SECONDARY,
  withHat,
} from "./lookOptions";
import { thumbnailUrl } from "./thumbnails";
import { tip } from "./tooltips";

/** Sets one of the look's settings; changes to the same one close together are one step of undo */
type SetLook = <K extends keyof BodyLook>(key: K, value: BodyLook[K]) => void;

interface SectionProps {
  look: BodyLook;
  set: SetLook;
}

/**
 * The look's settings in sections, one showing at a time beside the
 * preview: `keys` are the look's settings each holds (for the unsaved dot),
 * `shuffle` the ones its shuffle button picks at random.
 */
const SECTIONS = [
  { id: "body", label: "Body", keys: ["skin", "build"] },
  { id: "face", label: "Face", keys: ["eyes", "brows", "beard"] },
  { id: "hair", label: "Hair", keys: ["hair"] },
  { id: "top", label: "Top", keys: ["top", "sleeves", "gloves"] },
  {
    id: "legs",
    label: "Legs & feet",
    keys: [
      "pantsStyle",
      "pants",
      "pantsLength",
      "pantsTrim",
      "shoeStyle",
      "shoes",
      "shoeTrim",
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    keys: ["hat", "glasses", "extras", "pieces"],
    // A random look has no pieces, so shuffling leaves them be
    shuffle: ["hat", "glasses", "extras"],
  },
] as const satisfies {
  id: string;
  label: string;
  keys: (keyof BodyLook)[];
  shuffle?: (keyof BodyLook)[];
}[];
type SectionId = (typeof SECTIONS)[number]["id"];

/** Where the section showing is remembered */
const SECTION_KEY = "characterEditorAppearanceSection";

const ZOMBIE_PREVIEW: Zombification = { rot: 0.8, blood: 0.6, tears: 0.6 };

/**
 * Everything about how a character looks, with a live preview: the game
 * itself, and stills drawn by the same generator. Changes go into the
 * character's draft, which the save bar saves, reverts, undoes and redoes.
 */
export function AppearanceTab({
  look,
  savedLook,
  startingWeapons,
  stats,
  onChange,
}: {
  look: BodyLook;
  /** As it's saved, to mark the sections with unsaved changes */
  savedLook: BodyLook;
  /** For the game preview, which can show them holding the first */
  startingWeapons: string[];
  stats: Partial<PlayerStats>;
  /** `group`: changes to the same thing close together are one step of undo */
  onChange: (look: BodyLook, group?: string) => void;
}) {
  const [section, setSection] = useState<SectionId>(() => {
    try {
      const saved = localStorage.getItem(SECTION_KEY);
      return SECTIONS.find((s) => s.id === saved)?.id ?? "body";
    } catch {
      return "body";
    }
  });
  const chooseSection = (next: SectionId) => {
    setSection(next);
    try {
      localStorage.setItem(SECTION_KEY, next);
    } catch {}
  };
  const [zombify, setZombify] = useState(false);
  const [zombie, setZombie] = useState(ZOMBIE_PREVIEW);
  const [hidden, toggleLayer] = useHiddenLayers();

  // Each press of a button is its own step of undo
  const once = (next: BodyLook) => onChange(next, `once-${Date.now()}`);
  const set: SetLook = (key, value) => onChange({ ...look, [key]: value }, key);
  const shuffle = (keys: readonly (keyof BodyLook)[]) => {
    const random = randomLook(makeRandom(Date.now()), false);
    const next: Record<string, unknown> = { ...look };
    for (const key of keys) {
      next[key] = random[key];
    }
    once(next as unknown as BodyLook);
  };

  const preview = zombify ? { ...look, zombie } : look;
  const current = SECTIONS.find((s) => s.id === section)!;
  const unsaved = (keys: readonly (keyof BodyLook)[]) =>
    keys.some(
      (key) => JSON.stringify(look[key]) !== JSON.stringify(savedLook[key]),
    );
  const props = { look, set };

  return (
    <div class="appearance">
      <aside class="appearance__preview">
        <GamePreview
          look={preview}
          startingWeapons={startingWeapons}
          stats={stats}
          hidden={hidden}
        />
        <div class="preview-options">
          <LayerToggles hidden={hidden} onToggle={toggleLayer} />
          <div class="preview-options__row">
            <label
              class="preview-options__zombie"
              {...tip(
                "Shows them as a zombie would look, without changing the look",
              )}
            >
              <span class="switch">
                <input
                  type="checkbox"
                  checked={zombify}
                  onChange={(e) =>
                    setZombify((e.target as HTMLInputElement).checked)
                  }
                />
                <span />
              </span>
              As a zombie
            </label>
            <button
              class="small-button"
              {...tip(
                "Draws the random details again: ragged edges, and where rips and blood go. Undo brings the old ones back",
                "New details",
              )}
              onClick={() =>
                once({ ...look, seed: Math.floor(Math.random() * 1e6) })
              }
            >
              ↻ New details
            </button>
          </div>
          {zombify && (
            <div class="preview-options__zombie-sliders">
              {(
                [
                  [
                    "rot",
                    "Rot",
                    "Greener, greyer, blotchier skin; thinner hair",
                  ],
                  ["blood", "Blood", undefined],
                  ["tears", "Rips", "Rips in the clothes"],
                ] as const
              ).map(([key, label, about]) => (
                <Slider
                  key={key}
                  label={label}
                  tip={about}
                  value={zombie[key]}
                  onChange={(value) => setZombie({ ...zombie, [key]: value })}
                />
              ))}
            </div>
          )}
        </div>
        <Stills
          look={preview}
          hidden={hidden}
          closeUp={
            section === "face"
              ? "face"
              : section === "hair"
                ? "head"
                : undefined
          }
        />
      </aside>

      <div class="appearance__controls">
        <div class="sections">
          <nav class="sections__tabs">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                class={s.id === section ? "is-selected" : ""}
                onClick={() => chooseSection(s.id)}
              >
                {s.label}
                {unsaved(s.keys) && (
                  <span class="unsaved-dot" {...tip("Unsaved changes")} />
                )}
              </button>
            ))}
          </nav>
          <div class="sections__actions">
            <button
              {...tip(
                `Picks the ${current.label.toLowerCase()} at random and leaves the rest. Undo brings this back`,
              )}
              onClick={() =>
                shuffle("shuffle" in current ? current.shuffle : current.keys)
              }
            >
              <Dice /> Shuffle {current.label.toLowerCase()}
            </button>
            <button
              {...tip(
                "A whole new random look, like a zombie's. Undo brings this one back",
              )}
              onClick={() =>
                once({
                  ...randomLook(makeRandom(Date.now()), false),
                  pieces: look.pieces,
                  seed: look.seed,
                })
              }
            >
              <Dice /> Shuffle all
            </button>
          </div>
        </div>
        <div class="groups">
          {section === "body" && <BodySection {...props} />}
          {section === "face" && <FaceSection {...props} />}
          {section === "hair" && <HairSection {...props} />}
          {section === "top" && <TopSection {...props} />}
          {section === "legs" && <LegsSection {...props} />}
          {section === "accessories" && <AccessoriesSection {...props} />}
        </div>
      </div>
    </div>
  );
}

function BodySection({ look, set }: SectionProps) {
  const build = (
    key: keyof Build,
    label: string,
    ends: [string, string],
    about?: string,
  ) => (
    <Slider
      label={label}
      tip={about}
      ends={ends}
      value={look.build[key]}
      // Nothing below 0 for these
      min={key === "belly" || key === "bust" ? 0 : -1}
      reset={0}
      onChange={(value) => set("build", { ...look.build, [key]: value })}
    />
  );
  return (
    <>
      <Group title="Skin and head">
        <ColorField
          label="Skin"
          value={look.skin}
          presets={SKIN_PRESETS}
          onChange={(color) => color && set("skin", color)}
        />
        {build("head", "Head", ["small", "big"])}
      </Group>
      <Group title="Frame">
        {build("shoulders", "Shoulders", ["narrow", "broad"])}
        {build("squareness", "Shoulder shape", ["round", "square"])}
        {build("chest", "Chest", ["flat", "deep"], "How far it comes forward")}
        {build(
          "hunch",
          "Hunch",
          ["upright", "hunched"],
          "Shoulders rolled forward",
        )}
      </Group>
      <Group title="Figure">
        {build("belly", "Belly", ["none", "big"])}
        {build("bust", "Bust", ["none", "big"])}
      </Group>
      <Group title="Limbs">
        {build("arms", "Arms", ["thin", "thick"])}
        {build("hands", "Hands", ["small", "big"])}
        {build("legs", "Legs", ["thin", "thick"])}
        {build("feet", "Feet", ["small", "big"], "And so their shoes")}
      </Group>
    </>
  );
}

function FaceSection({ look, set }: SectionProps) {
  const brows = look.brows;
  return (
    <>
      <Group title="Eyes">
        <ColorField
          label="Color"
          value={look.eyes ?? EYE_COLOR}
          presets={EYE_PRESETS}
          onChange={(color) => set("eyes", color)}
        />
      </Group>
      <Group title="Brows">
        <Slider
          label="Thickness"
          ends={["thin", "bushy"]}
          value={brows.bushiness}
          reset={DEFAULT_LOOK.brows.bushiness}
          onChange={(bushiness) => set("brows", { ...brows, bushiness })}
        />
        <Slider
          label="Arch"
          ends={["straight", "arched"]}
          value={brows.arch}
          reset={DEFAULT_LOOK.brows.arch}
          onChange={(arch) => set("brows", { ...brows, arch })}
        />
        <Slider
          label="Tilt"
          tip="Sloping down to the middle looks cross; up to it, worried"
          ends={["cross", "worried"]}
          value={brows.tilt}
          min={-1}
          reset={0}
          onChange={(tilt) => set("brows", { ...brows, tilt })}
        />
        <ColorField
          label="Color"
          value={brows.color}
          inherit={{ label: "Hair color, darker", color: look.hair.color }}
          tip="Left to follow the hair, they're a little darker than it"
          onChange={(color) => set("brows", { ...brows, color })}
        />
      </Group>
      <Group title="Beard">
        <Toggle
          label="Beard"
          on={!!look.beard}
          onChange={(on) => set("beard", on ? { length: 0.3 } : undefined)}
        />
        {look.beard && (
          <>
            <Slider
              label="Length"
              tip="How far it sticks out in front"
              ends={["stubbly", "long"]}
              value={look.beard.length}
              onChange={(length) => set("beard", { ...look.beard!, length })}
            />
            <ColorField
              label="Color"
              value={look.beard.color}
              inherit={{ label: "Same as hair", color: look.hair.color }}
              onChange={(color) => set("beard", { ...look.beard!, color })}
            />
          </>
        )}
      </Group>
    </>
  );
}

function HairSection({ look, set }: SectionProps) {
  const hair = look.hair;
  const setHair = (changes: Partial<typeof hair>) =>
    set("hair", { ...hair, ...changes });
  const bald = hair.coverage <= 0;
  // What only hair that's grown has
  const notGrown = bald
    ? "Not when they're bald: turn Coverage up"
    : hair.cut === "buzz"
      ? "Not with a buzz cut"
      : hair.cut === "stubble"
        ? "Not with stubble"
        : undefined;
  const slider = (
    key:
      | "volume"
      | "length"
      | "curls"
      | "messiness"
      | "bun"
      | "ponytail"
      | "mohawk",
    label: string,
    ends: [string, string],
    about?: string,
  ) => (
    <Slider
      label={label}
      tip={about}
      ends={ends}
      value={hair[key]}
      reset={DEFAULT_LOOK.hair[key]}
      disabled={notGrown}
      onChange={(value) => setHair({ [key]: value })}
    />
  );
  return (
    <>
      <Group title="Color and cut">
        <ColorField
          label="Color"
          value={hair.color}
          presets={HAIR_PRESETS}
          onChange={(color) => color && setHair({ color })}
        />
        <Field label="Cut">
          <Picker
            look={look}
            kind="head"
            options={CUT_OPTIONS}
            selected={(cut) => (hair.cut ?? "") === cut}
            vary={(l, cut) => ({
              ...l,
              hair: { ...l.hair, cut: cut || undefined },
            })}
            onPick={(cut) => setHair({ cut: cut || undefined })}
          />
        </Field>
      </Group>
      <Group title="Hairline">
        <Field label="Shape">
          <Picker
            look={look}
            kind="face"
            options={HAIRLINE_OPTIONS}
            selected={(hairline) => hair.hairline === hairline}
            vary={(l, hairline) => ({ ...l, hair: { ...l.hair, hairline } })}
            onPick={(hairline) => setHair({ hairline })}
          />
        </Field>
        <Slider
          label="Coverage"
          tip="How far forward the hair comes. All the way down is bald"
          ends={["bald", "full"]}
          value={hair.coverage}
          reset={DEFAULT_LOOK.hair.coverage}
          onChange={(coverage) => setHair({ coverage })}
        />
        <Slider
          label="Middle"
          tip="The middle of the hairline, against its sides"
          ends={["forward", "back"]}
          value={hair.fringe}
          min={-1}
          reset={DEFAULT_LOOK.hair.fringe}
          disabled={bald ? "Not when they're bald" : undefined}
          onChange={(fringe) => setHair({ fringe })}
        />
        <Slider
          label="Balding"
          tip="Bald on top, from the crown forward"
          ends={["none", "only the sides"]}
          value={hair.balding}
          reset={0}
          disabled={bald ? "They're bald already" : undefined}
          onChange={(balding) => setHair({ balding })}
        />
        <Toggle
          label="Parting"
          on={hair.part !== undefined}
          onChange={(on) => setHair({ part: on ? -0.4 : undefined })}
        />
        {hair.part !== undefined && (
          <Slider
            label="Parted at"
            ends={["left", "right"]}
            value={hair.part}
            min={-1}
            onChange={(part) => setHair({ part })}
          />
        )}
      </Group>
      <Group title="Length and body">
        {slider(
          "length",
          "Length",
          ["short", "long"],
          "How far it hangs down the back",
        )}
        {slider(
          "volume",
          "Volume",
          ["flat", "big"],
          "How much it stands out from the head",
        )}
        {slider("curls", "Curls", ["straight", "afro"])}
        {slider(
          "messiness",
          "Messiness",
          ["neat", "messy"],
          "How uneven its edge is",
        )}
      </Group>
      <Group title="Tied and shaved">
        {slider("bun", "Bun", ["none", "big"])}
        {slider("ponytail", "Ponytail", ["none", "long"])}
        {slider(
          "mohawk",
          "Mohawk",
          ["none", "wide"],
          "Shaved but for a strip down the middle this wide",
        )}
      </Group>
    </>
  );
}

function TopSection({ look, set }: SectionProps) {
  const top = look.top;
  const secondary = TOP_SECONDARY[top.style];
  const sleevesFollow =
    top.style === "tank"
      ? "Bare arms"
      : top.style === "vest" || top.style === "overalls"
        ? "Same as shirt"
        : "Same as top";
  return (
    <>
      <Group title="Top" wide>
        <Picker
          look={look}
          kind="torso"
          options={TOP_OPTIONS}
          selected={(style) => top.style === style}
          vary={(l, style) => ({ ...l, top: { ...l.top, style } })}
          onPick={(style) => set("top", { ...top, style })}
        />
        <ColorField
          label="Color"
          value={top.color}
          onChange={(color) => color && set("top", { ...top, color })}
        />
        {secondary && (
          <ColorField
            label={secondary[0]}
            tip={secondary[1]}
            value={top.secondary}
            onChange={(color) =>
              color && set("top", { ...top, secondary: color })
            }
          />
        )}
        {COLLARED.includes(top.style) && (
          <Toggle
            label="Popped collar"
            tip="Turned up round the neck"
            on={!!top.popped}
            onChange={(popped) =>
              set("top", { ...top, popped: popped || undefined })
            }
          />
        )}
      </Group>
      <Group title="Pattern">
        <Picker
          look={look}
          kind="torso"
          options={PATTERN_OPTIONS}
          selected={(kind) => (top.pattern?.kind ?? "") === kind}
          vary={(l, kind) => ({
            ...l,
            top: {
              ...l.top,
              pattern: kind
                ? { kind, color: l.top.pattern?.color ?? "#ffffff" }
                : undefined,
            },
          })}
          onPick={(kind) =>
            set("top", {
              ...top,
              pattern: kind
                ? { kind, color: top.pattern?.color ?? "#ffffff" }
                : undefined,
            })
          }
        />
        {top.pattern && (
          <ColorField
            label="Color"
            value={top.pattern.color}
            onChange={(color) =>
              color &&
              set("top", { ...top, pattern: { ...top.pattern!, color } })
            }
          />
        )}
      </Group>
      <Group title="Sleeves and gloves">
        <Slider
          label="Sleeves"
          ends={["none", "to the wrist"]}
          value={look.sleeves.length}
          onChange={(length) => set("sleeves", { ...look.sleeves, length })}
        />
        <ColorField
          label="Sleeve color"
          value={look.sleeves.color}
          inherit={{
            label: sleevesFollow,
            color: sleeveColor({
              ...look,
              sleeves: { ...look.sleeves, color: undefined },
            }),
          }}
          onChange={(color) => set("sleeves", { ...look.sleeves, color })}
        />
        <Toggle
          label="Cuffs"
          tip="A band round the end of each sleeve"
          on={look.sleeves.cuff !== undefined}
          onChange={(on) =>
            set("sleeves", {
              ...look.sleeves,
              cuff: on ? "#ffffff" : undefined,
            })
          }
        >
          <Swatch
            label="Cuffs"
            value={look.sleeves.cuff ?? "#ffffff"}
            onChange={(cuff) => set("sleeves", { ...look.sleeves, cuff })}
          />
        </Toggle>
        <Toggle
          label="Gloves"
          on={look.gloves !== undefined}
          onChange={(on) => set("gloves", on ? "#2a2a2a" : undefined)}
        >
          <Swatch
            label="Gloves"
            value={look.gloves ?? "#2a2a2a"}
            onChange={(gloves) => set("gloves", gloves)}
          />
        </Toggle>
      </Group>
    </>
  );
}

function LegsSection({ look, set }: SectionProps) {
  const style = look.pantsStyle;
  return (
    <>
      <Group title="Legs">
        <Picker
          look={look}
          kind="legs"
          options={PANTS_OPTIONS}
          selected={(s) => style === s}
          vary={(l, pantsStyle) => ({ ...l, pantsStyle })}
          onPick={(pantsStyle) => set("pantsStyle", pantsStyle)}
        />
        <ColorField
          label="Color"
          value={look.pants}
          onChange={(color) => color && set("pants", color)}
        />
        {(style === "shorts" || style === "skirt") && (
          <Slider
            label="Length"
            ends={["hip", "ankle"]}
            value={pantsCoverage(look)}
            reset={pantsCoverage({ ...look, pantsLength: undefined })}
            onChange={(length) => set("pantsLength", length)}
          />
        )}
        {style === "trackpants" && (
          <ColorField
            label="Stripes"
            value={look.pantsTrim}
            inherit={{ label: "White", color: "#f2f2ee" }}
            onChange={(color) => set("pantsTrim", color)}
          />
        )}
      </Group>
      <Group title="Feet">
        <Picker
          look={look}
          kind="feet"
          options={SHOE_OPTIONS}
          selected={(s) => look.shoeStyle === s}
          vary={(l, shoeStyle) => ({ ...l, shoeStyle })}
          onPick={(shoeStyle) => set("shoeStyle", shoeStyle)}
        />
        {look.shoeStyle !== "bare" && (
          <ColorField
            label="Color"
            value={look.shoes}
            onChange={(color) => color && set("shoes", color)}
          />
        )}
        {SNEAKERS.includes(look.shoeStyle) && (
          <ColorField
            label="Soles"
            tip="And the stripes, on runners"
            value={look.shoeTrim}
            inherit={{ label: "White", color: "#ecebe6" }}
            onChange={(color) => set("shoeTrim", color)}
          />
        )}
      </Group>
    </>
  );
}

function AccessoriesSection({ look, set }: SectionProps) {
  const pieces = pieceNames();
  const setExtra = (kind: Extra["kind"], color: string | undefined) =>
    set(
      "extras",
      color
        ? look.extras.some((e) => e.kind === kind)
          ? look.extras.map((e) => (e.kind === kind ? { kind, color } : e))
          : [...look.extras, { kind, color }]
        : look.extras.filter((e) => e.kind !== kind),
    );
  type Piece = NonNullable<BodyLook["pieces"]>[number];
  const setPiece = (name: string, piece: Piece | undefined) => {
    const others = (look.pieces ?? []).filter((p) => p.name !== name);
    const next = piece ? [...others, piece] : others;
    set("pieces", next.length ? next : undefined);
  };
  return (
    <>
      <Group title="Hat">
        <Picker
          look={look}
          kind="head"
          options={HAT_OPTIONS}
          selected={(style) => (look.hat?.style ?? "") === style}
          vary={(l, style) => ({ ...l, hat: withHat(l.hat, style) })}
          onPick={(style) => set("hat", withHat(look.hat, style))}
        />
        {look.hat && (
          <>
            <ColorField
              label="Color"
              value={look.hat.color}
              onChange={(color) => color && set("hat", { ...look.hat!, color })}
            />
            <ColorField
              label="Trim"
              tip="A band, a badge, a cap's brim or a Santa hat's fur"
              value={look.hat.secondary}
              inherit={{ label: "The hat's own", color: look.hat.color }}
              onChange={(secondary) => set("hat", { ...look.hat!, secondary })}
            />
          </>
        )}
      </Group>
      <Group title="Glasses">
        <Picker
          look={look}
          kind="face"
          options={GLASSES_OPTIONS}
          selected={(shape) => (look.glasses?.shape ?? "") === shape}
          vary={(l, shape) => ({
            ...l,
            glasses: shape
              ? { color: "#1a1a1a", ...l.glasses, shape }
              : undefined,
          })}
          onPick={(shape) =>
            set(
              "glasses",
              shape ? { color: "#1a1a1a", ...look.glasses, shape } : undefined,
            )
          }
        />
        {look.glasses && (
          <ColorField
            label="Frames"
            value={look.glasses.color}
            onChange={(color) =>
              color && set("glasses", { ...look.glasses!, color })
            }
          />
        )}
      </Group>
      <Group title="Worn or carried" tip="Pick any number" wide>
        <Picker
          look={look}
          kind="torso"
          multiple
          options={EXTRA_OPTIONS}
          selected={(kind) => look.extras.some((e) => e.kind === kind)}
          vary={(l, kind) => ({
            ...l,
            extras: [
              ...l.extras.filter((e) => e.kind !== kind),
              {
                kind,
                color:
                  l.extras.find((e) => e.kind === kind)?.color ?? "#6b4428",
              },
            ],
          })}
          onPick={(kind) =>
            setExtra(
              kind,
              look.extras.some((e) => e.kind === kind) ? undefined : "#6b4428",
            )
          }
        />
        {look.extras.map((extra) => (
          <ColorField
            key={extra.kind}
            label={capitalize(extra.kind)}
            value={extra.color}
            onChange={(color) => color && setExtra(extra.kind, color)}
          />
        ))}
      </Group>
      <Group
        title="Hand-drawn pieces"
        tip="SVGs drawn by hand, worn on the head or the torso: see looks/pieces/README.md to add one"
        wide
      >
        {pieces.length === 0 ? (
          <p class="muted small">None yet: see looks/pieces/README.md</p>
        ) : (
          <>
            <Picker
              look={look}
              kind={(name) => (piecePlace(name) === "head" ? "head" : "torso")}
              multiple
              options={pieces.map((name) => ({
                value: name,
                label: capitalize(name.replace(/-/g, " ")),
              }))}
              selected={(name) => !!look.pieces?.some((p) => p.name === name)}
              vary={(l, name) => ({
                ...l,
                pieces: [
                  ...(l.pieces ?? []).filter((p) => p.name !== name),
                  l.pieces?.find((p) => p.name === name) ?? {
                    name,
                    color: "#3a3a3a",
                  },
                ],
              })}
              onPick={(name) =>
                setPiece(
                  name,
                  look.pieces?.some((p) => p.name === name)
                    ? undefined
                    : { name, color: "#3a3a3a" },
                )
              }
            />
            {(look.pieces ?? []).map((piece) => (
              <ColorField
                key={piece.name}
                label={capitalize(piece.name.replace(/-/g, " "))}
                tip="Its magenta parts"
                value={piece.color}
                onChange={(color) =>
                  color && setPiece(piece.name, { ...piece, color })
                }
              />
            ))}
            {(look.pieces ?? []).map((piece) => (
              <ColorField
                key={`${piece.name}-2`}
                label="Second color"
                tip={`The ${piece.name.replace(/-/g, " ")}'s cyan parts`}
                value={piece.secondary}
                inherit={{ label: "Same as first", color: piece.color }}
                onChange={(secondary) =>
                  setPiece(piece.name, { ...piece, secondary })
                }
              />
            ))}
          </>
        )}
      </Group>
    </>
  );
}

/**
 * The body standing, and lying like a corpse or, while the face or the hair
 * is being changed, the face or the head close up
 */
function Stills({
  look,
  hidden,
  closeUp,
}: {
  look: BodyLook;
  hidden: BodyLayer[];
  closeUp?: "face" | "head";
}) {
  const key = JSON.stringify(look);
  const standing = useMemo(
    () => svgDataUrl(composeBodySvg(look, { scale: 420, hidden }, "ps")),
    [key, hidden.join()],
  );
  const near = hidden.includes("head") ? undefined : closeUp;
  const second = useMemo(
    () =>
      near
        ? thumbnailUrl(look, near)
        : svgDataUrl(
            composeBodySvg(look, { scale: 220, pose: "lying", hidden }, "pl"),
          ),
    [key, hidden.join(), near],
  );
  return (
    <div class="stills">
      <figure class="stills__stage">
        <img src={standing} alt="" />
        <figcaption>Standing</figcaption>
      </figure>
      <figure
        class={`stills__stage ${near ? `stills__stage--near stills__stage--${near}` : ""}`}
      >
        <img src={second} alt="" />
        <figcaption>
          {near === "face"
            ? "Face"
            : near === "head"
              ? "Head"
              : "Lying, as a corpse"}
        </figcaption>
      </figure>
    </div>
  );
}

/** A die, for the shuffle buttons */
function Dice() {
  return (
    <svg class="icon" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="1.5"
        y="1.5"
        width="13"
        height="13"
        rx="3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
      <circle cx="5.2" cy="5.2" r="1.3" fill="currentColor" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" />
      <circle cx="10.8" cy="10.8" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** Where the layers left out are remembered */
const HIDDEN_LAYERS_KEY = "characterEditorHiddenLayers";

/** Which layers are hidden, kept across reloads */
function useHiddenLayers(): [BodyLayer[], (layer: BodyLayer) => void] {
  const [hidden, setHidden] = useState<BodyLayer[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HIDDEN_LAYERS_KEY) ?? "[]");
      return BODY_LAYERS.filter((layer) => saved.includes(layer));
    } catch {
      return [];
    }
  });
  const toggle = (layer: BodyLayer) => {
    const next = hidden.includes(layer)
      ? hidden.filter((l) => l !== layer)
      : BODY_LAYERS.filter((l) => l === layer || hidden.includes(l));
    setHidden(next);
    try {
      localStorage.setItem(HIDDEN_LAYERS_KEY, JSON.stringify(next));
    } catch {}
  };
  return [hidden, toggle];
}

/** A button per layer, to show or hide it in every preview */
function LayerToggles({
  hidden,
  onToggle,
}: {
  hidden: BodyLayer[];
  onToggle: (layer: BodyLayer) => void;
}) {
  return (
    <div class="layer-toggles">
      <span
        class="muted small"
        {...tip("Hide a layer to see what's under it, here and in the game")}
      >
        Show
      </span>
      {BODY_LAYERS.map((layer) => (
        <button
          key={layer}
          class={`chip ${hidden.includes(layer) ? "" : "is-on"}`}
          aria-pressed={!hidden.includes(layer)}
          onClick={() => onToggle(layer)}
        >
          {capitalize(layer)}
        </button>
      ))}
    </div>
  );
}

const PREVIEW_MODE_LABELS: Record<PreviewMode, [string, string]> = {
  walk: ["Walk", "Walking round in a circle, empty-handed"],
  armed: ["Armed", "Walking round with their first starting weapon"],
  shoot: ["Shoot", "Standing, using their first starting weapon and reloading"],
};

/** Where the last mode picked is remembered */
const PREVIEW_MODE_KEY = "characterEditorPreviewMode";

/**
 * The character in the game itself (`?scene=preview`, `PreviewScene`), in an
 * iframe: drawn from the baked textures and animated by the game. It's sent
 * the draft whenever it changes. It never takes the focus or the mouse, so
 * the editor's keys keep working.
 */
function GamePreview({
  look,
  startingWeapons,
  stats,
  hidden,
}: {
  look: BodyLook;
  startingWeapons: string[];
  stats: Partial<PlayerStats>;
  hidden: BodyLayer[];
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [chosenMode, setMode] = useState<PreviewMode>(() => {
    try {
      const saved = localStorage.getItem(PREVIEW_MODE_KEY);
      return PREVIEW_MODES.find((m) => m === saved) ?? "walk";
    } catch {
      return "walk";
    }
  });
  const chooseMode = (next: PreviewMode) => {
    setMode(next);
    try {
      localStorage.setItem(PREVIEW_MODE_KEY, next);
    } catch {}
  };
  const armed = startingWeapons.length > 0;
  // Nothing to hold, nothing to shoot
  const mode = armed ? chosenMode : "walk";

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.data?.type === "previewReady"
      ) {
        setReady(true);
      }
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  // A moment after the last change, so dragging a slider doesn't bake every step
  const message: PreviewShow = {
    type: "previewShow",
    look,
    startingWeapons,
    stats,
    mode,
    hidden,
  };
  const key = JSON.stringify(message);
  useEffect(() => {
    if (!ready) {
      return;
    }
    const timeout = setTimeout(
      () =>
        frame.current?.contentWindow?.postMessage(
          message,
          window.location.origin,
        ),
      120,
    );
    return () => clearTimeout(timeout);
  }, [ready, key]);

  return (
    <div class="game-preview">
      <div class="game-preview__frame">
        <iframe
          ref={frame}
          src="/?scene=preview"
          tabIndex={-1}
          title="The character in the game"
        />
        {!ready && (
          <div class="game-preview__loading muted">Starting the game…</div>
        )}
        <div class="game-preview__modes">
          <Segmented
            value={mode}
            options={PREVIEW_MODES.map((m) => ({
              value: m,
              label: PREVIEW_MODE_LABELS[m][0],
              tip:
                m !== "walk" && !armed
                  ? "They have no starting weapons: see the Gameplay tab"
                  : PREVIEW_MODE_LABELS[m][1],
              disabled: m !== "walk" && !armed,
            }))}
            onChange={chooseMode}
          />
        </div>
      </div>
    </div>
  );
}
