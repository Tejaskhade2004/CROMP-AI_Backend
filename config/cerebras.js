import dotenv from "dotenv"
dotenv.config()

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY
const CEREBRAS_BASE_URL = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1/chat/completions"
const defaultModel = process.env.CEREBRAS_DEFAULT_MODEL || "llama3.3-70b"

export const generateResponse = async (prompt, modelOverride = defaultModel) => {
    if (!CEREBRAS_API_KEY) throw new Error("CEREBRAS_API_KEY is missing in .env")

    const response = await fetch(CEREBRAS_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${CEREBRAS_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: modelOverride,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that helps to generate code for websites based on user prompts. You must return valid raw JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 16384
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cerebras API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Cerebras API error: empty completion content")
    }

    return content
}