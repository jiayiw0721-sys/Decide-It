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
      { id: "region", label: "想尝尝哪里的风味？", values: [{ id: "sichuan", label: "川渝香辣" }, { id: "cantonese", label: "粤式清鲜" }, { id: "jiangnan", label: "江南鲜甜" }, { id: "northwest", label: "西北面香" }, { id: "northeast", label: "东北暖胃" }, { id: "yunnan", label: "云南山野" }] },
    ],
    candidates: [
      { label: "清爽沙拉", tags: ["light", "solo", "quick", "easy"] },
      { label: "日式定食", tags: ["light", "solo", "treat"] },
      { label: "重庆小面", tags: ["warm", "spicy", "solo", "quick", "easy", "sichuan"] },
      { label: "麻婆豆腐盖饭", tags: ["warm", "spicy", "solo", "quick", "easy", "sichuan"] },
      { label: "藤椒钵钵鸡", tags: ["light", "spicy", "together", "quick", "easy", "sichuan"] },
      { label: "川味回锅肉", tags: ["warm", "spicy", "together", "treat", "sichuan"] },
      { label: "酸菜鱼", tags: ["warm", "spicy", "together", "treat", "sichuan"] },
      { label: "广式烧腊双拼饭", tags: ["warm", "solo", "quick", "treat", "cantonese"] },
      { label: "鲜虾云吞面", tags: ["warm", "solo", "quick", "easy", "cantonese"] },
      { label: "早茶点心拼盘", tags: ["light", "together", "treat", "cantonese"] },
      { label: "煲仔饭", tags: ["warm", "solo", "together", "treat", "cantonese"] },
      { label: "清蒸鱼配时蔬", tags: ["light", "together", "treat", "cantonese"] },
      { label: "小笼包配鸡汤", tags: ["warm", "solo", "quick", "easy", "jiangnan"] },
      { label: "葱油拌面", tags: ["light", "solo", "quick", "easy", "jiangnan"] },
      { label: "苏式汤面", tags: ["warm", "solo", "quick", "easy", "jiangnan"] },
      { label: "本帮红烧肉", tags: ["warm", "together", "treat", "jiangnan"] },
      { label: "腌笃鲜配米饭", tags: ["warm", "together", "treat", "jiangnan"] },
      { label: "兰州牛肉面", tags: ["warm", "solo", "quick", "easy", "northwest"] },
      { label: "肉夹馍配凉皮", tags: ["spicy", "solo", "quick", "easy", "northwest"] },
      { label: "油泼面", tags: ["warm", "spicy", "solo", "quick", "easy", "northwest"] },
      { label: "羊肉泡馍", tags: ["warm", "solo", "treat", "northwest"] },
      { label: "手抓羊肉", tags: ["warm", "together", "treat", "northwest"] },
      { label: "锅包肉套餐", tags: ["warm", "together", "treat", "northeast"] },
      { label: "东北水饺", tags: ["warm", "solo", "together", "easy", "northeast"] },
      { label: "铁锅炖", tags: ["warm", "together", "treat", "northeast"] },
      { label: "酸菜白肉锅", tags: ["warm", "together", "treat", "northeast"] },
      { label: "地三鲜盖饭", tags: ["warm", "solo", "quick", "easy", "northeast"] },
      { label: "过桥米线", tags: ["warm", "solo", "quick", "treat", "yunnan"] },
      { label: "傣味柠檬鱼", tags: ["light", "spicy", "together", "treat", "yunnan"] },
      { label: "菌子火锅", tags: ["warm", "together", "treat", "yunnan"] },
      { label: "小锅米线", tags: ["warm", "spicy", "solo", "quick", "easy", "yunnan"] },
      { label: "汽锅鸡套餐", tags: ["light", "warm", "together", "treat", "yunnan"] },
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

type TemplateLanguage = "zh" | "en";

const englishTemplateText: Record<string, string> = {
  "今天吃什么？": "What should I eat today?",
  "今晚看什么？": "What should I watch tonight?",
  "今天去哪里？": "Where should I go today?",
  "现在先做什么？": "What should I do first?",
  "想吃什么感觉？": "What are you craving?",
  "清爽轻盈": "Fresh & light", "热乎满足": "Warm & comforting", "来点刺激": "A little spice",
  "此刻的场景": "What is the moment like?", "一个人": "On my own", "和朋友": "With friends", "想快一点": "Something quick",
  "今天的预算": "Today's budget", "轻松一点": "Easy on the wallet", "好好犒劳": "A little treat",
  "想尝尝哪里的风味？": "Which regional flavor?", "川渝香辣": "Sichuan & Chongqing", "粤式清鲜": "Cantonese fresh", "江南鲜甜": "Jiangnan delicate", "西北面香": "Northwest noodles", "东北暖胃": "Northeast comfort", "云南山野": "Yunnan wild flavors",
  "清爽沙拉": "Fresh salad", "日式定食": "Japanese set meal", "重庆小面": "Chongqing noodles", "麻婆豆腐盖饭": "Mapo tofu rice bowl", "藤椒钵钵鸡": "Sichuan pepper chilled chicken", "川味回锅肉": "Sichuan twice-cooked pork", "酸菜鱼": "Pickled mustard fish", "广式烧腊双拼饭": "Cantonese BBQ duo rice", "鲜虾云吞面": "Shrimp wonton noodles", "早茶点心拼盘": "Dim sum platter", "煲仔饭": "Claypot rice", "清蒸鱼配时蔬": "Steamed fish & greens", "小笼包配鸡汤": "Soup dumplings & chicken broth", "葱油拌面": "Scallion oil noodles", "苏式汤面": "Suzhou soup noodles", "本帮红烧肉": "Shanghai braised pork", "腌笃鲜配米饭": "Bamboo shoot & ham soup rice", "兰州牛肉面": "Lanzhou beef noodles", "肉夹馍配凉皮": "Chinese hamburger & cold noodles", "油泼面": "Chili oil noodles", "羊肉泡馍": "Lamb soup with flatbread", "手抓羊肉": "Hand-pulled lamb", "锅包肉套餐": "Crispy sweet-sour pork set", "东北水饺": "Northeast dumplings", "铁锅炖": "Iron-pot stew", "酸菜白肉锅": "Pickled cabbage pork hotpot", "地三鲜盖饭": "Three-treasure vegetable rice", "过桥米线": "Crossing-the-bridge rice noodles", "傣味柠檬鱼": "Dai-style lemon fish", "菌子火锅": "Wild mushroom hotpot", "小锅米线": "Small-pot rice noodles", "汽锅鸡套餐": "Steam-pot chicken set",
  "今天想看": "What are you in the mood for?", "轻松治愈": "Light & comforting", "悬疑刺激": "Mystery & thrill", "看看世界": "Explore the world", "可用时间": "Time available", "半小时左右": "Around 30 minutes", "一到两小时": "One to two hours", "不赶时间": "No rush", "和谁一起": "Who is watching?", "一起看": "Watching together", "一集轻喜剧": "An episode of light comedy", "治愈系动画": "A comforting animation", "一部温暖电影": "A warm-hearted film", "悬疑短剧": "A mystery mini-series", "一部悬疑电影": "A mystery film", "自然纪录片": "A nature documentary", "人物纪录片": "A biography documentary", "一部口碑佳片": "A highly rated film",
  "今天想要的氛围": "What kind of atmosphere?", "安静放空": "Quiet & unwinding", "有点热闹": "A little lively", "亲近自然": "Close to nature", "有多少时间": "How much time?", "半小时": "Half an hour", "半天": "Half a day", "出行方式": "How will you travel?", "步行可达": "Walkable", "愿意走远些": "Happy to go farther", "附近的安静咖啡馆": "A quiet nearby café", "街角独立书店": "A corner independent bookstore", "一座城市公园": "A city park", "湖边散步": "A lakeside walk", "热闹的市集": "A lively market", "一家新开的展览": "A new exhibition", "沿河骑行": "A riverside ride", "随意逛一条小街": "Wander a small street",
  "完成最重要的一件事": "Finish the most important thing", "整理十分钟": "Tidy up for ten minutes", "先休息一下": "Take a short break", "一部电影": "A film", "一集剧": "An episode", "读几页书": "Read a few pages", "去公园走走": "Take a walk in the park", "找家咖啡馆": "Find a café", "留在家里": "Stay at home", "真实地点": "Real places", "TMDb 实时内容": "Live TMDb picks",
};

export function localizeTemplateText(text: string, language: TemplateLanguage): string {
  if (language === "en") return englishTemplateText[text] ?? text;
  const sourceText = Object.entries(englishTemplateText).find(([, translatedText]) => translatedText === text)?.[0];
  return sourceText ?? text;
}

export function getLocalizedTemplate(template: FilterableTemplate, language: TemplateLanguage): FilterableTemplate {
  if (language === "zh") return template;
  return {
    ...template,
    question: localizeTemplateText(template.question, language),
    filters: template.filters.map((filter) => ({
      ...filter,
      label: localizeTemplateText(filter.label, language),
      values: filter.values.map((value) => ({ ...value, label: localizeTemplateText(value.label, language) })),
    })),
    candidates: template.candidates.map((candidate) => ({ ...candidate, label: localizeTemplateText(candidate.label, language) })),
  };
}

export function getFilteredStarterOptions(template: FilterableTemplate, selectedValues: string[]): ChoiceOption[] {
  const selected = selectedValues.filter(Boolean);
  const exactMatches = template.candidates.filter((candidate) => selected.every((value) => candidate.tags.includes(value)));
  const ranked = [...template.candidates].sort((a, b) => {
    const score = (candidate: TemplateCandidate) => selected.filter((value) => candidate.tags.includes(value)).length;
    return score(b) - score(a);
  });
  const maximumChoices = template.key === "food" ? 8 : 4;
  const choices = exactMatches.length >= 2 ? exactMatches : ranked.slice(0, maximumChoices);
  return choices.slice(0, maximumChoices).map((candidate, index) => ({ id: `${template.key}-${index}-${candidate.label}`, label: candidate.label, preference: "neutral" }));
}

export function getFilterLabels(template: FilterableTemplate, selectedValues: string[]): string[] {
  return template.filters.flatMap((filter) => filter.values.filter((value) => selectedValues.includes(value.id)).map((value) => value.label));
}
