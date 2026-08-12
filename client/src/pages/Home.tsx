import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { getDecisionReason, pickOption, type ChoiceOption, type DecisionMode, type Preference } from "@shared/decision";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Dice5,
  Flame,
  FolderClock,
  GlassWater,
  Heart,
  Lightbulb,
  Loader2,
  MapPin,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Screen = "today" | "editor" | "deciding" | "result" | "records";

type Draft = {
  question: string;
  options: ChoiceOption[];
  mode: DecisionMode;
};

type FinalDecision = {
  option: ChoiceOption;
  reason: string;
};

const templates: Array<{ name: string; question: string; icon: typeof UtensilsCrossed; options: string[] }> = [
  { name: "吃什么", question: "今天吃什么？", icon: UtensilsCrossed, options: ["清爽沙拉", "热汤面", "家常饭"] },
  { name: "看什么", question: "今晚看什么？", icon: Play, options: ["一部电影", "一集剧", "读几页书"] },
  { name: "去哪里", question: "今天去哪里？", icon: MapPin, options: ["去公园走走", "找家咖啡馆", "留在家里"] },
  { name: "先做什么", question: "现在先做什么？", icon: Lightbulb, options: ["完成最重要的一件事", "整理十分钟", "先休息一下"] },
];

const preferenceCopy: Record<Preference, { label: string; icon: typeof Heart; activeClass: string }> = {
  want: { label: "很想", icon: Heart, activeClass: "bg-[#fbe9e5] text-[#b9514d] ring-[#edcbc5]" },
  neutral: { label: "都行", icon: Sparkles, activeClass: "bg-[#f3efff] text-[#6955b3] ring-[#d8d0fa]" },
  avoid: { label: "今天不想", icon: GlassWater, activeClass: "bg-[#edf4ef] text-[#4e7e60] ring-[#c9e0cf]" },
};

const modeCopy: Record<DecisionMode, { title: string; description: string; icon: typeof Dice5 }> = {
  fair: { title: "公平随机", description: "所有选项，都有同样机会", icon: Dice5 },
  weighted: { title: "偏好推荐", description: "根据你此刻的倾向轻轻加权", icon: Star },
};

function makeOption(label = ""): ChoiceOption {
  return { id: crypto.randomUUID(), label, preference: "neutral" };
}

function makeDraft(template?: (typeof templates)[number]): Draft {
  return {
    question: template?.question ?? "",
    options: template ? template.options.map((label) => makeOption(label)) : [makeOption(), makeOption()],
    mode: "fair",
  };
}

