import type { ChoiceOption } from "./decision";

export type VoteChoice = { optionId: string };

export type VoteOutcome =
  | { kind: "waiting"; candidateIds: string[] }
  | { kind: "winner"; candidateIds: string[] }
  | { kind: "tie"; candidateIds: string[] };

export function getVoteOutcome(options: ChoiceOption[], votes: VoteChoice[]): VoteOutcome {
  const countByOption = new Map(options.map((option) => [option.id, 0]));
  votes.forEach((vote) => countByOption.set(vote.optionId, (countByOption.get(vote.optionId) ?? 0) + 1));
  const maxVotes = Math.max(...Array.from(countByOption.values()));
  const candidateIds = Array.from(countByOption.entries()).filter(([, count]) => count === maxVotes).map(([id]) => id);
  if (maxVotes === 0) return { kind: "waiting", candidateIds: options.map((option) => option.id) };
  return candidateIds.length === 1 ? { kind: "winner", candidateIds } : { kind: "tie", candidateIds };
}

export function resolveVoteOutcome(options: ChoiceOption[], votes: VoteChoice[], random: () => number = Math.random) {
  const outcome = getVoteOutcome(options, votes);
  const selectedId = outcome.kind === "winner"
    ? outcome.candidateIds[0]!
    : outcome.candidateIds[Math.min(outcome.candidateIds.length - 1, Math.floor(random() * outcome.candidateIds.length))]!;
  const selected = options.find((option) => option.id === selectedId);
  if (!selected) throw new Error("A valid option is required to resolve a shared decision");
  const reason = outcome.kind === "winner"
    ? "大家的投票已经形成共识。"
    : outcome.kind === "tie"
      ? "票数难分高下，让一点公平随机替大家作最后决定。"
      : "暂时没有形成投票倾向，让一点公平随机替大家开启选择。";
  return { option: selected, reason, outcome };
}
