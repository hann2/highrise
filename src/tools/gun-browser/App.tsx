import { useEffect, useState } from "preact/hooks";
import { RESOURCES } from "../../../resources/resources";
import { ammoClassName } from "../../highrise/weapons/guns/ammo";
import {
  GUN_TIERS,
  GUNS,
  gunTierOf,
} from "../../highrise/weapons/guns/gun-stats/gunStats";
import {
  GunPartName,
  PartAmounts,
  PartStroke,
} from "../../highrise/weapons/guns/GunPose";
import { GunStats } from "../../highrise/weapons/guns/GunStats";
import { Segmented } from "../shared/Segmented";
import { ToolsNav } from "../shared/ToolsNav";
import { GunDrawings, PointLegend, SCALES } from "./GunArt";
import { RigPreview, usePreviewSettings } from "./RigPreview";
import { StatsTable } from "./StatsTable";

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function bySlug(name: string | undefined): GunStats | undefined {
  return name ? GUNS.find((gun) => slug(gun.name) === name) : undefined;
}

/** The gun shown and the one it's compared with, from `#ar15` or `#ar15/ak47` */
function fromHash(): [GunStats, GunStats | undefined] {
  const [first, second] = decodeURIComponent(location.hash.slice(1)).split("/");
  return [bySlug(first) ?? GUN_TIERS[0][0], bySlug(second)];
}

function hashFor(gun: GunStats, other?: GunStats): string {
  return `#${slug(gun.name)}${other ? `/${slug(other.name)}` : ""}`;
}

/** Every gun by tier, then any that aren't in one */
const GROUPS: { title: string; guns: GunStats[] }[] = [
  ...GUN_TIERS.map((guns, i) => ({ title: `Tier ${i + 1}`, guns })),
  {
    title: "No tier",
    guns: GUNS.filter((gun) => gunTierOf(gun) < 0),
  },
].filter((group) => group.guns.length > 0);

/** What a part's stroke is, in words */
function describeStroke(stroke: PartStroke): string {
  const said: string[] = [];
  if (stroke.offset) {
    const [x, y] = stroke.offset.map((m) => Math.round(m * 1000));
    said.push(
      [
        x !== 0 && `${Math.abs(x)} mm ${x < 0 ? "back" : "forward"}`,
        y !== 0 && `${Math.abs(y)} mm ${y < 0 ? "left" : "right"}`,
      ]
        .filter(Boolean)
        .join(", "),
    );
  }
  if (stroke.angle) {
    said.push(`turns ${Math.round((stroke.angle * 180) / Math.PI)}°`);
  }
  if (stroke.stretch !== undefined && stroke.stretch !== 1) {
    said.push(`to ${Math.round(stroke.stretch * 100)}% long`);
  }
  if (stroke.carries?.length) {
    said.push(`carries the ${stroke.carries.join(" and ")}`);
  }
  return said.join("; ");
}

export function App() {
  const [[gun, other], setShown] = useState(fromHash);
  const [settings, change] = usePreviewSettings();
  const [scale, setScale] = useState(1);
  const [points, setPoints] = useState(true);
  const [parts, setParts] = useState<PartAmounts>({});
  const [cycling, setCycling] = useState(false);

  useEffect(() => {
    const onHashChange = () => setShown(fromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    document.title = `${gun.name}${other ? ` vs ${other.name}` : ""} · Gun Browser`;
    setParts({});
    setCycling(false);
  }, [gun, other]);

  // Every part back and forward through its stroke
  useEffect(() => {
    if (!cycling) {
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const amount = (1 - Math.cos(((now - start) / 1000) * Math.PI)) / 2;
      setParts(
        Object.fromEntries(
          Object.keys(gun.parts ?? {}).map((name) => [name, amount]),
        ),
      );
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [cycling, gun]);

  const guns = other ? [gun, other] : [gun];
  const partNames = Object.keys(gun.parts ?? {}) as GunPartName[];
  const tier = gunTierOf(gun);

  return (
    <>
      <ToolsNav current="Gun Browser" />
      <div class="browser">
        <nav class="gun-list">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h1>{group.title}</h1>
              {group.guns.map((g) => (
                <a
                  key={g.name}
                  href={hashFor(g, other === g ? undefined : other)}
                  class={`gun-list__item ${g === gun ? "is-selected" : ""} ${g === other ? "is-compared" : ""}`}
                >
                  <img src={RESOURCES.images[g.textures.pickup]} />
                  <span>{g.name}</span>
                </a>
              ))}
            </section>
          ))}
        </nav>

        <main class="gun">
          <header class="gun__header">
            <img
              class="gun__pickup"
              src={RESOURCES.images[gun.textures.pickup]}
            />
            <div>
              <h2>{gun.name}</h2>
              <div class="muted">
                {ammoClassName(gun.ammoClass)} ·{" "}
                {tier < 0 ? "no tier" : `tier ${tier + 1}`}
              </div>
            </div>
            <label class="gun__compare">
              <span class="muted small">Compare with</span>
              <select
                value={other ? slug(other.name) : ""}
                onChange={(e) => {
                  location.hash = hashFor(
                    gun,
                    bySlug((e.target as HTMLSelectElement).value),
                  );
                }}
              >
                <option value="">Nothing</option>
                {GUNS.filter((g) => g !== gun).map((g) => (
                  <option key={g.name} value={slug(g.name)}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
          </header>

          <div class="gun__top">
            <section class="card gun__preview">
              <RigPreview guns={guns} settings={settings} change={change} />
            </section>
            <section class="card gun__stats">
              <StatsTable gun={gun} other={other} />
            </section>
          </div>

          <section class="card gun__art">
            <div class="gun__art-controls">
              <h2>Art at true scale</h2>
              <Segmented
                value={String(scale)}
                options={SCALES.map((s) => ({
                  value: String(s),
                  label: `${s}×`,
                  tip: `${s} pixel${s === 1 ? "" : "s"} a millimeter`,
                }))}
                onChange={(s) => setScale(Number(s))}
              />
              <button
                class={`chip ${points ? "is-on" : ""}`}
                onClick={() => setPoints(!points)}
                data-tip="Mark the points the hands go to, and the muzzle"
              >
                Points
              </button>
              {points && <PointLegend />}
            </div>
            {partNames.length > 0 && (
              <div class="parts">
                <span class="muted small">Moving parts</span>
                {partNames.map((name) => (
                  <label
                    key={name}
                    class="parts__part"
                    data-tip={describeStroke(gun.parts![name]!)}
                  >
                    <span>
                      {name}
                      {gun.cycles?.includes(name) && (
                        <span class="muted small"> · each shot</span>
                      )}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={parts[name] ?? 0}
                      onInput={(e) => {
                        setCycling(false);
                        setParts({
                          ...parts,
                          [name]: Number((e.target as HTMLInputElement).value),
                        });
                      }}
                    />
                  </label>
                ))}
                <button
                  class={`chip ${cycling ? "is-on" : ""}`}
                  onClick={() => {
                    setCycling(!cycling);
                    if (cycling) {
                      setParts({});
                    }
                  }}
                  data-tip="Every part back and forward through its stroke"
                >
                  {cycling ? "Stop" : "Work them"}
                </button>
              </div>
            )}
            <GunDrawings
              guns={guns}
              scale={scale}
              points={points}
              parts={parts}
            />
          </section>
        </main>
      </div>
    </>
  );
}
