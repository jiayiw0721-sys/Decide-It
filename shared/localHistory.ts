import { MAX_DECISION_HISTORY, type ChoiceOption, type DecisionMode } from "./decision";

export type LocalDecisionRecord = {
  id: string;
  question: string;
  options: ChoiceOption[];
  mode: DecisionMode;
  chosenOption: string;
  reason: string;
  createdAt: string;
};

export type LocalDecisionInput = Omit<LocalDecisionRecord, "id" | "createdAt">;

export function appendLocalDecision(
  records: LocalDecisionRecord[],
  input: LocalDecisionInput,
  id: string,
  createdAt: string,
): LocalDecisionRecord[] {
  return [{ ...input, id, createdAt }, ...records].slice(0, MAX_DECISION_HISTORY);
}
