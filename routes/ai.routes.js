import express from "express"
import { generateContentController, generateResearchController, generateAdvancedController, getModelsController, getModelConfigController, chatController, generateImageController } from "../controller/ai.controllers-enhanced.js"
import isAuth from "../middlewares/isAuth.js"

const router = express.Router()

// Health Check - No auth required
router.get('/health', (req, res) => {
    const apiKeysStatus = {
        aicc: !!process.env.AICC_API_KEY,
        environment: process.env.NODE_ENV
    }
    res.json({ 
        status: 'AI API is running',
        apiKeys: apiKeysStatus,
        timestamp: new Date().toISOString()
    })
})

// Chat Route - Stream responses like ChatGPT/DeepSeek
router.post('/chat', (req, res, next) => {
    const token = req.cookies.token
    if (token) {
        isAuth(req, res, () => chatController(req, res))
    } else {
        chatController(req, res)
    }
})

// Content Generation Route - Optional Auth
router.post('/generate-content', (req, res, next) => {
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
router.get('/model-config', getModelConfigController)

export default router
