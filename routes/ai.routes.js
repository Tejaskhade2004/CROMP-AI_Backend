import express from "express"
import { generateContentController, generateImageController, generateResearchController, generateAdvancedController, getModelsController } from "../controller/ai.controllers-enhanced.js"
import isAuth from "../middlewares/isAuth.js"

const router = express.Router()

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
