import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_LLM_MODEL: z.string().optional(),

    AZURE_API_KEY: z.string().optional(),
    AZURE_API_BASE: z.string().url().optional(),
    AZURE_API_VERSION: z.string().optional(),
    AZURE_DEPLOYEMENT_NAME: z.string().optional(),
    AZURE_LLM_MODEL: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_WEBSOCKET_URL: z.string().url(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_LLM_MODEL: process.env.OPENAI_LLM_MODEL,

    AZURE_API_KEY: process.env.AZURE_API_KEY,
    AZURE_API_BASE: process.env.AZURE_API_BASE,
    AZURE_API_VERSION: process.env.AZURE_API_VERSION,
    AZURE_DEPLOYEMENT_NAME: process.env.AZURE_DEPLOYEMENT_NAME,
    AZURE_LLM_MODEL: process.env.AZURE_LLM_MODEL,

    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