function displayDate(value: Date | string) {
  return new Date(value).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [screen, setScreen] = useState<Screen>("today");
  const [draft, setDraft] = useState<Draft>(() => makeDraft());
  const [result, setResult] = useState<FinalDecision | null>(null);
  const [redraws, setRedraws] = useState(0);
  const [previousOptionId, setPreviousOptionId] = useState<string | undefined>();

  const recordsQuery = trpc.decision.list.useQuery(undefined, { enabled: isAuthenticated });
  const saveMutation = trpc.decision.save.useMutation({
    onSuccess: () => {
      utils.decision.list.invalidate();
      toast.success("已为你收好这次决定");
      setScreen("records");
    },
    onError: () => toast.error("暂时没能保存，请稍后再试。"),
  });

  const validOptions = useMemo(
    () => draft.options.filter((option) => option.label.trim().length > 0),
    [draft.options]
  );
  const canDecide = draft.question.trim().length > 0 && validOptions.length >= 2;

  useEffect(() => {
    if (screen !== "deciding" || !canDecide) return;
    const timer = window.setTimeout(() => {
      const option = pickOption(validOptions, draft.mode, previousOptionId);
      setResult({ option, reason: getDecisionReason(option, draft.mode) });
      setPreviousOptionId(option.id);
      setScreen("result");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [screen, canDecide, validOptions, draft.mode, previousOptionId]);

  const beginNewDecision = (template?: (typeof templates)[number]) => {
    setDraft(makeDraft(template));
    setResult(null);
    setRedraws(0);
    setPreviousOptionId(undefined);
    setScreen("editor");
  };

  const beginDecision = () => {
    if (!canDecide) {
      toast.message("再写下一个选项，就可以开始了。", { icon: <Sparkles className="h-4 w-4" /> });
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
    if (!isAuthenticated) {
      toast.message("登录后，就能在每台设备找回你的决定。", { icon: <CircleUserRound className="h-4 w-4" /> });
      startLogin();
      return;
    }
    saveMutation.mutate({
      question: draft.question.trim(),
      options: validOptions,
      mode: draft.mode,
      chosenOption: result.option.label,
      reason: result.reason,
    });
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

  const removeOption = (id: string) => {
    setDraft((current) => current.options.length <= 2 ? current : { ...current, options: current.options.filter((option) => option.id !== id) });
  };

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#f7f5f0]"><Loader2 className="h-5 w-5 animate-spin text-[#6955b3]" /></div>;
  }

  const screenTitle = screen === "records" ? "记录" : screen === "editor" ? "做个决定" : screen === "result" ? "今天的答案" : "今天";

  return (
    <div className="min-h-screen bg-[#ebe8e2] text-[#293043] selection:bg-[#e4ddff] selection:text-[#443586]">
      <div className="relative mx-auto min-h-screen max-w-[520px] overflow-hidden bg-[#fbfaf7] shadow-[0_0_50px_rgba(38,45,63,0.12)] md:min-h-[900px] md:my-8 md:rounded-[34px]">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_0%,rgba(243,234,204,0.7),transparent_45%),radial-gradient(circle_at_94%_14%,rgba(218,211,250,0.7),transparent_42%)]" />
        <header className="relative z-10 flex items-center justify-between px-6 pb-4 pt-7">
          {screen === "editor" || screen === "result" || screen === "deciding" ? (
            <button onClick={() => setScreen(screen === "editor" ? "today" : "editor")} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[#3c4659] shadow-[0_8px_20px_rgba(42,48,66,0.06)] transition active:scale-95" aria-label="返回">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-[#6955b3] text-white shadow-[0_10px_22px_rgba(105,85,179,0.28)]"><Dice5 className="h-5 w-5" /></div>
              <span className="font-serif text-[17px] font-semibold tracking-[-0.03em]">就这吧</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {(screen === "today" || screen === "records") && !isAuthenticated && (
              <button onClick={() => startLogin()} className="rounded-full bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#564799] shadow-[0_8px_20px_rgba(42,48,66,0.06)] transition active:scale-95">登录同步</button>
            )}
            {isAuthenticated && <div title={user?.name ?? "已登录"} className="grid h-9 w-9 place-items-center rounded-full border border-white bg-[#ede9fb] text-xs font-bold text-[#5b499d]">{user?.name?.slice(0, 1).toUpperCase() ?? "我"}</div>}
            {(screen === "editor" || screen === "result" || screen === "deciding") && <span className="text-sm font-semibold text-[#50596b]">{screenTitle}</span>}
          </div>
        </header>

        <main className="relative z-10 px-6 pb-28">
          <AnimatePresence mode="wait">
            {screen === "today" && <TodayScreen key="today" onTemplate={beginNewDecision} onNew={() => beginNewDecision()} recordsCount={recordsQuery.data?.length ?? 0} />}
            {screen === "editor" && <EditorScreen key="editor" draft={draft} canDecide={canDecide} onChange={setDraft} onOptionChange={updateOption} onOptionRemove={removeOption} onStart={beginDecision} />}
            {screen === "deciding" && <DecidingScreen key="deciding" question={draft.question} options={validOptions} />}
            {screen === "result" && result && <ResultScreen key="result" decision={result} redraws={redraws} saving={saveMutation.isPending} onAccept={acceptDecision} onRedraw={redraw} onEdit={() => setScreen("editor")} />}
            {screen === "records" && <RecordsScreen key="records" records={recordsQuery.data ?? []} loading={recordsQuery.isLoading} isAuthenticated={isAuthenticated} onLogin={startLogin} onReuse={reuseRecord} />}
          </AnimatePresence>
        </main>

        {(screen === "today" || screen === "records") && <BottomNavigation active={screen} onChange={setScreen} />}
      </div>
    </div>
  );
}

function TodayScreen({ onTemplate, onNew, recordsCount }: { onTemplate: (template: (typeof templates)[number]) => void; onNew: () => void; recordsCount: number }) {
  const hour = new Date().getHours();
  const greeting = hour < 11 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
      <div className="mt-8">
        <p className="text-[15px] font-medium text-[#697284]">{greeting}</p>
        <h1 className="mt-2 max-w-[330px] font-serif text-[35px] font-semibold leading-[1.16] tracking-[-0.055em] text-[#283044]">今天，想少纠结一点吗？</h1>
        <p className="mt-3 text-sm leading-6 text-[#7c8492]">把那些小小的犹豫，交给一点恰好的随机。</p>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-3">
        {templates.map((template, index) => {
          const Icon = template.icon;
          const colors = ["bg-[#f1edfB] text-[#6955b3]", "bg-[#fff0e7] text-[#bb7050]", "bg-[#e9f2ec] text-[#5c896c]", "bg-[#f7f0d9] text-[#96793a]"];
          return <button key={template.name} onClick={() => onTemplate(template)} className="group rounded-[23px] border border-white/70 bg-white/80 p-4 text-left shadow-[0_12px_28px_rgba(52,58,78,0.055)] transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]">
            <span className={`grid h-9 w-9 place-items-center rounded-[13px] ${colors[index]}`}><Icon className="h-[18px] w-[18px]" /></span>
            <span className="mt-7 block font-serif text-[18px] font-semibold tracking-[-0.03em] text-[#3a4356]">{template.name}</span>
            <span className="mt-1 flex items-center gap-0.5 text-xs text-[#9aa0ac]">开始决定 <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
          </button>;
        })}
      </div>

      <button onClick={onNew} className="mt-6 flex w-full items-center justify-between rounded-[22px] bg-[#293145] px-5 py-4 text-left text-white shadow-[0_14px_28px_rgba(41,49,69,0.2)] transition active:scale-[0.985]">
        <span className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/14"><Plus className="h-4 w-4" /></span><span><span className="block text-[15px] font-semibold">帮我决定</span><span className="mt-0.5 block text-xs text-white/58">从一个属于你的问题开始</span></span></span>
        <ArrowRight className="h-4 w-4 text-white/70" />
      </button>

      <div className="mt-8 rounded-[24px] border border-[#ebe7de] bg-[#f8f7f3]/85 p-4">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-[#596174]"><Clock3 className="h-4 w-4 text-[#8f82c8]" />你的决定</span><span className="text-xs text-[#9299a5]">{recordsCount} 次已珍藏</span></div>
        <p className="mt-3 text-sm leading-6 text-[#818997]">每一次确认，都在帮你把时间留给真正重要的事。</p>
      </div>
    </motion.section>
  );
}

function EditorScreen({ draft, canDecide, onChange, onOptionChange, onOptionRemove, onStart }: { draft: Draft; canDecide: boolean; onChange: (draft: Draft) => void; onOptionChange: (id: string, patch: Partial<ChoiceOption>) => void; onOptionRemove: (id: string) => void; onStart: () => void }) {
  const addOption = () => draft.options.length < 8 && onChange({ ...draft, options: [...draft.options, makeOption()] });
  return <motion.section initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
    <div className="mt-6"><p className="text-sm font-medium text-[#747d8d]">第一步，写下此刻的犹豫</p><input autoFocus value={draft.question} onChange={(event) => onChange({ ...draft, question: event.target.value })} placeholder="例如：今天吃什么？" className="mt-3 w-full border-0 border-b border-[#ddd8cf] bg-transparent px-0 pb-3 font-serif text-[28px] font-semibold tracking-[-0.045em] text-[#2d3548] outline-none placeholder:text-[#c4c1bd] focus:border-[#8a78d0]" /></div>
    <div className="mt-8"><div className="flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold tracking-[-0.03em]">候选项</h2><span className="text-xs text-[#9299a5]">{draft.options.length} / 8</span></div><p className="mt-1 text-xs text-[#939aa7]">至少两个选项，想法可以随时改变。</p>
      <div className="mt-4 space-y-3">{draft.options.map((option, index) => <OptionEditor key={option.id} option={option} index={index} canRemove={draft.options.length > 2} onChange={onOptionChange} onRemove={onOptionRemove} />)}</div>
      {draft.options.length < 8 && <button onClick={addOption} className="mt-3 flex items-center gap-2 rounded-full px-1 py-2 text-sm font-semibold text-[#6654ad] transition hover:text-[#4f3e95] active:scale-95"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#eeeafd]"><Plus className="h-3.5 w-3.5" /></span>再加一个选项</button>}
    </div>
    <div className="mt-8"><div className="flex items-baseline justify-between"><h2 className="font-serif text-[20px] font-semibold tracking-[-0.03em]">怎么选？</h2><span className="text-xs text-[#9299a5]">可随时切换</span></div><div className="mt-3 grid grid-cols-2 gap-2 rounded-[19px] bg-[#f1efeb] p-1.5">{(["fair", "weighted"] as DecisionMode[]).map((mode) => { const ModeIcon = modeCopy[mode].icon; const active = draft.mode === mode; return <button key={mode} onClick={() => onChange({ ...draft, mode })} className={`rounded-[14px] px-3 py-3 text-left transition ${active ? "bg-white shadow-[0_6px_14px_rgba(49,53,71,0.08)]" : "text-[#838a96]"}`}><span className="flex items-center gap-1.5 text-xs font-bold"><ModeIcon className={`h-3.5 w-3.5 ${active ? "text-[#6955b3]" : ""}`} />{modeCopy[mode].title}</span><span className="mt-1.5 block text-[11px] leading-4 text-[#8d94a0]">{modeCopy[mode].description}</span></button>; })}</div></div>
    <button onClick={onStart} className={`mt-9 flex w-full items-center justify-center gap-2 rounded-[19px] py-4 text-[15px] font-bold transition active:scale-[0.98] ${canDecide ? "bg-[#6955b3] text-white shadow-[0_14px_25px_rgba(105,85,179,0.25)]" : "bg-[#e8e6e1] text-[#a1a5ad]"}`}><Sparkles className="h-4 w-4" />就这么定</button>
  </motion.section>;
}

function OptionEditor({ option, index, canRemove, onChange, onRemove }: { option: ChoiceOption; index: number; canRemove: boolean; onChange: (id: string, patch: Partial<ChoiceOption>) => void; onRemove: (id: string) => void }) {
  return <div className="rounded-[20px] border border-[#ebe8e2] bg-white p-3.5 shadow-[0_8px_20px_rgba(52,58,78,0.035)]"><div className="flex items-center gap-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#f1effb] text-[11px] font-bold text-[#6955b3]">{index + 1}</span><input value={option.label} onChange={(event) => onChange(option.id, { label: event.target.value })} placeholder={`选项 ${index + 1}`} className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#3c4558] outline-none placeholder:text-[#bdc1c9]" />{canRemove && <button onClick={() => onRemove(option.id)} className="grid h-7 w-7 place-items-center rounded-full text-[#b4b8bf] transition hover:bg-[#f8eeee] hover:text-[#b75e5b]" aria-label="删除选项"><X className="h-3.5 w-3.5" /></button>}</div><div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">{(["want", "neutral", "avoid"] as Preference[]).map((preference) => { const copy = preferenceCopy[preference]; const Icon = copy.icon; const active = option.preference === preference; return <button key={preference} onClick={() => onChange(option.id, { preference })} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ring-1 transition ${active ? copy.activeClass : "bg-[#f8f7f4] text-[#9aa0aa] ring-transparent hover:bg-[#f2f0eb]"}`}><Icon className="h-3 w-3" />{copy.label}</button>; })}</div></div>;
}

function DecidingScreen({ question, options }: { question: string; options: ChoiceOption[] }) {
  return <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[590px] flex-col items-center justify-center"><p className="mb-3 text-sm font-semibold text-[#777f90]">{question}</p><div className="relative h-[280px] w-full max-w-[330px]">{options.slice(0, 4).map((option, index) => <motion.div key={option.id} initial={{ rotate: (index - 1.5) * 4, y: index * 10, opacity: 0 }} animate={{ rotate: [((index - 1.5) * 4), ((index - 1.5) * -2)], y: [index * 10, index * 5], opacity: 1 }} transition={{ duration: 0.38, delay: index * 0.08, repeat: 2, repeatType: "reverse" }} className="absolute inset-x-0 top-8 rounded-[28px] border border-white bg-[linear-gradient(145deg,#fffdfa,#f2eee6)] p-7 shadow-[0_20px_40px_rgba(40,46,62,0.12)]" style={{ zIndex: options.length - index }}><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9b91c9]">候选</span><p className="mt-10 font-serif text-[27px] font-semibold tracking-[-0.04em] text-[#343c50]">{option.label}</p></motion.div>)}</div><div className="mt-4 flex items-center gap-2 text-sm text-[#8c93a0]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8c7bce]" />正在替你翻开答案</div></motion.section>;
}

function ResultScreen({ decision, redraws, saving, onAccept, onRedraw, onEdit }: { decision: FinalDecision; redraws: number; saving: boolean; onAccept: () => void; onRedraw: () => void; onEdit: () => void }) {
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="pt-14"><p className="text-center text-sm font-medium text-[#7a8290]">今天的答案</p><motion.div initial={{ scale: 0.95, rotate: -2 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 18 }} className="mt-4 overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#7260bf,#514184)] p-1.5 shadow-[0_22px_42px_rgba(84,67,143,0.28)]"><div className="relative overflow-hidden rounded-[27px] bg-[linear-gradient(145deg,#fcfbff,#eeeafe)] px-7 py-12 text-center"><div className="absolute -right-10 -top-8 h-32 w-32 rounded-full bg-[#d8d0fa]/60 blur-2xl" /><div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-[#f7e6bb]/65 blur-2xl" /><span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-[11px] font-bold tracking-wide text-[#6c59b1]"><Flame className="h-3 w-3" />就选这个</span><h1 className="relative mt-7 break-words font-serif text-[39px] font-semibold leading-tight tracking-[-0.06em] text-[#30374d]">{decision.option.label}</h1></div></motion.div><p className="mx-auto mt-6 max-w-[305px] text-center text-[15px] leading-7 text-[#707888]">{decision.reason}</p>{redraws >= 2 && <p className="mx-auto mt-5 max-w-[285px] rounded-2xl bg-[#fff3e6] px-4 py-3 text-center text-xs leading-5 text-[#9a704a]">换一个也没关系。你的第一反应，也许已经悄悄告诉你答案。</p>}<div className="mt-9 space-y-3"><button onClick={onAccept} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#293145] py-4 text-[15px] font-bold text-white shadow-[0_14px_28px_rgba(41,49,69,0.2)] transition active:scale-[0.98] disabled:opacity-70">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{saving ? "正在保存" : "好，就选这个"}</button><div className="flex items-center justify-center gap-7"><button onClick={onRedraw} className="flex items-center gap-1.5 py-2 text-sm font-semibold text-[#6856ae] transition active:scale-95"><RotateCcw className="h-3.5 w-3.5" />换一个</button><button onClick={onEdit} className="py-2 text-sm font-semibold text-[#8b92a0] transition active:scale-95">返回编辑</button></div></div></motion.section>;
}

function RecordsScreen({ records, loading, isAuthenticated, onLogin, onReuse }: { records: Array<{ id: number; question: string; options: ChoiceOption[]; mode: DecisionMode; chosenOption: string; createdAt: Date | string }>; loading: boolean; isAuthenticated: boolean; onLogin: () => void; onReuse: (record: { question: string; options: ChoiceOption[]; mode: DecisionMode }) => void }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}><div className="mt-7"><p className="text-[15px] font-medium text-[#737b8c]">收好那些笃定的瞬间</p><h1 className="mt-2 font-serif text-[35px] font-semibold tracking-[-0.055em] text-[#283044]">决定记录</h1></div>{!isAuthenticated ? <div className="mt-10 rounded-[26px] border border-[#ebe6dd] bg-white/85 p-7 text-center shadow-[0_12px_28px_rgba(52,58,78,0.05)]"><div className="mx-auto grid h-12 w-12 place-items-center rounded-[17px] bg-[#eeeafd] text-[#6955b3]"><FolderClock className="h-5 w-5" /></div><h2 className="mt-4 font-serif text-xl font-semibold tracking-[-0.035em]">把决定留在身边</h2><p className="mt-2 text-sm leading-6 text-[#858c99]">登录后，最近十次决定会跨设备安静同步。</p><button onClick={onLogin} className="mt-5 rounded-full bg-[#6955b3] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_20px_rgba(105,85,179,0.22)] transition active:scale-95">登录并同步</button></div> : loading ? <div className="mt-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#7a68bc]" /></div> : records.length === 0 ? <div className="mt-10 rounded-[26px] border border-dashed border-[#ddd8cf] bg-[#f8f7f3] p-8 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#eeeafd] text-[#6b57b3]"><Sparkles className="h-5 w-5" /></div><p className="mt-4 font-serif text-lg font-semibold text-[#4a5263]">你的第一个决定，会从这里开始。</p><p className="mt-2 text-sm text-[#8e95a1]">接受一个答案后，它会静静留在这里。</p></div> : <div className="mt-8 space-y-3">{records.map((record) => <article key={record.id} className="rounded-[23px] border border-[#ece8e0] bg-white/80 p-4 shadow-[0_10px_24px_rgba(52,58,78,0.045)]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-[#8b92a0]">{displayDate(record.createdAt)}</p><h2 className="mt-1 text-[15px] font-semibold text-[#4b5467]">{record.question}</h2></div><span className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-[11px] font-bold text-[#5a8167]">已决定</span></div><p className="mt-5 font-serif text-[22px] font-semibold tracking-[-0.04em] text-[#343d52]">{record.chosenOption}</p><button onClick={() => onReuse(record)} className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#6755ad] transition active:scale-95"><RotateCcw className="h-3.5 w-3.5" />复用这组选项</button></article>)}</div>}</motion.section>;
}

function BottomNavigation({ active, onChange }: { active: "today" | "records"; onChange: (screen: "today" | "records") => void }) {
  return <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-[#eeeae4]/90 bg-[#fbfaf7]/94 px-6 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><div className="mx-auto flex max-w-[230px] items-center justify-between">{([{ key: "today", label: "今天", icon: Sparkles }, { key: "records", label: "记录", icon: FolderClock }] as const).map((item) => { const Icon = item.icon; const current = active === item.key; return <button key={item.key} onClick={() => onChange(item.key)} className={`flex min-w-[76px] flex-col items-center gap-1 text-[11px] font-bold transition ${current ? "text-[#6654ad]" : "text-[#9da2aa]"}`}><span className={`grid h-8 w-12 place-items-center rounded-[13px] transition ${current ? "bg-[#eeeafd]" : ""}`}><Icon className="h-[17px] w-[17px]" /></span>{item.label}</button>; })}</div></nav>;
}
