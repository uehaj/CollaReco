import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Prisma } from '@prisma/client';
import { schemaForType } from "~/utils/typeUtil";
import { callLLMFromServer } from "~/utils/llm/llmFromServer";

export type Session = Prisma.SessionUncheckedCreateInput
export const SessionSchema = schemaForType<Session>()(z.object({
  name: z.string(),
}))

export type Message = Prisma.MessageUncheckedCreateInput
export const MessageSchema = schemaForType<Message>()(z.object({
  text: z.string(),
  sessionId: z.string(),
  userId: z.string(),
}))

export const sessionRouter = createTRPCRouter({
  add: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { name } = input;
      return await ctx.db.session.create({
        data: {
          name,
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.session.findMany();
    if (sessions.length === 0) {
      const newSession = await ctx.db.session.create({
        data: {
          name: "Default Session",
        },
      });
      return [newSession];
    }
    return sessions;
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      return await ctx.db.session.delete({
        where: { id },
      });
    }),

  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.session.deleteMany();
  }),

  postMessage: protectedProcedure
    .input(z.object({
      text: z.string(),
      sessionId: z.string(),
      callLLM: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error("unauthorized");
      }
      const session = await ctx.db.session.findUnique({
        where: { id: input.sessionId },
      });
      if (!session) {
        throw new Error("session not found");
      }
      const message = await ctx.db.message.create({
        data: {
          text: input.callLLM ? await callLLMFromServer(input.text) : input.text,
          session: {
            connect: { id: input.sessionId }
          },
          user: {
            connect: { id: ctx.user.id }
          }
        }
      })
      return message;
    }),

  listMessages: protectedProcedure.input(z.object({
    sessionId: z.string()
  })).query(async ({ ctx, input }) => {
    const result = await ctx.db.message.findMany({
      where: {
        AND: {
          userId: ctx.user?.id,
          sessionId: input.sessionId
        }
      }
    });
    console.log(`result = `, result)
    return result;
  }),
});
