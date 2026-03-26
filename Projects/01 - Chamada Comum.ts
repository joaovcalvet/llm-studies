import OpenAI from "openai";

const ai = new OpenAI({
    apiKey: process.env.GROQ_KEY!,
    baseURL: process.env.GROQ_URL!
})

async function main() 
{
    const response = await ai.responses.create({
        model: "llama-3.1-8b-instant",
        input: "Boa tarde, Groq!"
    })

    console.log(JSON.stringify(response, null, 2));
}

main();