import type { ChoiceOption } from "./decision";

export type TemplateKey = "food" | "watch" | "place";

export type TemplateFilter = {
  id: string;
  label: string;
  values: Array<{ id: string; label: string }>;
};

export type TemplateCandidate = {
  label: string;
  tags: string[];
};

export type FilterableTemplate = {
  key: TemplateKey;
  question: string;
  filters: TemplateFilter[];
  candidates: TemplateCandidate[];
};

export const filterableTemplates: Record<TemplateKey, FilterableTemplate> = {
  food: {
    key: "food",
    question: "今天吃什么？",
    filters: [
      { id: "mood", label: "想吃什么感觉？", values: [{ id: "light", label: "清爽轻盈" }, { id: "warm", label: "热乎满足" }, { id: "spicy", label: "来点刺激" }] },
      { id: "scene", label: "此刻的场景", values: [{ id: "solo", label: "一个人" }, { id: "together", label: "和朋友" }, { id: "quick", label: "想快一点" }] },
      { id: "budget", label: "今天的预算", values: [{ id: "easy", label: "轻松一点" }, { id: "treat", label: "好好犒劳" }] },
    ],
    candidates: [
      { label: "一碗热汤面", tags: ["warm", "solo", "quick", "easy"] },
      { label: "家常小炒", tags: ["warm", "together", "treat"] },
      { label: "日式定食", tags: ["light", "solo", "treat"] },
      { label: "清爽沙拉", tags: ["light", "solo", "quick", "easy"] },
      { label: "麻辣香锅", tags: ["spicy", "together", "treat"] },
      { label: "热辣拌饭", tags: ["spicy", "solo", "quick", "easy"] },
      { label: "一顿火锅", tags: ["warm", "spicy", "together", "treat"] },
      { label: "街角小馆", tags: ["light", "warm", "together", "easy"] },
    ],
  },
  watch: {
    key: "watch",
    question: "今晚看什么？",
    filters: [
      { id: "genre", label: "今天想看", values: [{ id: "comfort", label: "轻松治愈" }, { id: "thrill", label: "悬疑刺激" }, { id: "learn", label: "看看世界" }] },
      { id: "length", label: "可用时间", values: [{ id: "short", label: "半小时左右" }, { id: "long", label: "一到两小时" }, { id: "open", label: "不赶时间" }] },
      { id: "company", label: "和谁一起", values: [{ id: "solo", label: "一个人" }, { id: "together", label: "一起看" }] },
    ],
    candidates: [
      { label: "一集轻喜剧", tags: ["comfort", "short", "solo"] },
      { label: "治愈系动画", tags: ["comfort", "short", "together"] },
      { label: "一部温暖电影", tags: ["comfort", "long", "together"] },
      { label: "悬疑短剧", tags: ["thrill", "short", "solo"] },
      { label: "一部悬疑电影", tags: ["thrill", "long", "together"] },
      { label: "自然纪录片", tags: ["learn", "short", "solo"] },
      { label: "人物纪录片", tags: ["learn", "long", "together"] },
      { label: "一部口碑佳片", tags: ["comfort", "thrill", "open", "solo", "together"] },
    ],
  },
  place: {
    key: "place",
    question: "今天去哪里？",
    filters: [
      { id: "vibe", label: "今天想要的氛围", values: [{ id: "quiet", label: "安静放空" }, { id: "lively", label: "有点热闹" }, { id: "nature", label: "亲近自然" }] },
      { id: "duration", label: "有多少时间", values: [{ id: "quick", label: "半小时" }, { id: "halfday", label: "半天" }, { id: "open", label: "不赶时间" }] },
      { id: "travel", label: "出行方式", values: [{ id: "walk", label: "步行可达" }, { id: "ride", label: "愿意走远些" }] },
    ],
    candidates: [
      { label: "附近的安静咖啡馆", tags: ["quiet", "quick", "walk"] },
      { label: "街角独立书店", tags: ["quiet", "halfday", "walk"] },
      { label: "一座城市公园", tags: ["nature", "quick", "walk"] },
      { label: "湖边散步", tags: ["nature", "halfday", "ride"] },
      { label: "热闹的市集", tags: ["lively", "halfday", "ride"] },
      { label: "一家新开的展览", tags: ["quiet", "lively", "halfday", "ride"] },
      { label: "沿河骑行", tags: ["nature", "open", "ride"] },
      { label: "随意逛一条小街", tags: ["lively", "open", "walk", "ride"] },
    ],
  },
};

export function getFilteredStarterOptions(template: FilterableTemplate, selectedValues: string[]): ChoiceOption[] {
  const selected = selectedValues.filter(Boolean);
  const exactMatches = template.candidates.filter((candidate) => selected.every((value) => candidate.tags.includes(value)));
  const ranked = [...template.candidates].sort((a, b) => {
    const score = (candidate: TemplateCandidate) => selected.filter((value) => candidate.tags.includes(value)).length;
    return score(b) - score(a);
  });
  const choices = exactMatches.length >= 2 ? exactMatches : ranked.slice(0, 4);
  return choices.slice(0, 8).map((candidate, index) => ({ id: `${template.key}-${index}-${candidate.label}`, label: candidate.label, preference: "neutral" }));
}

export function getFilterLabels(template: FilterableTemplate, selectedValues: string[]): string[] {
  return template.filters.flatMap((filter) => filter.values.filter((value) => selectedValues.includes(value.id)).map((value) => value.label));
}
