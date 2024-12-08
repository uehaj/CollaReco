import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { callLLM } from "~/utils/llm/llm";

const posts: { text: string }[] = [];

export const postRouter = createTRPCRouter({
  add: publicProcedure
    .input(z.object({ text: z.string() }))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .mutation(async ({ ctx, input }) => {
      console.log(`accepted text =`, input)
      const newPost = {
        text: input.text,
      };
      const result = await callLLM(input.text)
      console.log(`result = `, result)
      posts.push(newPost);
      return { text: result };
    }),
});

