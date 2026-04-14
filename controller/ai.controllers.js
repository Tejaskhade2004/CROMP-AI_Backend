import { generateContent, generateImage, generateResearch } from "../config/nvidia-ai.js"
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
        const { prompt, type = 'movie-description', model } = req.body
        const userId = req.user?.id

        if (!prompt || prompt.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            })
        }

        // Check user credits (optional - implement if you have a credit system)
        if (userId) {
            const user = await User.findById(userId)
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }
        }

        const content = await generateContent(prompt, type)

        return res.status(200).json({
            success: true,
            message: 'Content generated successfully',
            content: content,
            type: type
        })
    } catch (error) {
        console.error('Content generation error:', error)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate content')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: error.toString()
        })
    }
}

// ============ IMAGE GENERATION ============
export const generateImageController = async (req, res) => {
    try {
        const { prompt, model = 'text-to-image', numberOfImages = 2 } = req.body
        const userId = req.user?.id

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

        const images = await generateImage(prompt, model, Math.min(numberOfImages, 2))

        return res.status(200).json({
            success: true,
            message: 'Images generated successfully',
            images: images,
            count: images.length
        })
    } catch (error) {
        console.error('Image generation error:', error)
        const normalizedMessage = normalizeControllerErrorMessage(error, 'Failed to generate images')
        return res.status(500).json({
            success: false,
            message: normalizedMessage,
            error: error.toString()
        })
    }
}

// ============ RESEARCH GENERATION ============
export const generateResearchController = async (req, res) => {
    try {
        const { query, type = 'movie-research', model } = req.body
        const userId = req.user?.id

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

        const research = await generateResearch(query, type)

        return res.status(200).json({
            success: true,
            message: 'Research generated successfully',
            research: research,
            type: type
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
