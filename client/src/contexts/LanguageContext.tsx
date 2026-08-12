import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "zh" | "en";

const messages = {
  zh: {
    today: "今天", records: "记录", login: "登录", loginSync: "登录同步", appName: "就这吧",
    greetingMorning: "早上好", greetingAfternoon: "下午好", greetingEvening: "晚上好",
    hero: "今天，想少纠结一点吗？", heroSub: "把那些小小的犹豫，交给一点恰好的随机。",
    startDecision: "开始决定", decideForMe: "帮我决定", decisionHint: "从一个属于你的问题开始",
    yourDecisions: "你的决定", savedCount: "次已珍藏", decisionReflection: "每一次确认，都在帮你把时间留给真正重要的事。",
    food: "吃什么", watch: "看什么", place: "去哪里", doFirst: "先做什么",
    chooseLanguage: "语言", back: "返回", choose: "选一选", edit: "做个决定", answer: "今天的答案",
    invite: "邀请大家", together: "一起决定", findPlace: "搜索地点", findMedia: "找部作品",
    templateStart: "用这些特点开始", mapSearch: "从地图搜索具体地点", realMedia: "浏览真实电影和电视剧",
    voteWithFriends: "邀请大家投票", randomNow: "就这么定", fair: "公平随机", weighted: "偏好推荐",
    candidates: "候选项", choice: "怎么选？", languageSaved: "语言偏好已保存",
  },
  en: {
    today: "Today", records: "Records", login: "Sign in", loginSync: "Sync history", appName: "Decide It",
    greetingMorning: "Good morning", greetingAfternoon: "Good afternoon", greetingEvening: "Good evening",
    hero: "Want to overthink a little less today?", heroSub: "Hand the little hesitations to a touch of well-timed chance.",
    startDecision: "Start deciding", decideForMe: "Help me decide", decisionHint: "Begin with a question that matters to you",
    yourDecisions: "Your decisions", savedCount: " saved", decisionReflection: "Each choice leaves more time for what truly matters.",
    food: "What to eat", watch: "What to watch", place: "Where to go", doFirst: "What to do first",
    chooseLanguage: "Language", back: "Back", choose: "Refine", edit: "Make a choice", answer: "Today's answer",
    invite: "Invite others", together: "Decide together", findPlace: "Find places", findMedia: "Find something to watch",
    templateStart: "Use these preferences", mapSearch: "Search real places on a map", realMedia: "Browse real movies & TV",
    voteWithFriends: "Invite others to vote", randomNow: "Decide now", fair: "Fair random", weighted: "Preference-led",
    candidates: "Candidates", choice: "How should we choose?", languageSaved: "Language preference saved",
  },
} as const;

type MessageKey = keyof typeof messages.zh;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "decision-assistant-language";

export function resolveInitialLanguage(search: string, storedLanguage: string | null): Language {
  const requestedLanguage = new URLSearchParams(search).get("lang");
  if (requestedLanguage === "en" || requestedLanguage === "zh") return requestedLanguage;
  return storedLanguage === "en" ? "en" : "zh";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => resolveInitialLanguage(window.location.search, localStorage.getItem(STORAGE_KEY)));
  const setLanguage = (next: Language) => setLanguageState(next);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t: (key: MessageKey) => messages[language][key] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
