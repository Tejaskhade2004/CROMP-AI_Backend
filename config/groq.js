import dotenv from "dotenv"
dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions"
const defaultModel = process.env.GROQ_DEFAULT_MODEL || "llama-3.1-8b-instant"

export const generateResponse = async (prompt, modelOverride = defaultModel, options = {}) => {
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing in .env")

    const response = await fetch(GROQ_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
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
        throw new Error(`Groq API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Groq API error: empty completion content")
    }

    return content
}
