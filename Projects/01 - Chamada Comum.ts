import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_KEY!});

async function main() 
{
    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL!,
        contents: "Bom dia, Gemini!"
    })

    console.log(JSON.stringify(response, null, 2));
}

main();