import dotenv from "dotenv"
dotenv.config()

const GITHUB_MODELS_API_KEY = process.env.GITHUB_MODELS_API_KEY
const GITHUB_MODELS_BASE_URL = process.env.GITHUB_MODELS_BASE_URL || "https://models.github.ai/inference/chat/completions"
const defaultModel = process.env.GITHUB_MODELS_DEFAULT_MODEL || "gpt-4o-mini"

export const generateResponse = async (prompt, modelOverride = defaultModel) => {
    if (!GITHUB_MODELS_API_KEY) throw new Error("GITHUB_MODELS_API_KEY is missing in .env")

    const response = await fetch(GITHUB_MODELS_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${GITHUB_MODELS_API_KEY}`,
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
        throw new Error(`GitHub Models API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("GitHub Models API error: empty completion content")
    }

    return content
}