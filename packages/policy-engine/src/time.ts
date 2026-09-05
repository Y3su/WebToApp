import type { PolicyPack, PolicyRule } from "./types.js";

type EffectiveDated = Pick<
  PolicyPack | PolicyRule,
  "effectiveFrom" | "effectiveUntil"
>;

export function parsePolicyDate(value: Date | string, label = "date"): Date {
  const parsed =
    value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new TypeError(`${label} must be a valid ISO-8601 timestamp or Date`);
  }
  return parsed;
}

export function isEffective(item: EffectiveDated, at: Date): boolean {
  const from = parsePolicyDate(item.effectiveFrom, "effectiveFrom");
  const until =
    item.effectiveUntil === undefined
      ? undefined
      : parsePolicyDate(item.effectiveUntil, "effectiveUntil");

  if (until !== undefined && until <= from) {
    throw new RangeError("effectiveUntil must be later than effectiveFrom");
  }
  return at >= from && (until === undefined || at < until);
}

export function selectEffectivePolicyPack(
  packs: readonly PolicyPack[],
  atInput: Date | string,
): PolicyPack {
  const at = parsePolicyDate(atInput, "evaluation date");
  const effective = packs
    .filter((pack) => isEffective(pack, at))
    .sort((left, right) => {
      const dateDifference =
        parsePolicyDate(right.effectiveFrom).getTime() -
        parsePolicyDate(left.effectiveFrom).getTime();
      return dateDifference === 0
        ? right.version.localeCompare(left.version)
        : dateDifference;
    });

  const selected = effective[0];
  if (selected === undefined) {
    throw new RangeError(`No policy pack is effective at ${at.toISOString()}`);
  }
  return selected;
}
