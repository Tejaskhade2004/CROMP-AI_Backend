import dotenv from "dotenv"
dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
const defaultModel = process.env.GEMINI_DEFAULT_MODEL || "gemma-4-26b-a4b-it"

const normalizeGeminiModel = (model) => {
    if (typeof model !== "string") return defaultModel
    return model.startsWith("gemini/") ? model.slice("gemini/".length) : model
}

const extractGeminiText = (content) => {
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

const convertMessagesToGeminiFormat = (messages) => {
    return messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
    }))
}

const requestGeminiChatCompletion = async ({ messages, model, temperature = 0.2, max_tokens = 16384 }) => {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in .env")

    const normalizedModel = normalizeGeminiModel(model)
    const url = `${GEMINI_BASE_URL}/${normalizedModel}:generateContent?key=${GEMINI_API_KEY}`

    const geminiMessages = convertMessagesToGeminiFormat(messages)

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: geminiMessages,
            generationConfig: {
                temperature,
                maxOutputTokens: max_tokens
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    // Extract text from candidates, filtering out thinking parts
    let textContent = ""
    if (data?.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts
        textContent = parts
            .filter(part => !part.thought) // Skip thinking/reasoning parts
            .map(part => part.text || "")
            .filter(text => text.trim())
            .join("\n")
    }

    if (!textContent) {
        throw new Error("Gemini API error: empty completion content")
    }

    return textContent
}

const extractJsonFromMarkdown = (text) => {
    if (!text) return null
    
    // Try parsing as-is first
    try {
        return JSON.parse(text.trim())
    } catch (e) {
        // If it fails, look for JSON in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim())
            } catch {
                // If that fails, try extracting the first { ... } block
                const braceMatch = text.match(/\{[\s\S]*\}/);
                if (braceMatch) {
                    try {
                        return JSON.parse(braceMatch[0])
                    } catch {
                        return null
                    }
                }
            }
        }
        return null
    }
}

export const generateResponse = async (prompt, modelOverride = defaultModel, options = {}) => {
    const responseText = await requestGeminiChatCompletion({
        model: modelOverride,
        messages: [
            {
                role: "system",
                content:
                    "You are a helpful website code generator. CRITICAL: You must respond with ONLY valid raw JSON, no markdown, no explanations, no code blocks. The JSON must contain 'html', 'css', and 'js' properties with the complete code as strings."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0.2,
        max_tokens: options.maxTokens || 16384
    })

    // Try to extract JSON from the response
    const jsonResponse = extractJsonFromMarkdown(responseText)
    if (jsonResponse && typeof jsonResponse === 'object') {
        return JSON.stringify(jsonResponse)
    }

    // If JSON extraction fails, assume the response is the raw content
    // and throw an error with the actual response for debugging
    if (!responseText.includes('{')) {
        throw new Error(`Gemini API returned non-JSON response: ${responseText.substring(0, 200)}`)
    }

    return responseText
}

export const generateChatResponse = async (messages, modelOverride = defaultModel, options = {}) => {
    return requestGeminiChatCompletion({
        model: modelOverride,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 8192
    })
}

export const generateChatStream = async (messages, modelOverride = defaultModel, options = {}) => {
    // Gemini doesn't support streaming in the same way, so we'll do a single request
    // and return the full response wrapped in a stream-like format
    try {
        const response = await generateChatResponse(messages, modelOverride, options)
        
        // Return an async generator that yields the full response
        return (async function* () {
            yield response
        })()
    } catch (error) {
        throw new Error(`Gemini chat stream error: ${error.message}`)
    }
}
