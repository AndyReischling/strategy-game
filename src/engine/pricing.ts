import type { LayerOption, Region, WorldEvent, OptionTag } from "../data/types";

export type BadgeTone = "good" | "bad" | "info";
export interface PriceBadge {
  text: string;
  tone: BadgeTone; // good = cheaper/helpful, bad = pricier/frozen/riskier, info = neutral
}

export interface PriceInfo {
  base: number;
  cost: number; // effective cost for this region this round
  badges: PriceBadge[]; // UI notes: discounts, surcharges
  frozen: boolean; // unavailable this round (event froze the precondition)
  doubledSanction: boolean;
  unreliable: boolean; // cable-cut / gray-market: may not deliver
  splitNote?: string;
}

function tagsMatch(optionTags: OptionTag[], wanted?: OptionTag[]): boolean {
  if (!wanted || wanted.length === 0) return false;
  return wanted.some((t) => optionTags.includes(t));
}

function ruleApplies(
  option: LayerOption,
  appliesTo: { optionIds?: string[]; tags?: OptionTag[]; layers?: string[] },
): boolean {
  if (appliesTo.optionIds?.includes(option.id)) return true;
  if (appliesTo.layers?.includes(option.layer)) return true;
  if (tagsMatch(option.tags, appliesTo.tags)) return true;
  return false;
}

export function priceFor(
  option: LayerOption,
  region: Region,
  event?: WorldEvent,
): PriceInfo {
  let cost = option.baseCost;
  const badges: PriceBadge[] = [];
  let frozen = false;
  let doubledSanction = false;
  let unreliable = option.exposure === "gray-market";

  // 1) Region powers — your home-turf advantages, generally favorable
  for (const rule of region.priceRules) {
    if (!ruleApplies(option, rule.appliesTo)) continue;
    if (rule.setCost !== undefined) {
      badges.push({ text: rule.note, tone: rule.setCost < cost ? "good" : "info" });
      cost = rule.setCost;
      continue;
    }
    if (rule.pctOff) {
      cost = cost * (1 - rule.pctOff);
      badges.push({ text: rule.note, tone: "good" });
    }
    if (rule.flatOff) {
      cost = cost - rule.flatOff;
      badges.push({ text: rule.note, tone: "good" });
    }
  }

  // 2) World event modifiers
  if (event) {
    for (const eff of event.effects) {
      const regionExempt = eff.exemptRegionIds?.includes(region.id);
      const tagExempt = eff.exemptTags && tagsMatch(option.tags, eff.exemptTags);
      const matchByTag = tagsMatch(option.tags, eff.tags);
      const matchById = eff.optionIds?.includes(option.id) ?? false;
      const matched = matchByTag || matchById;

      switch (eff.kind) {
        case "surcharge-tag":
          if (matched && !regionExempt && !tagExempt) {
            cost += eff.amount ?? 0;
            badges.push({ text: `${event.name} +$${eff.amount}B`, tone: "bad" });
          }
          break;
        case "discount-tag":
          if (matched && !regionExempt) {
            cost -= eff.amount ?? 0;
            badges.push({ text: `${event.name} −$${eff.amount}B`, tone: "good" });
          }
          break;
        case "freeze-precondition":
          if (eff.preconditions?.includes(option.requires)) {
            frozen = true;
            badges.push({ text: `${event.name}: frozen without a deal`, tone: "bad" });
          }
          break;
        case "double-sanction":
          if (matched && option.sanctionRisk) {
            doubledSanction = true;
            badges.push({ text: `${event.name}: double sanction risk`, tone: "bad" });
          }
          break;
        case "unreliable-rented":
          if (matched) {
            unreliable = true;
            badges.push({ text: `${event.name}: may not deliver`, tone: "bad" });
          }
          break;
        default:
          break;
      }
    }
  }

  cost = Math.max(0, Math.round(cost));

  let splitNote: string | undefined;
  if (option.requires === "co-funder-1" || option.requires === "co-funders-2") {
    splitNote = "Cost is split among partners";
  }

  return { base: option.baseCost, cost, badges, frozen, doubledSanction, unreliable, splitNote };
}
