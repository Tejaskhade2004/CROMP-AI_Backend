import dotenv from "dotenv"
dotenv.config()

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY

const parseJsonSafely = (rawText) => {
    try {
        return JSON.parse(rawText)
    } catch {
        return null
    }
}

const readApiResponse = async (response) => {
    const rawText = await response.text()
    const data = parseJsonSafely(rawText)
    return { rawText, data }
}

const getApiErrorMessage = (parsed, rawText, fallback = "Unknown provider error") => {
    if (parsed?.error?.message) return parsed.error.message
    if (typeof parsed?.error === "string") return parsed.error
    if (parsed?.message) return parsed.message
    if (rawText && rawText.trim()) return rawText.slice(0, 500)
    return fallback
}

const extractContentFromSse = (rawText) => {
    if (!rawText || typeof rawText !== "string") return ""
    const lines = rawText.split("\n")
    let fullContent = ""

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue
        const payload = trimmed.slice(6)
        if (!payload || payload === "[DONE]") continue

        const parsed = parseJsonSafely(payload)
        if (!parsed) continue

        const delta = parsed?.choices?.[0]?.delta?.content
        const message = parsed?.choices?.[0]?.message?.content
        const text = parsed?.choices?.[0]?.text
        const content = delta || message || text || ""
        if (content) fullContent += content
    }

    return fullContent.trim()
}

const extractCompletionContent = (data, rawText) => {
    const jsonContent =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        data?.content ||
        ""

    if (typeof jsonContent === "string" && jsonContent.trim()) {
        return jsonContent.trim()
    }

    const sseContent = extractContentFromSse(rawText)
    if (sseContent) return sseContent

    if (typeof rawText === "string") {
        const trimmed = rawText.trim()
        if (trimmed && !trimmed.startsWith("<")) {
            return trimmed
        }
    }

    return ""
}

// ============ CONTENT GENERATION ============
export const generateContent = async (prompt, type = 'general') => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const systemPrompts = {
        'movie-description': 'You are a professional movie critic and writer. Generate an engaging, detailed movie description based on the user prompt.',
        'movie-review': 'You are an expert film critic. Write a comprehensive and balanced movie review based on the user prompt. Include pros, cons, and a rating.',
        'plot-summary': 'You are a skilled screenwriter. Create a compelling plot summary based on the user prompt. Make it engaging and detailed.',
        'character-analysis': 'You are a character development expert. Analyze and describe characters based on the user prompt.',
        'screenplay': 'You are a professional screenwriter. Write a screenplay section based on the user prompt.',
        'movie-trivia': 'You are a movie trivia expert. Generate interesting trivia facts related to the user prompt.'
    }

    const systemPrompt = systemPrompts[type] || systemPrompts['movie-description']

    try {
        const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-2-70b-chat-hf",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000,
                top_p: 0.9
            })
        })

        const { rawText, data } = await readApiResponse(response)

        if (!response.ok) {
            const message = getApiErrorMessage(data, rawText, "Failed to call NVIDIA content endpoint")
            throw new Error(`NVIDIA API error (${response.status}): ${message}`)
        }

        const content = extractCompletionContent(data, rawText)
        if (!content) {
            const detail = getApiErrorMessage(data, rawText, "Empty completion content")
            throw new Error(`NVIDIA API error: ${detail}`)
        }

        return content
    } catch (error) {
        console.error('Content generation error:', error)
        throw error
    }
}

// ============ IMAGE GENERATION ============
export const generateImage = async (prompt, model = 'text-to-image', numberOfImages = 2) => {
    if (!HUGGINGFACE_API_KEY) throw new Error("HUGGINGFACE_API_KEY is missing in .env")

    const modelIdentifier = model === 'flux-pro' 
        ? "black-forest-labs/FLUX.1-pro"
        : "stabilityai/stable-diffusion-xl-base-1.0"

    try {
        const images = []

        for (let i = 0; i < numberOfImages; i++) {
            const response = await fetch(
                `https://api-inference.huggingface.co/models/${modelIdentifier}`,
                {
                    headers: {
                        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: prompt,
                        parameters: {
                            height: 768,
                            width: 1024,
                            num_inference_steps: 30
                        }
                    }),
                }
            )

            if (!response.ok) {
                const { rawText, data } = await readApiResponse(response)
                const message = getApiErrorMessage(data, rawText, "Failed to call image endpoint")
                throw new Error(`Image generation failed: ${message}`)
            }

            const blob = await response.blob()
            const base64 = await blobToBase64(blob)
            images.push(base64)
        }

        return images
    } catch (error) {
        console.error('Image generation error:', error)
        throw error
    }
}

// ============ RESEARCH GENERATION ============
export const generateResearch = async (query, type = 'movie-research') => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const systemPrompts = {
        'movie-research': 'You are a professional entertainment researcher. Conduct thorough research based on the user query and provide detailed, factual information.',
        'actor-biography': 'You are a film industry expert biographer. Write a comprehensive biography based on the user query.',
        'director-analysis': 'You are a film studies scholar. Analyze and provide insights about directors based on the user query.',
        'genre-analysis': 'You are a genre expert in film. Analyze movie genres and provide detailed insights based on the user query.',
        'market-analysis': 'You are a film industry analyst. Analyze box office trends and market data based on the user query.',
        'industry-trends': 'You are an entertainment industry analyst. Identify and explain current industry trends based on the user query.'
    }

    const systemPrompt = systemPrompts[type] || systemPrompts['movie-research']

    try {
        const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct-v0.1",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: query
                    }
                ],
                temperature: 0.6,
                max_tokens: 2500,
                top_p: 0.9
            })
        })

        const { rawText, data } = await readApiResponse(response)

        if (!response.ok) {
            const message = getApiErrorMessage(data, rawText, "Failed to call NVIDIA research endpoint")
            throw new Error(`NVIDIA API error (${response.status}): ${message}`)
        }

        const content = extractCompletionContent(data, rawText)
        if (!content) {
            const detail = getApiErrorMessage(data, rawText, "Empty completion content")
            throw new Error(`NVIDIA API error: ${detail}`)
        }

        return content
    } catch (error) {
        console.error('Research generation error:', error)
        throw error
    }
}

// ============ UTILITY FUNCTIONS ============
const blobToBase64 = (blob) => {
    return blob.arrayBuffer().then((buffer) => {
        const mimeType = blob.type || "image/png"
        const base64 = Buffer.from(buffer).toString("base64")
        return `data:${mimeType};base64,${base64}`
    })
}
