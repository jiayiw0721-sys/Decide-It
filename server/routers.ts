import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { addSharedDecisionMember, castDecisionVote, createDecisionRecord, createSharedDecision, getDecisionVotes, getRecentDecisionRecords, getSharedDecisionByCode, getSharedDecisionMembers, resolveSharedDecision } from "./db";
import { resolveVoteOutcome } from "../shared/collaboration";
import { browseMedia } from "./media";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const optionSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(160),
  preference: z.enum(["want", "neutral", "avoid"]),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  decision: router({
    list: protectedProcedure.query(({ ctx }) => getRecentDecisionRecords(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          question: z.string().trim().min(1).max(240),
          options: z.array(optionSchema).min(2).max(8),
          mode: z.enum(["fair", "weighted"]),
          chosenOption: z.string().trim().min(1).max(160),
          reason: z.string().trim().min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await createDecisionRecord({ ...input, userId: ctx.user.id });
        return { success: true } as const;
      }),
  }),
  sharedDecision: router({
    create: protectedProcedure
      .input(z.object({ question: z.string().trim().min(1).max(240), options: z.array(optionSchema).min(2).max(8) }))
      .mutation(async ({ ctx, input }) => {
        const shareCode = nanoid(10);
        const sharedDecisionId = await createSharedDecision({ ...input, shareCode, creatorId: ctx.user.id });
        await addSharedDecisionMember(sharedDecisionId, ctx.user.id, "creator");
        return { shareCode };
      }),
    get: publicProcedure
      .input(z.object({ shareCode: z.string().min(6).max(16) }))
      .query(async ({ input }) => {
        const session = await getSharedDecisionByCode(input.shareCode);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "这个投票已不存在或链接无效。" });
        const votes = await getDecisionVotes(session.id);
        const members = await getSharedDecisionMembers(session.id);
        return { session, votes, members };
      }),
    vote: protectedProcedure
      .input(z.object({ shareCode: z.string().min(6).max(16), optionId: z.string().min(1).max(80) }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSharedDecisionByCode(input.shareCode);
        if (!session || session.status !== "open") throw new TRPCError({ code: "BAD_REQUEST", message: "这个投票已经结束或链接无效。" });
        if (!session.options.some((option) => option.id === input.optionId)) throw new TRPCError({ code: "BAD_REQUEST", message: "请选择有效候选项。" });
        await addSharedDecisionMember(session.id, ctx.user.id);
        await castDecisionVote(session.id, ctx.user.id, input.optionId);
        return { success: true } as const;
      }),
    resolve: protectedProcedure
      .input(z.object({ shareCode: z.string().min(6).max(16) }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSharedDecisionByCode(input.shareCode);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "这个投票已不存在或链接无效。" });
        if (session.creatorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "只有发起人可以结束投票。" });
        const votes = await getDecisionVotes(session.id);
        const final = resolveVoteOutcome(session.options, votes);
        await resolveSharedDecision(session.id, final.option.id, final.reason);
        return { option: final.option, reason: final.reason, outcome: final.outcome };
      }),
  }),
  media: router({
    browse: publicProcedure
      .input(z.object({ kind: z.enum(["movie", "tv"]), query: z.string().trim().max(120).optional() }))
      .query(({ input }) => browseMedia(input.kind, input.query)),
  }),
});

export type AppRouter = typeof appRouter;
