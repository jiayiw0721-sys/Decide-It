import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import type { ChoiceOption } from "@shared/decision";
import { Check, Clapperboard, Loader2, Plus, Search, Tv } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type MediaFinderProps = {
  onUseCandidates: (candidates: ChoiceOption[]) => void;
};

export function MediaFinder({ onUseCandidates }: MediaFinderProps) {
  const { language } = useLanguage();
  const english = language === "en";
  const [kind, setKind] = useState<"movie" | "tv">("movie");
  const [input, setInput] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const mediaQuery = trpc.media.browse.useQuery({ kind, query: submittedQuery }, { staleTime: 60_000 });

  const search = () => {
    setSubmittedQuery(input.trim() || undefined);
    setSelectedIds([]);
  };

  const results = mediaQuery.data ?? [];
  const toggleCandidate = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length >= 8 ? current : [...current, id]);
  };

  const useSelectedCandidates = () => {
    const candidates = results.filter((item) => selectedIds.includes(item.id)).map((item) => ({ id: item.id, label: item.title, preference: "neutral" as const }));
    if (candidates.length < 2) {
      toast.message(english ? "Add at least two titles before deciding." : "请至少加入两部作品，才可以开始决定。", { icon: <Plus className="h-4 w-4" /> });
      return;
    }
    onUseCandidates(candidates);
  };

  return <section className="mt-6"><div><p className="text-sm font-medium text-[#747d8d]">{english ? "Choose from real titles" : "从真实内容中挑选"}</p><h1 className="mt-2 font-serif text-[30px] font-semibold tracking-[-0.05em] text-[#2d3548]">{english ? "What should we watch tonight?" : "今晚看什么？"}</h1><p className="mt-3 text-sm leading-6 text-[#858c99]">{english ? "Search movies or series, select a few specific titles, then let chance help you decide." : "搜索电影或剧集，选中几部具体作品，再交给随机决定。"}</p></div><div className="mt-6 grid grid-cols-2 gap-2 rounded-[18px] bg-[#f0eee9] p-1.5">{(["movie", "tv"] as const).map((item) => { const active = kind === item; const Icon = item === "movie" ? Clapperboard : Tv; return <button key={item} onClick={() => { setKind(item); setSubmittedQuery(undefined); setSelectedIds([]); }} className={`flex items-center justify-center gap-2 rounded-[13px] py-3 text-sm font-bold transition ${active ? "bg-white text-[#5f4da6] shadow-[0_5px_12px_rgba(53,59,77,0.08)]" : "text-[#8e95a0]"}`}><Icon className="h-4 w-4" />{item === "movie" ? (english ? "Movies" : "电影") : (english ? "TV series" : "电视剧")}</button>; })}</div><div className="mt-4 flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && search()} placeholder={english ? (kind === "movie" ? "Search titles, people, or themes" : "Search shows, people, or themes") : (kind === "movie" ? "搜索片名、演员或主题" : "搜索剧名、演员或主题")} className="min-w-0 flex-1 rounded-[15px] bg-[#f7f5f1] px-4 py-3 text-sm text-[#3f485a] outline-none placeholder:text-[#afb4bc]" /><button onClick={search} className="grid h-11 w-11 place-items-center rounded-[15px] bg-[#6955b3] text-white transition active:scale-95" aria-label={english ? "Search media" : "搜索影视内容"}><Search className="h-4 w-4" /></button></div><div className="mt-6"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-semibold tracking-[-0.03em]">{submittedQuery ? (english ? "Search results" : "搜索结果") : (english ? "Trending this week" : "本周热度")}</h2><span className="text-xs text-[#8e95a1]">{english ? "Selected" : "已选"} {selectedIds.length} / 8</span></div>{mediaQuery.isLoading ? <div className="grid h-44 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#705eba]" /></div> : mediaQuery.isError ? <div className="mt-4 rounded-[18px] bg-[#fff2ef] p-4 text-sm leading-6 text-[#a56860]">{english ? "Content is unavailable right now. Try another search or return later." : "暂时无法获取内容，换一个关键词或稍后再试。"}</div> : <div className="mt-4 grid grid-cols-2 gap-3">{results.map((item) => { const selected = selectedIds.includes(item.id); return <button key={item.id} onClick={() => toggleCandidate(item.id)} className={`relative overflow-hidden rounded-[20px] border text-left transition active:scale-[0.98] ${selected ? "border-[#a99ae1] bg-[#f3f0ff]" : "border-[#e9e5dd] bg-white"}`}>{item.posterUrl ? <img src={item.posterUrl} alt="" className="h-36 w-full object-cover" /> : <div className="grid h-36 place-items-center bg-[#eeeaf8] text-[#7662bb]"><Clapperboard className="h-6 w-6" /></div>}<div className="p-3"><span className="line-clamp-1 text-sm font-bold text-[#475064]">{item.title}</span><span className="mt-1 block text-[11px] text-[#969da8]">{item.year ?? (english ? "Year unknown" : "年份未知")}</span></div>{selected && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-[#6955b3] text-white shadow"><Check className="h-4 w-4" /></span>}</button>; })}</div>}</div><button onClick={useSelectedCandidates} disabled={mediaQuery.isLoading || results.length === 0} className="mt-7 flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#293145] py-4 text-sm font-bold text-white shadow-[0_14px_25px_rgba(41,49,69,0.18)] transition active:scale-[0.98] disabled:opacity-50"><Plus className="h-4 w-4" />{english ? "Use these titles to decide" : "用这些作品开始决定"}</button></section>;
}
