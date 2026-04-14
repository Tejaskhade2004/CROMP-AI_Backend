import dotenv from "dotenv"
dotenv.config()

const SAMBANOVA_API_KEY = process.env.SAMBANOVA_API_KEY
const SAMBANOVA_BASE_URL = process.env.SAMBANOVA_BASE_URL || "https://api.sambanova.ai/v1/chat/completions"
const defaultModel = process.env.SAMBANOVA_DEFAULT_MODEL || "DeepSeek-R1"

export const generateResponse = async (prompt, modelOverride = defaultModel, options = {}) => {
    if (!SAMBANOVA_API_KEY) throw new Error("SAMBANOVA_API_KEY is missing in .env")

    const response = await fetch(SAMBANOVA_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${SAMBANOVA_API_KEY}`,
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
            max_tokens: options.maxTokens || 16384
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Sambanova API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Sambanova API error: empty completion content")
    }

    return content
}