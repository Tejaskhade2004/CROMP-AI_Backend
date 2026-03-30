import dotenv from "dotenv"
dotenv.config()

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_BASE_URL =
    process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1/chat/completions"
const defaultModel = process.env.MISTRAL_DEFAULT_MODEL || "codestral-latest"

export const generateResponse = async (prompt, modelOverride = defaultModel) => {
    if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY is missing in .env")

    const response = await fetch(MISTRAL_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${MISTRAL_API_KEY}`,
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
        throw new Error(`Mistral API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Mistral API error: empty completion content")
    }

    return content
}
