import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Check, Loader2, Sparkles, UsersRound } from "lucide-react";
import { toast } from "sonner";

type SharedVoteProps = {
  shareCode: string;
  onBack: () => void;
};

export function SharedVote({ shareCode, onBack }: SharedVoteProps) {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const english = language === "en";
  const utils = trpc.useUtils();
  const sessionQuery = trpc.sharedDecision.get.useQuery({ shareCode }, { refetchInterval: 5000 });
  const voteMutation = trpc.sharedDecision.vote.useMutation({ onSuccess: () => utils.sharedDecision.get.invalidate({ shareCode }), onError: (error) => toast.error(error.message) });
  const resolveMutation = trpc.sharedDecision.resolve.useMutation({ onSuccess: () => utils.sharedDecision.get.invalidate({ shareCode }), onError: (error) => toast.error(error.message) });

  if (sessionQuery.isLoading) return <div className="flex min-h-[540px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#735fc0]" /></div>;
  if (!sessionQuery.data) return <div className="mt-16 text-center"><p className="font-serif text-xl font-semibold text-[#414a5d]">{english ? "This vote cannot be opened right now." : "这个投票暂时无法打开。"}</p><button onClick={onBack} className="mt-5 text-sm font-bold text-[#6955b3]">{english ? "Back to home" : "回到首页"}</button></div>;

  const { session, votes, members } = sessionQuery.data;
  const myVote = votes.find((vote) => vote.userId === user?.id)?.optionId;
  const winner = session.finalOptionId ? session.options.find((option) => option.id === session.finalOptionId) : undefined;

  const castVote = (optionId: string) => {
    if (!isAuthenticated) {
      toast.message(english ? "Sign in to join this vote." : "登录后即可加入这次投票。" );
      startLogin();
      return;
    }
    voteMutation.mutate({ shareCode, optionId });
  };

  return <section className="mt-7"><div className="rounded-[25px] bg-[linear-gradient(135deg,#7160bd,#514184)] p-5 text-white shadow-[0_18px_35px_rgba(84,67,143,0.25)]"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold"><UsersRound className="h-3.5 w-3.5" />{english ? "Decide together" : "一起决定"}</span><h1 className="mt-4 font-serif text-[28px] font-semibold tracking-[-0.045em]">{session.question}</h1><p className="mt-2 text-sm text-white/70">{english ? `${members.length} members joined, ${votes.length} voted; tied leaders are fairly randomized.` : `已有 ${members.length} 位成员加入，${votes.length} 人表达偏好；票数相同就公平随机。`}</p></div>{session.status === "resolved" && winner ? <div className="mt-6 rounded-[26px] border border-[#ded6f8] bg-[#f5f1ff] p-6 text-center"><p className="text-xs font-bold tracking-wide text-[#6b57b3]">{english ? "FINAL DECISION" : "最终决定"}</p><h2 className="mt-3 font-serif text-[31px] font-semibold tracking-[-0.05em] text-[#3b4358]">{winner.label}</h2><p className="mt-3 text-sm leading-6 text-[#747d8d]">{session.finalReason}</p></div> : <div className="mt-6 space-y-3">{session.options.map((option) => { const count = votes.filter((vote) => vote.optionId === option.id).length; const selected = myVote === option.id; return <button key={option.id} onClick={() => castVote(option.id)} disabled={voteMutation.isPending} className={`flex w-full items-center justify-between rounded-[21px] border p-4 text-left transition active:scale-[0.99] ${selected ? "border-[#a99ae1] bg-[#f1eeff]" : "border-[#ebe6de] bg-white"}`}><span className="flex items-center gap-3"><span className={`grid h-7 w-7 place-items-center rounded-full ${selected ? "bg-[#6955b3] text-white" : "bg-[#f1efea] text-[#a0a6af]"}`}>{selected ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{count}</span>}</span><span className="text-[15px] font-semibold text-[#465064]">{option.label}</span></span><span className="text-xs font-bold text-[#8b92a0]">{count} {english ? "votes" : "票"}</span></button>; })}</div>}<div className="mt-7 rounded-[20px] border border-[#ece7de] bg-[#f8f7f3] p-4"><p className="text-xs leading-5 text-[#7e8694]">{english ? "Everyone can change their vote. When the owner closes voting, a clear leader wins; a tie or no votes is resolved fairly among eligible options." : "每个人可以随时改投，发起人结束投票时：若有唯一最高票则直接选中；若平票或暂未有人投票，系统只在并列候选中公平随机。"}</p></div>{session.status === "open" && user?.id === session.creatorId && <button onClick={() => resolveMutation.mutate({ shareCode })} disabled={resolveMutation.isPending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#293145] py-4 text-sm font-bold text-white shadow-[0_14px_26px_rgba(41,49,69,0.2)] transition active:scale-[0.98]">{resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{english ? "Close voting & decide" : "结束投票并给出决定"}</button>}<button onClick={onBack} className="mt-5 w-full py-2 text-sm font-semibold text-[#7262b5]">{english ? "Back to home" : "回到首页"}</button></section>;
}
