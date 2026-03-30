import dotenv from "dotenv"
dotenv.config()


const openrouterUrl = "https://openrouter.ai/api/v1/chat/completions"
const openrouterApiKey = process.env.OPENROUTERAPI
// const model = "nvidia/nemotron-3-super-120b-a12b:free"
// const model = "stepfun/step-3.5-flash:free"
const model = process.env.OPENROUTER_DEFAULT_MODEL || "minimax/minimax-m2.5:free"
// const model = "z-ai/glm-4.5-air:free"
// const model = "arcee-ai/trinity-large-preview:free"
// const model = "deepseek/deepseek-chat"
const providerOrder = (process.env.OPENROUTER_PROVIDERS || "OpenInference")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean)


export const generateResponse = async (prompt, modelOverride) => {
    if (!openrouterApiKey) throw new Error("OPENROUTERAPI is missing in .env");
    const modelToUse = modelOverride || model
    const sendRequest = async (withProvider = true) => fetch(openrouterUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${openrouterApiKey}`,

            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelToUse,
            messages: [
                { role: 'system', content: 'You are a helpful assistant that helps to generate code for websites based on user prompts. You must written valid raw JSON ' },

                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.2,
            ...(withProvider ? {
                provider: {
                    order: providerOrder,
                    allow_fallbacks: true
                }
            } : {})
        }),
    });

    let response = await sendRequest(true)

    if (!response.ok) {
        const err = await response.text();
        const providerRoutingError = err.includes("No allowed providers are available for the selected model")

        if (providerRoutingError) {
            response = await sendRequest(false)
            if (!response.ok) {
                const retryError = await response.text();
                throw new Error("OpenRouter API error" + retryError);
            }
        } else {
            throw new Error("OpenRouter API error" + err);
        }
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
        throw new Error("OpenRouter API error: empty completion content")
    }
    return content;


}
