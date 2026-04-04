import express from "express"
import { generateContentController, generateImageController, generateResearchController, generateAdvancedController, getModelsController } from "../controller/ai.controllers-enhanced.js"
import isAuth from "../middlewares/isAuth.js"

const router = express.Router()

// Health Check - No auth required
router.get('/health', (req, res) => {
    const apiKeysStatus = {
        nvidia: !!process.env.NVIDIA_API_KEY,
        huggingface: !!process.env.HUGGINGFACE_API_KEY,
        environment: process.env.NODE_ENV
    }
    res.json({ 
        status: 'AI API is running',
        apiKeys: apiKeysStatus,
        timestamp: new Date().toISOString()
    })
})

// Content Generation Route - Optional Auth (works with or without login)
router.post('/generate-content', (req, res, next) => {
    // Try to authenticate but don't fail if no token
    const token = req.cookies.token
    if (token) {
        isAuth(req, res, () => generateContentController(req, res))
    } else {
        generateContentController(req, res)
    }
})

// Image Generation Route - Optional Auth
router.post('/generate-image', (req, res, next) => {
    const token = req.cookies.token
    if (token) {
        isAuth(req, res, () => generateImageController(req, res))
    } else {
        generateImageController(req, res)
    }
})

// Research Generation Route - Optional Auth
router.post('/generate-research', (req, res, next) => {
    const token = req.cookies.token
    if (token) {
        isAuth(req, res, () => generateResearchController(req, res))
    } else {
        generateResearchController(req, res)
    }
})

// Advanced Generation Route (Premium) - Optional Auth
router.post('/generate-advanced', (req, res, next) => {
    const token = req.cookies.token
    if (token) {
        isAuth(req, res, () => generateAdvancedController(req, res))
    } else {
        generateAdvancedController(req, res)
    }
})

// Get Available Models - No auth required
router.get('/models', getModelsController)

export default router
