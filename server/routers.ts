import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { createDecisionRecord, getRecentDecisionRecords } from "./db";
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
});

export type AppRouter = typeof appRouter;
