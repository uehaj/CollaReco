/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { z } from "zod";
import { env } from "~/env";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Prisma } from '@prisma/client';

export type Session = Prisma.SessionCreateInput

export const sessionRouter = createTRPCRouter({
  add: publicProcedure
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
  list: publicProcedure.query(async ({ ctx }) => {
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
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      return await ctx.db.session.delete({
        where: { id },
      });
    }),
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.session.deleteMany();
  }),
});

