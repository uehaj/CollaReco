"server-only";

import { ConversationChain } from "langchain/chains";
import { ChatOpenAI, AzureChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import getConfig from 'next/config';
import { env } from "~/env";


import * as globalAgent from 'global-agent';
process.env.GLOBAL_AGENT_HTTP_PROXY = process.env.HTTP_PROXY
globalAgent.bootstrap();


const INSTRUCTION = `以下は、音声認識処理によって得られた発話ですが、
フィラーや間投詞などで実際に書き言葉としては違和感のあるものになっています。
また、同音異義語の認識誤りが含まれています。これを「読んで違和感が無いこと」を優先にして、
わかりやすいテキストに変換してください。ただし、前後の文脈であまりにも意味が通じないところは、
無理に変更せず、そのままにして、ただし文末に「(?)」を付けてください。
情報は一切追加しないでください。

前置きや後書きは不要で、変換内容だけを答えてください。
ユーザに質問しないでください。ツールや関数は使用しないでください。

### 発話者による発話

{input}
`;

export async function callLLM(userInput: string): Promise<string> {
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
            /*

            AOAI_llm = AzureChatOpenAI(
                model=llms[llm_id]['GPT_MODEL'],
                openai_api_type=llms[llm_id]['API_TYPE'],
                azure_endpoint=api_base,
                openai_api_key=api_key,
                azure_deployment=llms[llm_id]['DEPLOY_NAME'],
                openai_api_version=api_version,
                temperature=llms[llm_id]['TEMPERATURE'],
                max_tokens=llms[llm_id]['MAX_TOKENS'],
                request_timeout=60,
                streaming=True,
             */
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
        // const res = await fetch("https://api.openai.com/v1/chat/completions", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //         Authorization: `Bearer ${apiKey}`,
        //     },
        //     body: JSON.stringify({
        //         model: "gpt-4o-mini", // 使用するモデル名
        //         messages: [
        //             { role: "system", content: instructions },
        //             { role: "user", content: userInput }
        //         ],
        //     }),
        // });

        // if (!res.ok) {
        //     throw new Error(`Error: ${res.status}`);
        // }

        // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        // const data = await res.json();
        // // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        // return data.choices[0].message.content;
        return res;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw Error("APIエラーが発生しました。");
    }
};
