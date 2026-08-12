export type DecisionMode = "fair" | "weighted";
export type Preference = "want" | "neutral" | "avoid";

export const MAX_DECISION_HISTORY = 10;

export type ChoiceOption = {
  id: string;
  label: string;
  preference: Preference;
};

const preferenceWeight: Record<Preference, number> = {
  want: 4,
  neutral: 2,
  avoid: 1,
};

export function pickOption(
  options: ChoiceOption[],
  mode: DecisionMode,
  previousOptionId?: string,
  random: () => number = Math.random
): ChoiceOption {
  if (options.length < 2) throw new Error("At least two options are required");

  const available =
    previousOptionId && options.some((option) => option.id !== previousOptionId)
      ? options.filter((option) => option.id !== previousOptionId)
      : options;

  if (mode === "fair") {
    return available[Math.min(available.length - 1, Math.floor(random() * available.length))]!;
  }

  const totalWeight = available.reduce((sum, option) => sum + preferenceWeight[option.preference], 0);
  let threshold = random() * totalWeight;
  for (const option of available) {
    threshold -= preferenceWeight[option.preference];
    if (threshold < 0) return option;
  }

  return available[available.length - 1]!;
}

export function getDecisionReason(option: ChoiceOption, mode: DecisionMode): string {
  if (mode === "fair") return "它和其他选项有同样的机会，今天刚好轮到它。";
  if (option.preference === "want") return "你把它标为“很想”，今天就给它一个机会。";
  if (option.preference === "avoid") return "它被轻轻保留在候选中，但仍然值得今天重新看一眼。";
  return "它贴近你此刻的状态，也给今天留出一点小惊喜。";
}
