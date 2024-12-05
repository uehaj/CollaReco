"server-only";

export const instructions = `
以下は、音声認識処理によって得られた発話列ですが、フィラーや間投詞などで実際に書き言葉としては
違和感のあるものになっています。また、同音異義語の認識誤りが含まれています。
これを、「読んで違和感が無いこと」を優先にして、わかりやすいテキストに変換してください。
ただし、前後の文脈で意味が通じないところは、無理に変更せず、そのままにして文末に「(?)」を付けてください。
情報は一切追加しないでください。

前置きや後書きは不要で、変換内容だけを答えてください。
ユーザに質問しないでください。ツールや関数は使用しないでください。。

`;

export async function callLLM(userInput: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
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
                    { role: "system", content: instructions },
                    { role: "user", content: userInput }
                ],
            }),
        });

        if (!res.ok) {
            throw new Error(`Error: ${res.status}`);
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        throw Error("APIエラーが発生しました。");
    }
};
