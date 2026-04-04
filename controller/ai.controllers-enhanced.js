import { generateContent, generateImage, generateResearch, generateAdvanced, getAvailableModels } from "../config/nvidia-ai-enhanced.js"
import User from "../models/user.model.js"

// ============ CONTENT GENERATION ============
export const generateContentController = async (req, res) => {
    try {
        const { prompt, type = 'movie-description', model = 'llama-2-70b' } = req.body
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
        console.error('Content generation error:', error)
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate content',
            error: error.toString()
        })
    }
}

// ============ IMAGE GENERATION ============
export const generateImageController = async (req, res) => {
    try {
        const { prompt, model = 'text-to-image', numberOfImages = 2 } = req.body
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

        const images = await generateImage(prompt, model, Math.min(numberOfImages, 4))

        return res.status(200).json({
            success: true,
            message: 'Images generated successfully',
            images: images.map(img => ({ data: img.data, model: img.model })),
            count: images.length
        })
    } catch (error) {
        console.error('Image generation error:', error)
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate images',
            error: error.toString()
        })
    }
}

// ============ RESEARCH GENERATION ============
export const generateResearchController = async (req, res) => {
    try {
        const { query, type = 'movie-research', model = 'mistral-7b' } = req.body
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
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate research',
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
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate advanced content',
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
