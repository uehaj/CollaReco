/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from "zod";
import { env } from "~/env";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { Prisma } from '@prisma/client';
import { schemaForType } from "~/utils/typeUtil";
import { callLLMFromServer } from "~/utils/llm/llmFromServer";
import { TRPCError } from "@trpc/server";

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
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
      sessionId: z.string(), // 指定するセッションID
      userId: z.string(),    // 現在のユーザーID
      callLLM: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      console.log(`ctx.headers.get('remote-user')=`, ctx.headers['remote-user'])
      const userId = ctx.headers['remote-user'];
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const session = await ctx.db.session.findUnique({
        where: { id: input.sessionId },
      });
      if (!session) {
        throw new Error('指定されたSessionは存在しません');
      }
      const message = await ctx.db.message.create({
        data: {
          text: input.callLLM ? await callLLMFromServer(input.text) : input.text,
          session: {
            connect: { id: input.sessionId }
          },
          user: {
            connect: { id: input.userId, name: 'dummy' }
          }
        }
      })
      return message;
    })
});



// export const messageRouter = createRouter()
//   .mutation('addMessage', {
//     input: z.object({
//       sessionId: z.string(), // 指定するセッションID
//       userId: z.string(),    // 現在のユーザーID
//       text: z.string().min(1), // メッセージ内容（空でない）
//     }),
//     async resolve({ ctx, input }) {
//       const { sessionId, userId, text } = input;

//       // セッションが存在するかチェック
//       const session = await ctx.prisma.session.findUnique({
//         where: { id: sessionId },
//       });

//       if (!session) {
//         throw new Error('指定されたSessionは存在しません');
//       }

//       // ユーザーが存在するかチェック
//       const user = await ctx.prisma.user.findUnique({
//         where: { id: userId },
//       });

//       if (!user) {
//         throw new Error('指定されたUserは存在しません');
//       }

//       // メッセージを作成
//       const message = await ctx.prisma.message.create({
//         data: {
//           text,
//           sessionId,
//           userId,
//         },
//       });

//       return message;
//     },
//   });
