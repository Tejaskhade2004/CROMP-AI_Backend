import dotenv from "dotenv"
dotenv.config()

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const MISTRAL_BASE_URL =
    process.env.MISTRAL_BASE_URL || "https://api.mistral.ai/v1/chat/completions"
const defaultModel = process.env.MISTRAL_DEFAULT_MODEL || "codestral-latest"

const normalizeMistralModel = (model) => {
    if (typeof model !== "string") return defaultModel
    return model.startsWith("mistral/") ? model.slice("mistral/".length) : model
}

const extractMistralText = (content) => {
    if (typeof content === "string") {
        return content.trim()
    }

    if (Array.isArray(content)) {
        const textParts = content
            .map((item) => {
                if (typeof item === "string") return item
                if (item?.type === "text" && typeof item?.text === "string") return item.text
                if (typeof item?.content === "string") return item.content
                return ""
            })
            .filter(Boolean)

        return textParts.join("\n").trim()
    }

    if (content && typeof content === "object" && typeof content.text === "string") {
        return content.text.trim()
    }

    return ""
}

const requestMistralChatCompletion = async ({ messages, model, temperature = 0.2, max_tokens = 16384 }) => {
    if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY is missing in .env")

    const response = await fetch(MISTRAL_BASE_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: normalizeMistralModel(model),
            messages,
            temperature,
            max_tokens
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Mistral API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    const text = extractMistralText(content)

    if (!text) {
        throw new Error("Mistral API error: empty completion content")
    }

    return text
}

export const generateResponse = async (prompt, modelOverride = defaultModel, options = {}) => {
    return requestMistralChatCompletion({
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
}

export const generateChatResponse = async (messages, modelOverride = defaultModel, options = {}) => {
    return requestMistralChatCompletion({
        model: modelOverride,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 8192
    })
}
