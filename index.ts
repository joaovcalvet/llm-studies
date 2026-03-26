import { GoogleGenAI, Type } from "@google/genai";

//Preparação para a funcionalidade
//Define os conteúdos da conversa
const contents: any = [{
    role: 'user',
    parts: [{ text: 'Some os valores 3 + 3 e me diga a mensagem retornada no campo "message"' }]
}];

//Define a função que o modelo irá chamar para fazer a soma
const setSumFunctionDeclaration = {
    name: 'sum',
    description: `Realiza a soma de dois números. 
Retorna um objeto JSON com:
- "sum": o resultado numérico da soma
- "message": uma string indicando se o resultado é par, ímpar, ou zero`,
    parameters: {
        type: Type.OBJECT,
        properties: {
            num_1: {
                type: Type.NUMBER,
                description: "Primeiro valor a ser somado"
            },
            num_2: {
                type: Type.NUMBER,
                description: "Segundo valor a ser somado"
            },
        },
        required:  ['num_1', 'num_2']
    }
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
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_KEY!});

async function main() 
{
    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL!,
        contents,
        config: {
            tools: [{
                functionDeclarations: [setSumFunctionDeclaration]
            }]
        }
    });

    console.log(JSON.stringify(response, null, 2));

    let result = null;
    const tool = response.functionCalls![0];

    if(tool!.name === 'sum')
    {
        const args = tool!.args as {num_1: number, num_2: number};
        result = sum(args.num_1, args.num_2);

        console.log("Resultado da função: ", result);
    }

    const functionResponsePart = {
        name: tool?.name,
        response: { result },
        id: tool?.id
    };

    const candidate = response.candidates!;

    contents.push(candidate[0]?.content);
    contents.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });

    const finalResponse = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL!,
        contents,
        config: {
            tools: [{
                functionDeclarations: [setSumFunctionDeclaration]
            }]
        }
    })

    console.log(JSON.stringify(finalResponse, null, 2));
}

main();