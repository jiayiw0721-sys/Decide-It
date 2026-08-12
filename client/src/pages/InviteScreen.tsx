import { Check, Copy, ExternalLink, UsersRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

export default function InviteScreen({ shareCode, onOpen }: { shareCode: string; onOpen: () => void }) {
  const { language } = useLanguage();
  const english = language === "en";
  const link = `${window.location.origin}/?vote=${shareCode}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success(english ? "Voting link copied — ready to share." : "投票链接已复制，可以发给大家了。" );
    } catch {
      toast.message(english ? "Please copy the link below to share it." : "请复制下方链接分享给大家。" );
    }
  };
  return <section className="pt-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-[23px] bg-[#ede9fb] text-[#6854af]"><UsersRound className="h-7 w-7" /></div><p className="mt-7 text-sm font-medium text-[#787f8d]">{english ? "Your voting room is ready" : "投票房间已准备好"}</p><h1 className="mt-2 font-serif text-[31px] font-semibold tracking-[-0.05em] text-[#30384c]">{english ? "Invite everyone,\ndecide together" : "邀请大家，\n一起定下来"}</h1><p className="mx-auto mt-4 max-w-[300px] text-sm leading-6 text-[#858c99]">{english ? "Each member gets one vote. If the top choices tie, the owner can fairly randomize between them." : "每位成员各投一票；若最高票平局，发起人可让系统在并列选项中公平随机。"}</p><div className="mt-8 rounded-[21px] border border-[#e6e2da] bg-white p-3 text-left"><p className="px-1 text-[11px] font-bold text-[#9298a3]">{english ? "Voting link" : "投票链接"}</p><p className="mt-1 truncate px-1 text-sm font-semibold text-[#4d5669]">{link}</p><button onClick={copyLink} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[15px] bg-[#f1effa] py-3 text-sm font-bold text-[#6754ae] transition active:scale-[0.98]"><Copy className="h-4 w-4" />{english ? "Copy link" : "复制链接"}</button></div><button onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[19px] bg-[#293145] py-4 text-sm font-bold text-white shadow-[0_14px_26px_rgba(41,49,69,0.2)] transition active:scale-[0.98]"><Check className="h-4 w-4" />{english ? "Preview voting page" : "我先去投票页看看"}</button><a href={link} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#7564b8]"><ExternalLink className="h-3.5 w-3.5" />{english ? "Open in a new page" : "在新页面打开"}</a></section>;
}
