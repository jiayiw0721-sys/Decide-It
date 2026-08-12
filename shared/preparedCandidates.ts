import type { ChoiceOption } from "./decision";

export const MAX_PREPARED_CANDIDATES = 8;

export function togglePreparedCandidate(current: ChoiceOption[], candidate: ChoiceOption): ChoiceOption[] {
  if (current.some((item) => item.id === candidate.id)) return current.filter((item) => item.id !== candidate.id);
  if (current.length >= MAX_PREPARED_CANDIDATES) return current;
  return [...current, candidate];
}

export function removePreparedCandidate(current: ChoiceOption[], id: string): ChoiceOption[] {
  return current.filter((item) => item.id !== id);
}
