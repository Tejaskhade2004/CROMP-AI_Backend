import {
    generateContent,
    generateResearch,
    generateAdvanced,
    getAvailableModels,
    generateChatStream
} from "../config/aicc-content.js"
import {
    DEFAULT_CHAT_MODEL,
    getUnifiedModelCatalog,
    resolveChatModel,
    resolveChatMaxTokens
} from "../config/model-catalog.js"
import { generateImage as generateHfImage, getAvailableImageModels } from "../config/huggingface-image.js"
import User from "../models/user.model.js"

const normalizeControllerErrorMessage = (error, fallback) => {
    const message = error?.message || fallback
    if (message.includes("Unexpected non-whitespace character after JSON")) {
        return "AI provider returned malformed response. Please retry in a few seconds."
    }
    return message
}

// ============ CONTENT GENERATION ============
export const generateContentController = async (req, res) => {
    try {
        const {
            prompt,
            type = 'movie-description',
            model = 'zhipu/glm-4.6'
        } = req.body
        const userId = req.user?._id

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            })
        }

        // Check user credits (optional)
        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const result = await generateContent(prompt, type, model)

        return res.status(200).json({
            success: true,
            message: 'Content generated successfully',
            content: result.content,
            type: result.type,
            model: result.model,
            timestamp: result.timestamp
        })
    } catch (error) {
        console.error('Content generation error:', error.message)
        console.error('Full error:', error)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate content')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: process.env.NODE_ENV === 'development' ? error.toString() : 'Server error',
            details: normalizedMessage
        })
    }
}

// ============ RESEARCH GENERATION ============
export const generateResearchController = async (req, res) => {
    try {
        const {
            query,
            type = 'movie-research',
            model = 'zhipu/glm-4.6'
        } = req.body
        const userId = req.user?._id

        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Query is required'
            })
        }

        // Check user credits (optional)
        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const result = await generateResearch(query, type, model)

        return res.status(200).json({
            success: true,
            message: 'Research generated successfully',
            research: result.content,
            type: result.type,
            model: result.model,
            timestamp: result.timestamp
        })
    } catch (error) {
        console.error('Research generation error:', error)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate research')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: error.toString()
        })
    }
}

// ============ ADVANCED GENERATION (Premium) ============
export const generateAdvancedController = async (req, res) => {
    try {
        const { prompt, type = 'advanced-content' } = req.body
        const userId = req.user?._id

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            })
        }

        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const result = await generateAdvanced(prompt, type)

        return res.status(200).json({
            success: true,
            message: 'Advanced content generated successfully',
            content: result.content,
            type: result.type,
            model: result.model,
            quality: result.quality,
            timestamp: result.timestamp
        })
    } catch (error) {
        console.error('Advanced generation error:', error)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate advanced content')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: error.toString()
        })
    }
}

// ============ GET AVAILABLE MODELS ============
export const getModelsController = async (req, res) => {
    try {
        const models = getAvailableModels()
        return res.status(200).json({
            success: true,
            models: models
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch models',
            error: error.toString()
        })
    }
}

export const getModelConfigController = async (req, res) => {
    try {
        const modelConfig = getUnifiedModelCatalog()
        return res.status(200).json({
            success: true,
            models: modelConfig
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch model configuration",
            error: error.toString()
        })
    }
}

// ============ CHAT (Streaming like ChatGPT/DeepSeek) ============
export const chatController = async (req, res) => {
    try {
        const { messages, model = DEFAULT_CHAT_MODEL, maxTokens } = req.body
        const userId = req.user?._id

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Messages array is required'
            })
        }

        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const resolvedModel = resolveChatModel(model)
        const resolvedMaxTokens = resolveChatMaxTokens(resolvedModel, maxTokens)

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')

        const result = await generateChatStream(messages, resolvedModel, (chunk) => {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
        }, resolvedMaxTokens)

        res.write(`data: ${JSON.stringify({ done: true, model: result.model })}\n\n`)
        res.end()

    } catch (error) {
        console.error('Chat streaming error:', error.message)
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        res.end()
    }
}

// ============ IMAGE GENERATION ============
export const generateImageController = async (req, res) => {
    try {
        const {
            prompt,
            model = 'black-forest-labs/FLUX.1-schnell',
            numberOfImages = 1
        } = req.body
        const userId = req.user?._id

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            })
        }

        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const images = await generateHfImage(prompt, model, Math.min(numberOfImages, 4))

        return res.status(200).json({
            success: true,
            message: 'Images generated successfully',
            provider: 'huggingface',
            images: images.map((img) => ({
                data: img.data,
                url: img.url,
                model: img.model,
                modelName: img.modelName
            })),
            count: images.length
        })
    } catch (error) {
        console.error('Image generation error:', error.message)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate images')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: process.env.NODE_ENV === 'development' ? error.toString() : 'Server error',
            details: normalizedMessage
        })
    }
}
