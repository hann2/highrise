import { GunStats } from "../../highrise/weapons/guns/GunStats";
import { Fact, FACT_GROUPS } from "./gunFacts";

/** Whether `other`'s value is better or worse than `gun`'s, for this fact */
function comparison(fact: Fact, gun: GunStats, other: GunStats) {
  if (!fact.value || !fact.better) {
    return "";
  }
  const a = fact.value(gun);
  const b = fact.value(other);
  if (Math.abs(a - b) < 1e-9) {
    return "";
  }
  return b > a === (fact.better === "more") ? "is-better" : "is-worse";
}

/** The gun's stats, grouped, beside another gun's if there is one */
export function StatsTable({
  gun,
  other,
}: {
  gun: GunStats;
  other?: GunStats;
}) {
  return (
    <table class="stats">
      {other && (
        <thead>
          <tr>
            <th />
            <th>{gun.name}</th>
            <th>{other.name}</th>
          </tr>
        </thead>
      )}
      {FACT_GROUPS.map((group) => (
        <tbody key={group.title}>
          <tr class="stats__group">
            <th colSpan={other ? 3 : 2}>{group.title}</th>
          </tr>
          {group.facts.map((fact) => (
            <tr key={fact.label}>
              <td class="stats__label">
                <span class={fact.about ? "has-tip" : ""} data-tip={fact.about}>
                  {fact.label}
                </span>
              </td>
              <td>{fact.text(gun)}</td>
              {other && (
                <td class={comparison(fact, gun, other)}>{fact.text(other)}</td>
              )}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
