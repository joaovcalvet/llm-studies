import { OpenAI } from "openai";

//Preparação para a funcionalidade
//Define os conteúdos da conversa
const contents: any[] = [{
    role: 'user',
    content: 'Qual a soma de 27 e (3 x -9)?'
}];

//Define a função
const setSumFunctionDeclaration = {
    type: 'function' as const,
    name: 'sum',
    description: `Realiza a soma de dois números. 
Retorna um objeto JSON com:
- "sum": o resultado numérico da soma
- "message": uma string indicando se o resultado é par, ímpar, ou zero`,
    parameters: {
        type: "object",
        properties: {
            num_1: {
                type: "number",
                description: "Primeiro valor a ser somado"
            },
            num_2: {
                type: "number",
                description: "Segundo valor a ser somado"
            },
        },
        required:  ['num_1', 'num_2'],
        additionalProperties: false
    },
    strict: true
};

/**
*   Realiza a soma de dois valores.
*   @param {number} num_1 - Primeiro valor a ser somado.
*   @param {number} num_2 - Segundo valor a ser somado.
*   @return {Object} Um objeto contendo o valor da soma e uma mensagem dizendo se é par, ímpar ou se deu zero.
*/
function sum(num_1: number, num_2: number): {sum: number, message: string}
{
    const sum = num_1 + num_2;
    let message = "";

    if(sum % 2 === 0) message = "É par!";
    else message = "É ímpar!" ;

    if(sum === 0) message = "Caramba, deu zero!";

    return {
        sum,
        message
    }
}

//Inicialização do Chat
const ai = new OpenAI({
    apiKey: process.env.GROQ_KEY,
    baseURL: process.env.GROQ_URL,
})

async function main() 
{
    const response = await ai.responses.create({
        model: process.env.GROQ_MODEL!,
        input: contents,
        tools: [ setSumFunctionDeclaration ]
    });

    contents.push(...response.output)

    for(const item of response.output)
    {
        if(item.type !== "function_call") continue;

        if(item.name === "sum")
        {
            const args = JSON.parse(item.arguments);
            const result = sum(args.num_1, args.num_2);

            contents.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: JSON.stringify(result)
            });
        }
    }

    const finalResponse = await ai.responses.create({
        model: process.env.GROQ_MODEL!,
        input: contents,
        tools: [ setSumFunctionDeclaration ]
    });

    console.log(finalResponse.output_text);
}

main();