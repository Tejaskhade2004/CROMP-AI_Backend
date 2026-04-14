import dotenv from "dotenv"
import { generateChatResponse as generateMistralChatResponse } from "./mistral.js"
import { getUnifiedModelCatalog } from "./model-catalog.js"
dotenv.config()

const AICC_API_KEY = process.env.AICC_API_KEY
const AICC_BASE_URL = "https://api.ai.cc/v1"
const AICC_CHAT_FALLBACK_MODEL = process.env.AICC_CHAT_FALLBACK_MODEL || "mistral/mistral-small-latest"

const DEFAULT_TEXT_MODEL = process.env.AICC_TEXT_MODEL || "gpt-4o-mini"

const isMistralModel = (model) => typeof model === "string" && model.startsWith("mistral/")

const parseJsonSafely = (value) => {
    try {
        return JSON.parse(value)
    } catch {
        if (typeof value !== "string") return null
        const trimmed = value.trim()
        const firstBrace = trimmed.indexOf("{")
        const lastBrace = trimmed.lastIndexOf("}")
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            const candidate = trimmed.slice(firstBrace, lastBrace + 1)
            try {
                return JSON.parse(candidate)
            } catch {
                return null
            }
        }
        return null
    }
}

const getAuthHeaders = () => {
    if (!AICC_API_KEY) {
        throw new Error("AICC_API_KEY is missing in .env")
    }
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AICC_API_KEY}`
    }
}

const requestAicc = async (endpoint, payload) => {
    if (!AICC_API_KEY) {
        throw new Error("AICC_API_KEY is missing in .env")
    }

    const response = await fetch(`${AICC_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`AICC API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data
}

const extractTextOutput = (data) => {
    const content = data?.choices?.[0]?.message?.content
    if (typeof content === "string" && content.trim()) {
        return content.trim()
    }

    if (Array.isArray(content)) {
        const text = content
            .map((item) => {
                if (typeof item === "string") return item
                if (item?.type === "text" && typeof item?.text === "string") return item.text
                if (typeof item?.content === "string") return item.content
                return ""
            })
            .filter(Boolean)
            .join("\n")
            .trim()

        if (text) return text
    }

    return ""
}

const normalizeChatMessages = (messages = []) => {
    if (!Array.isArray(messages)) return []

    return messages
        .map((msg) => {
            const role = msg?.role
            const rawContent = msg?.content
            const content = typeof rawContent === "string" ? rawContent.trim() : ""

            if (!["system", "user", "assistant"].includes(role)) return null

            // Mistral rejects assistant messages that do not contain content/tool_calls.
            if (role === "assistant" && !content) return null

            // User/System messages without content are not useful in prompt context.
            if ((role === "user" || role === "system") && !content) return null

            return { role, content }
        })
        .filter(Boolean)
}

const CONTENT_PROMPTS = {
    "movie-description": "You are a creative entertainment writer. Generate an engaging, vivid movie description with strong storytelling and clear structure.",
    "movie-review": "You are a professional film critic. Write a balanced and insightful review with strengths, weaknesses, and final verdict.",
    "plot-summary": "You are a screenplay analyst. Produce a concise but compelling plot summary with clear beginning, conflict, and resolution.",
    "character-analysis": "You are a character development expert. Provide a deep analysis of motivations, arc, and narrative role.",
    "screenplay": "You are a screenplay writer. Write in screenplay style with scene setup, action beats, and natural dialogue.",
    "movie-trivia": "You are a film trivia specialist. Provide interesting and accurate trivia in clear bullet points.",
    "dialogue-writing": "You are a dialogue coach. Produce natural and emotionally layered dialogue.",
    "scene-description": "You are a cinematic visual storyteller. Describe scene atmosphere, camera language, and mood in detail."
}

const RESEARCH_PROMPTS = {
    "movie-research": "You are a research analyst. Provide factual, structured movie research with headings and bullet points where useful.",
    "actor-biography": "You are a biography researcher. Provide a concise, factual actor profile including career highlights and impact.",
    "director-analysis": "You are a film studies researcher. Analyze director style, recurring themes, and influence.",
    "genre-analysis": "You are a cinema researcher. Explain genre origins, traits, key examples, and evolution.",
    "market-analysis": "You are a media market analyst. Provide data-aware analysis of box office and audience trends.",
    "industry-trends": "You are an entertainment industry analyst. Summarize current trends and likely short-term developments.",
    "cinematography-analysis": "You are a cinematography researcher. Analyze visual language, lighting, composition, and movement.",
    "soundtrack-analysis": "You are a soundtrack researcher. Analyze score style, emotional role, and notable themes."
}

const ADVANCED_PROMPTS = {
    "advanced-content": "You are a premium long-form writer. Produce high-quality, polished, and well-structured output.",
    "screenplay-advanced": "You are an award-winning screenwriter. Produce production-ready screenplay content.",
    "book-adaptation": "You are an adaptation specialist. Provide a detailed adaptation strategy from book to screen.",
    "marketing-campaign": "You are an entertainment marketer. Build a multi-channel campaign strategy with clear execution steps.",
    "franchise-strategy": "You are a franchise strategist. Propose universe expansion, timeline, and long-term growth strategy."
}

export const generateContent = async (prompt, type = "movie-description", model = DEFAULT_TEXT_MODEL) => {
    const systemPrompt = CONTENT_PROMPTS[type] || CONTENT_PROMPTS["movie-description"]

    if (isMistralModel(model)) {
        const content = await generateMistralChatResponse([
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ], model, { temperature: 0.8, max_tokens: 4096 })

        return {
            content,
            model,
            type,
            timestamp: new Date().toISOString()
        }
    }
    
    const data = await requestAicc("/chat/completions", {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4096
    })

    const content = extractTextOutput(data)
    if (!content) {
        throw new Error("AICC returned empty completion content")
    }

    return {
        content,
        model: model,
        type,
        timestamp: new Date().toISOString()
    }
}

export const generateResearch = async (query, type = "movie-research", model = DEFAULT_TEXT_MODEL) => {
    const systemPrompt = RESEARCH_PROMPTS[type] || RESEARCH_PROMPTS["movie-research"]

    if (isMistralModel(model)) {
        const content = await generateMistralChatResponse([
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
        ], model, { temperature: 0.35, max_tokens: 4096 })

        return {
            content,
            model,
            type,
            timestamp: new Date().toISOString()
        }
    }
    
    const data = await requestAicc("/chat/completions", {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
        ],
        temperature: 0.35,
        max_tokens: 4096
    })

    const content = extractTextOutput(data)
    if (!content) {
        throw new Error("AICC returned empty completion content")
    }

    return {
        content,
        model: model,
        type,
        timestamp: new Date().toISOString()
    }
}

export const generateAdvanced = async (prompt, type = "advanced-content", model = DEFAULT_TEXT_MODEL) => {
    const systemPrompt = ADVANCED_PROMPTS[type] || ADVANCED_PROMPTS["advanced-content"]

    if (isMistralModel(model)) {
        const content = await generateMistralChatResponse([
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ], model, { temperature: 0.75, max_tokens: 8192 })

        return {
            content,
            model,
            type,
            timestamp: new Date().toISOString(),
            quality: "premium"
        }
    }
    
    const data = await requestAicc("/chat/completions", {
        model: model,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ],
        temperature: 0.75,
        max_tokens: 8192
    })

    const content = extractTextOutput(data)
    if (!content) {
        throw new Error("AICC returned empty completion content")
    }

    return {
        content,
        model: model,
        type,
        timestamp: new Date().toISOString(),
        quality: "premium"
    }
}

export const generateChatStream = async (messages, model = DEFAULT_TEXT_MODEL, onChunk, maxTokens = 4096) => {
    const formattedMessages = normalizeChatMessages(messages)

    if (isMistralModel(model)) {
        const outputText = await generateMistralChatResponse(formattedMessages, model, {
            temperature: 0.7,
            max_tokens: maxTokens
        })

        if (onChunk && outputText) {
            const chars = outputText.split('')
            for (let i = 0; i < chars.length; i++) {
                onChunk(chars[i])
                if (i % 3 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10))
                }
            }
        }

        return { model: model, content: outputText }
    }

    let data
    try {
        data = await requestAicc("/chat/completions", {
            model: model,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: maxTokens,
            stream: false
        })
    } catch (error) {
        const message = error?.message || ""
        const shouldFallback = message.includes("model_not_found") && model !== AICC_CHAT_FALLBACK_MODEL

        if (!shouldFallback) {
            throw error
        }

        // Automatic fallback when the configured AICC model is temporarily unavailable.
        if (isMistralModel(AICC_CHAT_FALLBACK_MODEL)) {
            const outputText = await generateMistralChatResponse(formattedMessages, AICC_CHAT_FALLBACK_MODEL, {
                temperature: 0.7,
                max_tokens: maxTokens
            })

            if (onChunk && outputText) {
                const chars = outputText.split('')
                for (let i = 0; i < chars.length; i++) {
                    onChunk(chars[i])
                    if (i % 3 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 10))
                    }
                }
            }

            return { model: AICC_CHAT_FALLBACK_MODEL, content: outputText }
        }

        data = await requestAicc("/chat/completions", {
            model: AICC_CHAT_FALLBACK_MODEL,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: maxTokens,
            stream: false
        })
    }

    const outputText = extractTextOutput(data)
    if (!outputText) {
        throw new Error("AICC returned empty completion content")
    }

    if (onChunk && outputText) {
        const chars = outputText.split('')
        for (let i = 0; i < chars.length; i++) {
            onChunk(chars[i])
            if (i % 3 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10))
            }
        }
    }

    return { model: model, content: outputText }
}

export const getAvailableModels = () => {
    const catalog = getUnifiedModelCatalog()
    return {
        content: catalog.content,
        research: catalog.research,
        chat: catalog.chat
    }
}
