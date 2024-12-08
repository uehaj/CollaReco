"use client";

import { DEFAULT_INSTRUCTION } from './prompt'

export async function callLLMFromClient(userInput: string, apiKey?: string): Promise<string> {
    console.log(`callLLMFromClient(${userInput})`)
    if (!apiKey) {
        console.log(`passthrough -> `, userInput)
        return userInput;
    }
    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // 使用するモデル名
                messages: [
                    { role: "system", content: DEFAULT_INSTRUCTION },
                    { role: "user", content: userInput }
                ],
            }),
        });

        if (!res.ok) {
            throw new Error(`Error: ${res.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const answer = data.choices[0].message.content;
        console.log(`client llm call answer -> `, answer)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return answer;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw Error("APIエラーが発生しました。");
    }
};


