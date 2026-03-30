import dotenv from "dotenv"
dotenv.config()

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY
const HUGGINGFACE_BASE_URL =
    process.env.HUGGINGFACE_BASE_URL || "https://router.huggingface.co/v1/chat/completions"
const defaultModel =
    process.env.HUGGINGFACE_DEFAULT_MODEL || "Qwen/Qwen2.5-Coder-32B-Instruct"

export const generateResponse = async (prompt, modelOverride = defaultModel) => {
    if (!HUGGINGFACE_API_KEY) throw new Error("HUGGINGFACE_API_KEY is missing in .env")

    const response = await fetch(HUGGINGFACE_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
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
        throw new Error(`HuggingFace API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    if (!content) {
        throw new Error("HuggingFace API error: empty completion content")
    }

    return content
}
