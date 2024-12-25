import 'server-only';

// import { ConversationChain } from "langchain/chains";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { DEFAULT_INSTRUCTION } from './prompt'
import { env } from "~/env";

import * as globalAgent from 'global-agent';

if (process.env.HTTP_PROXY) {
    process.env.GLOBAL_AGENT_HTTP_PROXY = process.env.HTTP_PROXY
    globalAgent.bootstrap();
}

const INSTRUCTION = DEFAULT_INSTRUCTION;

export async function callLLMFromServer(userInput: string): Promise<string> {
    console.log(`callLLMFromServer(${userInput})`)
    try {
        const prompt = ChatPromptTemplate.fromMessages([{ role: "user", content: INSTRUCTION }]);
        let llm;
        if (env.OPENAI_API_KEY) {
            llm = new ChatOpenAI({
                openAIApiKey: env.OPENAI_API_KEY,
                model: env.OPENAI_LLM_MODEL ?? "gpt-4o-mini",
                temperature: 0
            });
        }
        else if (env.AZURE_API_KEY) {
            llm = new AzureChatOpenAI({
                openAIApiKey: env.AZURE_API_KEY,
                openAIApiVersion: env.AZURE_API_VERSION,
                azureOpenAIEndpoint: env.AZURE_API_BASE,
                azureOpenAIApiDeploymentName: env.AZURE_DEPLOYEMENT_NAME,
                model: env.AZURE_LLM_MODEL ?? "gpt-4o-mini",
                temperature: 0
            });
        }
        else {
            console.error("API Key is not set.");
            throw new Error("APIキーが設定されていません。");
        }

        const parser = new StringOutputParser();
        const chain = prompt.pipe(llm).pipe(parser)
        const res = await chain.invoke({ input: userInput });
        console.log(`llm answer = `, res)
        return res;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw Error("APIエラーが発生しました。");
    }
};
