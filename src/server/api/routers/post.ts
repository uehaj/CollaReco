import { z } from "zod";
import { env } from "~/env";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { callLLMFromServer } from "~/utils/llm/llmFromServer";

const posts: { text: string }[] = [];

export const postRouter = createTRPCRouter({
  config: publicProcedure.input(z.void()).query(() => {
    return {
      serverSideApiKeyEnabled: !!(env.OPENAI_API_KEY ?? env.AZURE_API_KEY)
    }
  }),
  add: publicProcedure
    .input(z.object({ text: z.string(), callLLM: z.boolean() }))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .mutation(async ({ ctx, input }) => {
      console.log(`accepted text =`, input)
      const newPost = {
        text: input.text,
      };
      const result = input.callLLM ? await callLLMFromServer(input.text) : input.text
      console.log(`tRPC add, callLLM = ${input.callLLM} result = `, result)
      posts.push(newPost);
      return { text: result };
    }),
});
