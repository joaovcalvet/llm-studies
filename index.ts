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

        while(true) 
        {
            const question = await rl.question('Your prompt: ');
            contents.push({ role: 'user', content: question })

            let countCalls = 0;
            while(true)
            {
                console.log("Chamadas: " + ++countCalls);
                const result = await ai.responses.create({
                    model: process.env.GROQ_MODEL!,
                    input: JSON.stringify(contents),
                    tools: tools
                });
    
                contents.push(result.output);
    
                if(result.output_text) console.log("\n\n" + result.output_text);

                let call: boolean = false;
                for(const item of result.output)
                {
                    if(item.type !== 'function_call') continue;
    
                    call = true;

                    const handler = toolMap[item.name];
                    if(handler)
                    {
                        const result = await handler(JSON.parse(item.arguments));
      
                        contents.push({
                            type: "function_call_output",
                            call_id: item.call_id,
                            output: JSON.stringify(result)
                        });
                    }
                    else
                    {
                        contents.push({
                            type: "function_call_output",
                            call_id: item.call_id,
                            output: "função não encontrada"
                        })
                    }
                }

                if(!call) break;
            }
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

interface Category {
    slug: string,
    imagem: string,
    descrgrupoprod: string,
    codgrupopai: number,
    codgrupoprod: number,
    subCategories: SubCategory[]
}

interface SubCategory {
    slug: string,
    imagem: string,
    descrgrupoprod: string,
    codgrupopai: number,
    codgrupoprod: number,
    countProducts: number,
    analitico: boolean
}

//Definição das tools
const setGetBrands = {
    type: "function" as const,
    name: "get_brands",
    description: "Endpoint utilizado para retornar todas as marcas ativas da Lindacor.",
    parameters: {
        type: "object",
        properties: {
            group: {
                type: ["number", "null"],
                description: "Identificador único (ID) de uma categoria ou sub-categoria."
            }
        },
        required: ["group"],
        additionalProperties: false
    },
    strict: true
}

const setGetCategories = {
    type: "function" as const,
    name: "get_categories",
    description: "Endpoint utilizado para retornar todas as categorias ativas da Lindacor.",
    parameters: {
        type: "object",
        properties: {
            group: {
                type: ["number", "null"],
                description: "Identificador único (ID) de uma categoria ou sub-categoria."
            }
        },
        required: ["group"],
        additionalProperties: false
    },
    strict: true
}

const setGetFactories = {
    type: "function" as const,
    name: "get_categories",
    description: "Endpoint utilizado para retornar todas as fábricas ativas da Lindacor.",
    parameters: {},
    strict: true
}

const tools = [
    setGetBrands,
    setGetCategories
];

const toolMap: Record<string, Function> = {
    get_brands: ({ group }: { group?: number }) => getBrands(group),
    get_categories: ({ group }: { group?: number }) => getCategories(group)
}

//Definição das funções
async function getBrands(group: number | undefined)
{
    let search: string = "";
    if(group != null && group !== 0) search = `/${group}`;

    const url = `${process.env.API_URL || ''}/brands${search}`;
    const init: RequestInit = {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY || '',
            'x-tenant-id': '2'
        }
    }

    const result: APIResponse & { data: Brand[] } = await (await fetch(url, init)).json();
    return result;
}

async function getCategories(group: number | undefined)
{
    let search: string = "";
    if(group != null && group !== 0) search = `/${group}`;

    const url = `${process.env.API_URL || ''}/categories${search}`;
    const init: RequestInit = {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY || '',
            'x-tenant-id': '2'
        }
    }

    const result: APIResponse & { data: Category[] | SubCategory } = await (await fetch(url, init)).json();
    return result;
}