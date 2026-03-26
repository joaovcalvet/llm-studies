import OpenAI from "openai";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from 'node:process';

const ai = new OpenAI({
    apiKey: process.env.GROQ_KEY!,
    baseURL: process.env.GROQ_URL!
});

const rl = readline.createInterface({ input, output });

async function main()
{
    try {
        const contents: any = [];

        while(true) {
            const question = await rl.question('Your prompt: ');
            contents.push({ role: 'user', content: question })

            const result = await ai.responses.create({
                model: process.env.GROQ_MODEL!,
                input: JSON.stringify(contents),
                tools: tools
            });

            contents.push(result.output);

            for(const item of result.output)
            {
                if(item.type !== 'function_call') continue;

                const handler = toolMap[item.name];
                if(handler)
                {
                    const result = await handler();
  
                    contents.push({
                        type: "function_call_output",
                        call_id: item.call_id,
                        output: JSON.stringify(result)
                    });

                    break;
                }
            }

            const finalResult = await ai.responses.create({
                model: process.env.GROQ_MODEL!,
                input: JSON.stringify(contents),
                tools
            })

            console.log(finalResult.output_text);
        }
    } finally {
        rl.close();
    }
}

main().catch(error => {
    console.log(error);
});

//Definição das interfaces
interface APIResponse {
    success: boolean,
    message: string,
    data?: any
}

interface Brand {
    codmarcarmd: number,
    countProducts: number,
    slug: string,
    descrmarcarmd: string,
}

//Definição das tools
const setGetBrands = {
    type: "function" as const,
    name: "get_brands",
    description: "Endpoint utilizado para retornar todas as marcas ativas da Lindacor.",
    parameters: {},
    strict: true
}

const tools = [
    setGetBrands
];

const toolMap: Record<string, Function> = {
    get_brands: () => getBrands()
}

//Definição das funções
async function getBrands()
{
    const url = "https://8nyb7laid8.execute-api.us-east-1.amazonaws.com/v1/brands";
    const init: RequestInit = {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': '6Be4QUaU023RqEqsh7ftV7lINnCKr4fk267ct6IH',
            'x-tenant-id': '2'
        }
    }

    const result: APIResponse & { data: Brand[] } = await (await fetch(url, init)).json();
    return result;
}