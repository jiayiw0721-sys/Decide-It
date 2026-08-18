import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { MediaFinder } from "@/components/MediaFinder";
import { PlaceFinder } from "@/components/PlaceFinder";
import { getDecisionReason, pickOption, type ChoiceOption, type DecisionMode, type Preference } from "@shared/decision";
import { appendLocalDecision, type LocalDecisionRecord } from "@shared/localHistory";
import { filterableTemplates, getFilteredStarterOptions, getFilterLabels, getLocalizedTemplate, getRefreshedStarterOptions, localizeTemplateText, type TemplateKey } from "@shared/templateFilters";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Dice5,
  Flame,
  FolderClock,
  GlassWater,
  Heart,
  Lightbulb,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Screen = "today" | "filters" | "editor" | "deciding" | "result" | "records" | "placeFinder" | "mediaFinder";

type Draft = {
  question: string;
  options: ChoiceOption[];
  mode: DecisionMode;
  filterLabels?: string[];
};

type FinalDecision = {
  option: ChoiceOption;
  reason: string;
};

const LOCAL_DECISION_HISTORY_KEY = "just-decide.local-history.v1";

function readLocalDecisionHistory(): LocalDecisionRecord[] {
  try {
    const stored = window.localStorage.getItem(LOCAL_DECISION_HISTORY_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as LocalDecisionRecord[] : [];
  } catch {
    return [];
  }
}

function saveLocalDecisionHistory(records: LocalDecisionRecord[]) {
  window.localStorage.setItem(LOCAL_DECISION_HISTORY_KEY, JSON.stringify(records));
}

const templates: Array<{ name: string; question: string; icon: typeof UtensilsCrossed; options: string[]; filterKey?: TemplateKey }> = [
  { name: "吃什么", question: "今天吃什么？", icon: UtensilsCrossed, options: ["清爽沙拉", "热汤面", "家常饭"], filterKey: "food" },
  { name: "看什么", question: "今晚看什么？", icon: Play, options: ["一部电影", "一集剧", "读几页书"], filterKey: "watch" },
  { name: "去哪里", question: "今天去哪里？", icon: MapPin, options: ["去公园走走", "找家咖啡馆", "留在家里"], filterKey: "place" },
  { name: "先做什么", question: "现在先做什么？", icon: Lightbulb, options: ["完成最重要的一件事", "整理十分钟", "先休息一下"] },
];

const preferenceCopy: Record<Preference, { labels: Record<Language, string>; icon: typeof Heart; activeClass: string }> = {
  want: { labels: { zh: "很想", en: "Want it" }, icon: Heart, activeClass: "bg-[#fbe9e5] text-[#b9514d] ring-[#edcbc5]" },
  neutral: { labels: { zh: "都行", en: "Either" }, icon: Sparkles, activeClass: "bg-[#f3efff] text-[#6955b3] ring-[#d8d0fa]" },
  avoid: { labels: { zh: "今天不想", en: "Not now" }, icon: GlassWater, activeClass: "bg-[#edf4ef] text-[#4e7e60] ring-[#c9e0cf]" },
};

const modeCopy: Record<DecisionMode, { title: string; description: string; icon: typeof Dice5 }> = {
  fair: { title: "公平随机", description: "所有选项，都有同样机会", icon: Dice5 },
  weighted: { title: "偏好推荐", description: "根据你此刻的倾向轻轻加权", icon: Star },
};

function makeOption(label = ""): ChoiceOption {
  return { id: crypto.randomUUID(), label, preference: "neutral" };
}

function makeDraft(template?: (typeof templates)[number], language: Language = "zh"): Draft {
  return {
    question: template ? localizeTemplateText(template.question, language) : "",
    options: template ? template.options.map((label) => makeOption(localizeTemplateText(label, language))) : [makeOption(), makeOption()],
    mode: "fair",
  };
}

function displayDate(value: Date | string) {
  return new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getInitialTemplateFromUrl(): TemplateKey | null {
  const value = new URLSearchParams(window.location.search).get("template");
  return value === "food" || value === "watch" || value === "place" ? value : null;
}

function getInitialFilterValues(): string[] {
  return (new URLSearchParams(window.location.search).get("filters") ?? "").split(",").filter(Boolean);
}

function isEditorPreview(): boolean {
  return new URLSearchParams(window.location.search).get("stage") === "editor";
}

function isMediaPreview(): boolean {
  return new URLSearchParams(window.location.search).get("media") === "1";
}

function isPlaceSearchPreview(): boolean {
  return new URLSearchParams(window.location.search).get("placeSearch") === "1";
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage();
  const [screen, setScreen] = useState<Screen>(() => isPlaceSearchPreview() ? "placeFinder" : isMediaPreview() ? "mediaFinder" : getInitialTemplateFromUrl() ? (isEditorPreview() ? "editor" : "filters") : "today");
  const [draft, setDraft] = useState<Draft>(() => {
    const templateKey = getInitialTemplateFromUrl();
    const selectedValues = getInitialFilterValues();
    if (!templateKey || !isEditorPreview()) return makeDraft();
    const template = getLocalizedTemplate(filterableTemplates[templateKey], language);
    return { question: template.question, options: getFilteredStarterOptions(template, selectedValues), mode: "fair", filterLabels: getFilterLabels(template, selectedValues) };
  });
  const [result, setResult] = useState<FinalDecision | null>(null);
  const [redraws, setRedraws] = useState(0);
  const [previousOptionId, setPreviousOptionId] = useState<string | undefined>();
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey | null>(() => getInitialTemplateFromUrl());
  const [activeFilters, setActiveFilters] = useState<string[]>(() => getInitialFilterValues());
  const [records, setRecords] = useState<LocalDecisionRecord[]>(readLocalDecisionHistory);

  useEffect(() => {
    if (!activeTemplate) return;
    setDraft((current) => ({
      ...current,
      question: localizeTemplateText(current.question, language),
      options: current.options.map((option) => ({ ...option, label: localizeTemplateText(option.label, language) })),
      filterLabels: current.filterLabels?.map((label) => localizeTemplateText(label, language)),
    }));
    setResult((current) => current ? {
      option: { ...current.option, label: localizeTemplateText(current.option.label, language) },
      reason: getDecisionReason(current.option, draft.mode, language),
    } : null);
  }, [activeTemplate, language]);

  const chooseFilterValue = (filterId: string, valueId: string) => {
    if (!activeTemplate) return;
    const filter = filterableTemplates[activeTemplate].filters.find((item) => item.id === filterId);
    if (!filter) return;
    const groupValueIds = filter.values.map((value) => value.id);
    setActiveFilters((current) => current.includes(valueId) ? current.filter((value) => value !== valueId) : [...current.filter((value) => !groupValueIds.includes(value)), valueId]);
  };

  const startFromFilters = () => {
    if (!activeTemplate) return;
    const template = getLocalizedTemplate(filterableTemplates[activeTemplate], language);
    setDraft({
      question: template.question,
      options: getFilteredStarterOptions(template, activeFilters),
      mode: "fair",
      filterLabels: getFilterLabels(template, activeFilters),
    });
    setScreen("editor");
  };

  const goBack = () => {
    if (screen === "filters") setScreen("today");
    else if (screen === "editor") setScreen(activeTemplate ? "filters" : "today");
    else if (screen === "placeFinder") setScreen("filters");
    else if (screen === "mediaFinder") setScreen("filters");
    else setScreen("editor");
  };

  const validOptions = useMemo(
    () => draft.options.filter((option) => option.label.trim().length > 0),
    [draft.options]
  );
  const canDecide = draft.question.trim().length > 0 && validOptions.length >= 2;

  useEffect(() => {
    if (screen !== "deciding" || !canDecide) return;
    const timer = window.setTimeout(() => {
      const option = pickOption(validOptions, draft.mode, previousOptionId);
      setResult({ option, reason: getDecisionReason(option, draft.mode, language) });
      setPreviousOptionId(option.id);
      setScreen("result");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [screen, canDecide, validOptions, draft.mode, previousOptionId, language]);

  const beginNewDecision = (template?: (typeof templates)[number]) => {
    if (template?.filterKey) {
      setActiveTemplate(template.filterKey);
      setActiveFilters([]);
      setResult(null);
      setRedraws(0);
      setPreviousOptionId(undefined);
      setScreen("filters");
      return;
    }
    setActiveTemplate(null);
    setDraft(makeDraft(template, language));
    setResult(null);
    setRedraws(0);
    setPreviousOptionId(undefined);
    setScreen("editor");
  };

  const beginDecision = () => {
    if (!canDecide) {
      toast.message(language === "en" ? "Add one more option and you can start." : "再写下一个选项，就可以开始了。", { icon: <Sparkles className="h-4 w-4" /> });
      return;
    }
    setScreen("deciding");
  };

  const redraw = () => {
    setRedraws((value) => value + 1);
    setScreen("deciding");
  };

  const acceptDecision = () => {
    if (!result) return;
    const nextRecords = appendLocalDecision(records, {
      question: draft.question.trim(),
      options: validOptions,
      mode: draft.mode,
      chosenOption: result.option.label,
      reason: result.reason,
    }, crypto.randomUUID(), new Date().toISOString());
    setRecords(nextRecords);
    saveLocalDecisionHistory(nextRecords);
    toast.success(language === "en" ? "This decision is saved on this device." : "已为你收好这次决定");
    setScreen("records");
  };

  const reuseRecord = (record: { question: string; options: ChoiceOption[]; mode: DecisionMode }) => {
    setDraft({ question: record.question, options: record.options, mode: record.mode });
    setResult(null);
    setRedraws(0);
    setPreviousOptionId(undefined);
    setScreen("editor");
  };

  const updateOption = (id: string, patch: Partial<ChoiceOption>) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    }));
  };

  const refreshTemplateCandidates = () => {
    if (!activeTemplate) return;
    const template = getLocalizedTemplate(filterableTemplates[activeTemplate], language);
    const refreshed = getRefreshedStarterOptions(template, activeFilters, draft.options.map((option) => option.label));
    if (refreshed.length < 2) {
      toast.message(language === "en" ? "There are no other close matches. Try relaxing a filter." : "当前筛选下没有足够的新候选，可以放宽一个条件再试。", { icon: <Sparkles className="h-4 w-4" /> });
      return;
    }
    setDraft((current) => ({ ...current, options: refreshed }));
    setPreviousOptionId(undefined);
    setResult(null);
    toast.success(language === "en" ? "Here is a different group." : "为你换了一组新的候选。");
  };

  const usePlaceCandidates = (candidates: ChoiceOption[]) => {
    setDraft((current) => ({ ...current, question: localizeTemplateText("今天去哪里？", language), options: candidates, filterLabels: [...(current.filterLabels ?? []), localizeTemplateText("真实地点", language)] }));
    setScreen("editor");
  };

  const useMediaCandidates = (candidates: ChoiceOption[]) => {
    setDraft((current) => ({ ...current, question: localizeTemplateText("今晚看什么？", language), options: candidates, filterLabels: [...(current.filterLabels ?? []), localizeTemplateText("TMDb 实时内容", language)] }));
    setScreen("editor");
  };

  const removeOption = (id: string) => {
    setDraft((current) => current.options.length <= 2 ? current : { ...current, options: current.options.filter((option) => option.id !== id) });
  };

  const screenTitle = screen === "records" ? t("records") : screen === "filters" ? t("choose") : screen === "editor" ? t("edit") : screen === "result" ? t("answer") : screen === "placeFinder" ? t("findPlace") : screen === "mediaFinder" ? t("findMedia") : t("today");

  return (
    <div className="min-h-screen bg-[#ebe8e2] text-[#293043] selection:bg-[#e4ddff] selection:text-[#443586]">
      <div className="relative mx-auto min-h-screen max-w-[520px] overflow-hidden bg-[#fbfaf7] shadow-[0_0_50px_rgba(38,45,63,0.12)] md:min-h-[900px] md:my-8 md:rounded-[34px]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(243,234,204,0.7),transparent_45%),radial-gradient(circle_at_94%_14%,rgba(218,211,250,0.7),transparent_42%)]" />
        <header className="relative z-10 flex items-center justify-between px-6 pb-4 pt-7">
          {screen === "filters" || screen === "editor" || screen === "result" || screen === "deciding" || screen === "placeFinder" || screen === "mediaFinder" ? (
            <button onClick={goBack} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[#3c4659] shadow-[0_8px_20px_rgba(42,48,66,0.06)] transition active:scale-95" aria-label="返回">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-[#6955b3] text-white shadow-[0_10px_22px_rgba(105,85,179,0.28)]"><Dice5 className="h-5 w-5" /></div>
              <span className="font-serif text-[17px] font-semibold tracking-[-0.03em]">{t("appName")}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")} className="rounded-full bg-white/80 px-2.5 py-2 text-[11px] font-bold text-[#564799] shadow-[0_8px_20px_rgba(42,48,66,0.06)] transition active:scale-95" aria-label={t("chooseLanguage")}>{language === "zh" ? "EN" : "中文"}</button>
            {(screen === "filters" || screen === "editor" || screen === "result" || screen === "deciding" || screen === "placeFinder" || screen === "mediaFinder") && <span className="text-sm font-semibold text-[#50596b]">{screenTitle}</span>}
          </div>
        </header>

        <main className="relative z-10 px-6 pb-28">
          <AnimatePresence mode="wait">
            {screen === "today" && <TodayScreen key="today" onTemplate={beginNewDecision} onNew={() => beginNewDecision()} recordsCount={records.length} />}
            {screen === "filters" && activeTemplate && <FilterScreen key="filters" template={filterableTemplates[activeTemplate]} activeFilters={activeFilters} onSelect={chooseFilterValue} onContinue={startFromFilters} onPlaceDiscovery={activeTemplate === "place" ? () => setScreen("placeFinder") : undefined} />}
            {screen === "filters" && activeTemplate === "watch" && <button key="media-discovery" onClick={() => setScreen("mediaFinder")} className="-mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#d9d1f3] bg-[#f7f4ff] py-3.5 text-sm font-bold text-[#6854af] transition active:scale-[0.98]"><Play className="h-4 w-4" />{t("realMedia")}</button>}
            {screen === "editor" && <EditorScreen key="editor" draft={draft} canDecide={canDecide} onChange={setDraft} onOptionChange={updateOption} onOptionRemove={removeOption} onStart={beginDecision} onRefreshCandidates={activeTemplate ? refreshTemplateCandidates : undefined} />}
            {screen === "deciding" && <DecidingScreen key="deciding" question={draft.question} options={validOptions} />}
            {screen === "result" && result && <ResultScreen key="result" decision={result} redraws={redraws} onAccept={acceptDecision} onRedraw={redraw} onEdit={() => setScreen("editor")} />}
            {screen === "records" && <RecordsScreen key="records" records={records} onReuse={reuseRecord} />}
            {screen === "placeFinder" && <PlaceFinder key="places" onUseCandidates={usePlaceCandidates} />}
            {screen === "mediaFinder" && <MediaFinder key="media" onUseCandidates={useMediaCandidates} />}
          </AnimatePresence>
        </main>

        {(screen === "today" || screen === "records") && <BottomNavigation active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}

function TodayScreen({ onTemplate, onNew, recordsCount }: { onTemplate: (template: (typeof templates)[number]) => void; onNew: () => void; recordsCount: number }) {
  const { language, t } = useLanguage();
  const hour = new Date().getHours();
  const greeting = hour < 11 ? t("greetingMorning") : hour < 18 ? t("greetingAfternoon") : t("greetingEvening");
  const templateLabels = [t("food"), t("watch"), t("place"), t("doFirst")];
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
      <div className="mt-8">
        <p className="text-[15px] font-medium text-[#697284]">{greeting}</p>
        <h1 className="mt-2 max-w-[330px] font-serif text-[35px] font-semibold leading-[1.16] tracking-[-0.055em] text-[#283044]">{t("hero")}</h1>
        <p className="mt-3 text-sm leading-6 text-[#7c8492]">{t("heroSub")}</p>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-3">
        {templates.map((template, index) => {
          const Icon = template.icon;
          const colors = ["bg-[#f1edfB] text-[#6955b3]", "bg-[#fff0e7] text-[#bb7050]", "bg-[#e9f2ec] text-[#5c896c]", "bg-[#f7f0d9] text-[#96793a]"];
          return <button key={template.name} onClick={() => onTemplate(template)} className="group rounded-[23px] border border-white/70 bg-white/80 p-4 text-left shadow-[0_12px_28px_rgba(52,58,78,0.055)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
            <span className={`grid h-9 w-9 place-items-center rounded-[13px] ${colors[index]}`}><Icon className="h-[18px] w-[18px]" /></span>
            <span className="mt-7 block font-serif text-[18px] font-semibold tracking-[-0.03em] text-[#3a4356]">{language === "zh" ? template.name : templateLabels[index]}</span>
            <span className="mt-1 flex items-center gap-0.5 text-xs text-[#9aa0ac]">{t("startDecision")} <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
          </button>;
        })}
      </div>

      <button onClick={onNew} className="mt-6 flex w-full items-center justify-between rounded-[22px] bg-[#293145] px-5 py-4 text-left text-white shadow-[0_14px_28px_rgba(41,49,69,0.2)] transition active:scale-[0.985]">
        <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/14"><Plus className="h-4 w-4" /></span><span><span className="block text-[15px] font-semibold">{t("decideForMe")}</span><span className="mt-0.5 block text-xs text-white/58">{t("decisionHint")}</span></span></span>
        <ArrowRight className="h-4 w-4 text-white/70" />
      </button>

      <div className="mt-8 rounded-[24px] border border-[#ebe7de] bg-[#f8f7f3]/85 p-4">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-[#596174]"><Clock3 className="h-4 w-4 text-[#8f82c8]" />{t("yourDecisions")}</span><span className="text-xs text-[#9299a5]">{recordsCount} {t("savedCount")}</span></div>
        <p className="mt-3 text-sm leading-6 text-[#818997]">{t("decisionReflection")}</p>
      </div>
    </motion.section>
  );
}

function FilterScreen({ template, activeFilters, onSelect, onContinue, onPlaceDiscovery }: { template: (typeof filterableTemplates)[TemplateKey]; activeFilters: string[]; onSelect: (filterId: string, valueId: string) => void; onContinue: () => void; onPlaceDiscovery?: () => void }) {
  const { language, t } = useLanguage();
  const english = language === "en";
  const localizedTemplate = getLocalizedTemplate(template, language);
  const preview = getFilteredStarterOptions(localizedTemplate, activeFilters);
  const selectedLabels = getFilterLabels(localizedTemplate, activeFilters);
  return <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}><div className="mt-6"><p className="text-sm font-medium text-[#747d8d]">{english ? "Give today a little direction" : "先给今天一点方向"}</p><h1 className="mt-2 font-serif text-[30px] font-semibold tracking-[-0.05em] text-[#2d3548]">{localizedTemplate.question}</h1><p className="mt-3 max-w-[340px] text-sm leading-6 text-[#858c99]">{english ? "Choose what matters right now and we will prepare closer matches." : "挑选几个此刻在意的特点，我们会准备更贴近你的候选项。"}</p></div><div className="mt-8 space-y-7">{localizedTemplate.filters.map((filter) => <section key={filter.id}><h2 className="text-[15px] font-bold text-[#4f586b]">{filter.label}</h2><div className="mt-3 flex flex-wrap gap-2">{filter.values.map((value) => { const active = activeFilters.includes(value.id); return <button key={value.id} onClick={() => onSelect(filter.id, value.id)} className={`rounded-full px-3.5 py-2.5 text-[13px] font-semibold ring-1 transition active:scale-95 ${active ? "bg-[#6955b3] text-white ring-[#6955b3] shadow-[0_8px_16px_rgba(105,85,179,0.18)]" : "bg-white text-[#778090] ring-[#e7e3dc] hover:bg-[#f5f2ff] hover:text-[#6250a9]"}`}>{value.label}</button>; })}</div></section>)}</div>{onPlaceDiscovery && <button onClick={onPlaceDiscovery} className="mt-7 flex w-full items-center justify-center gap-2 rounded-[18px] border border-[#d9d1f3] bg-[#f7f4ff] py-3.5 text-sm font-bold text-[#6854af] transition active:scale-[0.98]"><MapPin className="h-4 w-4" />{t("mapSearch")}</button>}<div className="mt-8 rounded-[22px] border border-[#e9e5dd] bg-[#f7f5f1] p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold text-[#727b8b]">{english ? "We will prepare" : "将为你准备"}</span><span className="text-xs font-semibold text-[#6754af]">{preview.length} {english ? "candidates" : "个候选"}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{selectedLabels.length > 0 ? selectedLabels.map((label) => <span key={label} className="rounded-full bg-[#eae5fb] px-2.5 py-1 text-[11px] font-semibold text-[#6754ae]">{label}</span>) : <span className="text-xs text-[#969ca7]">{english ? "No limits needed — you can start now." : "不设限制，也可以直接开始。"}</span>}</div></div><button onClick={onContinue} className="mt-6 flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#6955b3] py-4 text-[15px] font-bold text-white shadow-[0_14px_25px_rgba(105,85,179,0.25)] transition active:scale-[0.98]"><Sparkles className="h-4 w-4" />{t("templateStart")}</button></motion.section>;
}

function EditorScreen({ draft, canDecide, onChange, onOptionChange, onOptionRemove, onStart, onRefreshCandidates }: { draft: Draft; canDecide: boolean; onChange: (draft: Draft) => void; onOptionChange: (id: string, patch: Partial<ChoiceOption>) => void; onOptionRemove: (id: string) => void; onStart: () => void; onRefreshCandidates?: () => void }) {
  const { language, t } = useLanguage();
  const english = language === "en";
  const addOption = () => draft.options.length < 8 && onChange({ ...draft, options: [...draft.options, makeOption()] });
  return <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
    <div className="mt-6"><p className="text-sm font-medium text-[#747d8d]">{english ? "Start by writing down the choice in front of you" : "第一步，写下此刻的犹豫"}</p><input autoFocus value={draft.question} onChange={(event) => onChange({ ...draft, question: event.target.value })} placeholder={english ? "For example: What should I eat today?" : "例如：今天吃什么？"} className="mt-3 w-full border-0 border-b border-[#ddd8cf] bg-transparent px-0 pb-3 font-serif text-[28px] font-semibold tracking-[-0.045em] text-[#2d3548] outline-none placeholder:text-[#c4c1bd] focus:border-[#8a78d0]" />{draft.filterLabels && <div className="mt-3 flex flex-wrap gap-1.5">{draft.filterLabels.length > 0 ? draft.filterLabels.map((label) => <span key={label} className="rounded-full bg-[#eeeafd] px-2.5 py-1 text-[11px] font-semibold text-[#6754ae]">{label}</span>) : <span className="text-xs text-[#9aa0aa]">{english ? "No filters selected" : "未设置筛选条件"}</span>}</div>}</div>
    <div className="mt-8"><div className="flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold tracking-[-0.03em]">{t("candidates")}</h2><span className="text-xs text-[#9299a5]">{draft.options.length} / 8</span></div><p className="mt-1 text-xs text-[#939aa7]">{english ? "Keep at least two options; you can change your mind anytime." : "至少两个选项，想法可以随时改变。"}</p>
      <div className="mt-4 space-y-3">{draft.options.map((option, index) => <OptionEditor key={option.id} option={option} index={index} canRemove={draft.options.length > 2} onChange={onOptionChange} onRemove={onOptionRemove} />)}</div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">{draft.options.length < 8 && <button onClick={addOption} className="flex items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-[#6654ad] transition hover:text-[#4f3e95] active:scale-95"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#eeeafd]"><Plus className="h-3.5 w-3.5" /></span>{english ? "Add another option" : "再加一个选项"}</button>}{onRefreshCandidates && <button onClick={onRefreshCandidates} className="flex items-center gap-1.5 rounded-full px-1 py-2 text-sm font-semibold text-[#8a6a38] transition hover:text-[#6d5126] active:scale-95"><RefreshCw className="h-3.5 w-3.5" />{english ? "None of these? Refresh this group" : "这组都不喜欢？换一组"}</button>}</div>
    </div>
    <div className="mt-8"><div className="flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold tracking-[-0.03em]">{t("choice")}</h2><span className="text-xs text-[#9299a5]">{english ? "Switch anytime" : "可随时切换"}</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-[19px] bg-[#f1efeb] p-1.5">{(["fair", "weighted"] as DecisionMode[]).map((mode) => { const ModeIcon = modeCopy[mode].icon; const active = draft.mode === mode; const title = mode === "fair" ? t("fair") : t("weighted"); const description = english ? (mode === "fair" ? "Every option has the same chance" : "Gently weights your current preference") : modeCopy[mode].description; return <button key={mode} onClick={() => onChange({ ...draft, mode })} className={`rounded-[14px] px-3 py-3 text-left transition ${active ? "bg-white shadow-[0_6px_14px_rgba(49,53,71,0.08)]" : "text-[#838a96]"}`}><span className="flex items-center gap-1.5 text-xs font-bold"><ModeIcon className={`h-3.5 w-3.5 ${active ? "text-[#6955b3]" : ""}`} />{title}</span><span className="mt-1.5 block text-[11px] leading-4 text-[#8d94a0]">{description}</span></button>; })}</div></div>
    <button onClick={onStart} className={`mt-9 flex w-full items-center justify-center gap-2 rounded-[19px] py-4 text-[15px] font-bold transition active:scale-[0.98] ${canDecide ? "bg-[#6955b3] text-white shadow-[0_14px_25px_rgba(105,85,179,0.25)]" : "bg-[#e8e6e1] text-[#a1a5ad]"}`}><Sparkles className="h-4 w-4" />{t("randomNow")}</button>
  </motion.section>;
}

function OptionEditor({ option, index, canRemove, onChange, onRemove }: { option: ChoiceOption; index: number; canRemove: boolean; onChange: (id: string, patch: Partial<ChoiceOption>) => void; onRemove: (id: string) => void }) {
  const { language } = useLanguage();
  const english = language === "en";
  return <div className="rounded-[20px] border border-[#ebe8e2] bg-white p-3.5 shadow-[0_8px_20px_rgba(52,58,78,0.035)]"><div className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f1effb] text-[11px] font-bold text-[#6955b3]">{index + 1}</span><input value={option.label} onChange={(event) => onChange(option.id, { label: event.target.value })} placeholder={english ? `Option ${index + 1}` : `选项 ${index + 1}`} className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#3c4558] outline-none placeholder:text-[#bdc1c9]" />{canRemove && <button onClick={() => onRemove(option.id)} className="grid h-7 w-7 place-items-center rounded-full text-[#b4b8bf] transition hover:bg-[#f8eeee] hover:text-[#b75e5b]" aria-label={english ? "Remove option" : "删除选项"}><X className="h-3.5 w-3.5" /></button>}</div><div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">{(["want", "neutral", "avoid"] as Preference[]).map((preference) => { const copy = preferenceCopy[preference]; const Icon = copy.icon; const active = option.preference === preference; return <button key={preference} onClick={() => onChange(option.id, { preference })} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition ${active ? copy.activeClass : "bg-[#f8f7f4] text-[#9aa0aa] ring-transparent hover:bg-[#f2f0eb]"}`}><Icon className="h-3 w-3" />{copy.labels[language]}</button>; })}</div></div>;
}

function DecidingScreen({ question, options }: { question: string; options: ChoiceOption[] }) {
  const { language } = useLanguage();
  const english = language === "en";
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[590px] flex-col items-center justify-center"><p className="mb-3 text-sm font-semibold text-[#777f90]">{question}</p><div className="relative h-[280px] w-full max-w-[330px]">{options.slice(0, 4).map((option, index) => <motion.div key={option.id} initial={{ rotate: (index - 1.5) * 4, y: index * 10, opacity: 0 }} animate={{ rotate: [((index - 1.5) * 4), ((index - 1.5) * -2)], y: [index * 10, index * 5], opacity: 1 }} transition={{ duration: 0.38, delay: index * 0.08, repeat: 2, repeatType: "reverse" }} className="absolute inset-x-0 top-8 rounded-[28px] border border-white bg-[linear-gradient(145deg,#fffdfa,#f2eee6)] p-7 shadow-[0_20px_40px_rgba(40,46,62,0.12)]" style={{ zIndex: options.length - index }}><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b91c9]">{english ? "CANDIDATE" : "候选"}</span><p className="mt-10 font-serif text-[27px] font-semibold tracking-[-0.04em] text-[#343c50]">{option.label}</p></motion.div>)}</div><div className="mt-4 flex items-center gap-2 text-sm text-[#8c93a0]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8c7bce]" />{english ? "Turning over your answer" : "正在替你翻开答案"}</div></motion.section>;
}

function ResultScreen({ decision, redraws, onAccept, onRedraw, onEdit }: { decision: FinalDecision; redraws: number; onAccept: () => void; onRedraw: () => void; onEdit: () => void }) {
  const { language } = useLanguage();
  const english = language === "en";
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="pt-14"><p className="text-center text-sm font-medium text-[#7a8290]">{english ? "Today's answer" : "今天的答案"}</p><motion.div initial={{ scale: 0.95, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="mt-4 overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#7260bf,#514184)] p-1.5 shadow-[0_22px_42px_rgba(84,67,143,0.28)]"><div className="relative overflow-hidden rounded-[27px] bg-[linear-gradient(145deg,#fcfbff,#eeeafe)] px-7 py-12 text-center"><div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-[#d8d0fa]/60 blur-2xl" /><div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#f7e6bb]/65 blur-2xl" /><span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#6c59b1]"><Flame className="h-3 w-3" />{english ? "GO WITH THIS" : "就选这个"}</span><h1 className="relative mt-7 break-words font-serif text-[39px] font-semibold leading-tight tracking-[-0.06em] text-[#30374d]">{decision.option.label}</h1></div></motion.div><p className="mx-auto mt-6 max-w-[305px] text-center text-[15px] leading-7 text-[#707888]">{decision.reason}</p>{redraws >= 2 && <p className="mx-auto mt-5 max-w-[285px] rounded-2xl bg-[#fff3e6] px-4 py-3 text-center text-xs leading-5 text-[#9a704a]">{english ? "Trying another is fine. Your first reaction may already have told you something." : "换一个也没关系。你的第一反应，也许已经悄悄告诉你答案。"}</p>}<div className="mt-9 space-y-3"><button onClick={onAccept} className="flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#293145] py-4 text-[15px] font-bold text-white shadow-[0_14px_28px_rgba(41,49,69,0.2)] transition active:scale-[0.98]"><Check className="h-4 w-4" />{english ? "Yes, choose this" : "好，就选这个"}</button><div className="flex items-center justify-center gap-7"><button onClick={onRedraw} className="flex items-center gap-1.5 py-2 text-sm font-semibold text-[#6856ae] transition active:scale-95"><RotateCcw className="h-3.5 w-3.5" />{english ? "Try another" : "换一个"}</button><button onClick={onEdit} className="py-2 text-sm font-semibold text-[#8b92a0] transition active:scale-95">{english ? "Edit choices" : "返回编辑"}</button></div></div></motion.section>;
}

function RecordsScreen({ records, onReuse }: { records: LocalDecisionRecord[]; onReuse: (record: { question: string; options: ChoiceOption[]; mode: DecisionMode }) => void }) {
  const { language } = useLanguage();
  const english = language === "en";
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}><div className="mt-7"><p className="text-[15px] font-medium text-[#737b8c]">{english ? "Keep the moments that felt clear" : "收好那些笃定的瞬间"}</p><h1 className="mt-2 font-serif text-[35px] font-semibold tracking-[-0.055em] text-[#283044]">{english ? "Decision records" : "决定记录"}</h1></div><p className="mt-3 text-sm leading-6 text-[#858c99]">{english ? "Saved privately on this device, with your latest ten choices close at hand." : "记录只保存在这台设备上，最近十次决定随时可回看。"}</p>{records.length === 0 ? <div className="mt-10 rounded-[26px] border border-dashed border-[#ddd8cf] bg-[#f8f7f3] p-8 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#eeeafd] text-[#6b57b3]"><Sparkles className="h-5 w-5" /></div><p className="mt-4 font-serif text-lg font-semibold text-[#4a5263]">{english ? "Your first decision starts here." : "你的第一个决定，会从这里开始。"}</p><p className="mt-2 text-sm text-[#8e95a1]">{english ? "Accept an answer and it will rest here." : "确认答案后，它会安静留在这里。"}</p></div> : <div className="mt-8 space-y-3">{records.map((record) => <article key={record.id} className="rounded-[23px] border border-[#ece8e0] bg-white/80 p-4 shadow-[0_10px_24px_rgba(52,58,78,0.045)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-[#8b92a0]">{displayDate(record.createdAt)}</p><h2 className="mt-1 text-[15px] font-semibold text-[#4b5467]">{record.question}</h2></div><span className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-[11px] font-bold text-[#5a8167]">{english ? "DECIDED" : "已决定"}</span></div><p className="mt-5 font-serif text-[22px] font-semibold tracking-[-0.04em] text-[#343d52]">{record.chosenOption}</p><button onClick={() => onReuse(record)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#6755ad] transition active:scale-95"><RotateCcw className="h-3.5 w-3.5" />{english ? "Reuse these choices" : "复用这组选项"}</button></article>)}</div>}</motion.section>;
}

function BottomNavigation({ active, onChange }: { active: "today" | "records"; onChange: (screen: "today" | "records") => void }) {
  const { t } = useLanguage();
  return <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-[#eeeae4]/90 bg-[#fbfaf7]/94 px-6 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-[230px] items-center justify-between">{([{ key: "today", label: t("today"), icon: Sparkles }, { key: "records", label: t("records"), icon: FolderClock }] as const).map((item) => { const Icon = item.icon; const current = active === item.key; return <button key={item.key} onClick={() => onChange(item.key)} className={`flex min-w-[76px] flex-col items-center gap-1 text-[11px] font-bold transition ${current ? "text-[#6654ad]" : "text-[#9da2aa]"}`}><span className={`grid h-8 w-12 place-items-center rounded-[13px] transition ${current ? "bg-[#eeeafd]" : ""}`}><Icon className="h-[17px] w-[17px]" /></span>{item.label}</button>; })}</div></nav>;
}
