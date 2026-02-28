import { router, activeSubscriptionProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/lib/db";
import { askRag } from "@/lib/rag-client";
import { TRPCError } from "@trpc/server";
import { QUERY_DAILY_LIMIT } from "@/lib/subscription";

export const queryRouter = router({
  ask: activeSubscriptionProcedure
    .input(z.object({ question: z.string().min(10).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      // Reset monthly counter if new month
      const now = new Date();
      const resetDate = new Date(user.queryResetDate);
      if (
        now.getMonth() !== resetDate.getMonth() ||
        now.getFullYear() !== resetDate.getFullYear()
      ) {
        await db.user.update({
          where: { id: user.id },
          data: { queriesThisMonth: 0, queryResetDate: now },
        });
        user.queriesThisMonth = 0;
      }

      if (user.queriesThisMonth >= QUERY_DAILY_LIMIT * 30) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Monthly query limit reached",
        });
      }

      const ragResult = await askRag(input.question);

      const [savedQuery] = await db.$transaction([
        db.query.create({
          data: {
            userId: user.id,
            question: input.question,
            answer: ragResult.answer,
            citations: ragResult.citations as object[],
            llmProvider: ragResult.provider,
            latencyMs: ragResult.latency_ms,
            tokenCount: ragResult.tokens_used,
          },
        }),
        db.user.update({
          where: { id: user.id },
          data: { queriesThisMonth: { increment: 1 } },
        }),
      ]);

      return {
        id: savedQuery.id,
        answer: ragResult.answer,
        citations: ragResult.citations,
        provider: ragResult.provider,
        latencyMs: ragResult.latency_ms,
      };
    }),

  getHistory: activeSubscriptionProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      const { cursor, limit } = input;

      const queries = await db.query.findMany({
        where: { userId: user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          question: true,
          answer: true,
          citations: true,
          llmProvider: true,
          latencyMs: true,
          createdAt: true,
        },
      });

      let nextCursor: string | undefined;
      if (queries.length > limit) {
        const next = queries.pop();
        nextCursor = next?.id;
      }

      return { queries, nextCursor };
    }),
});
