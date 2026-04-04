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

// Content Generation Route
router.post('/generate-content', isAuth, generateContentController)

// Image Generation Route
router.post('/generate-image', isAuth, generateImageController)

// Research Generation Route
router.post('/generate-research', isAuth, generateResearchController)

// Advanced Generation Route (Premium)
router.post('/generate-advanced', isAuth, generateAdvancedController)

// Get Available Models
router.get('/models', getModelsController)

export default router
