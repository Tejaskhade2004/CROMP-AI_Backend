import { raw } from "express";
import mongoose from "mongoose";
import Website from "../models/Website.model.js";
import { generateResponse as generateGeminiResponse } from "../config/gemini.js";
import { generateResponse as generateOpenRouterResponse } from "../config/openrouter.js";
import { generateResponse as generateHuggingFaceResponse } from "../config/huggingface.js";
import { generateResponse as generateCloudflareResponse } from "../config/cloudflare.js";
import { generateResponse as generateMistralResponse } from "../config/mistral.js";
import { generateResponse as generateGroqResponse } from "../config/groq.js";
import { generateResponse as generateCerebrasResponse } from "../config/cerebras.js";
import { generateResponse as generateSambanovaResponse } from "../config/sambanova.js";
import { generateResponse as generateGitHubModelsResponse } from "../config/github-models.js";
import extractJson from "../utils/ExtractJson.js";
import User from "../models/user.model.js";

// Credit costs (set to 0 for unrestricted generation during testing)
const GENERATE_COST = 0;
const UPDATE_COST = 0;

const masterPrompt = `
YOU ARE A PRINCIPAL FRONTEND ARCHITECT
AND A SENIOR UI/UX ENGINEER
SPECIALIZED IN RESPONSIVE DESIGN SYSTEMS.

YOU BUILD HIGH-END, REAL-WORLD, PRODUCTION-GRADE WEBSITES
USING ONLY HTML, CSS, AND JAVASCRIPT
THAT WORK PERFECTLY ON ALL SCREEN SIZES.

THE OUTPUT MUST BE CLIENT-DELIVERABLE WITHOUT ANY MODIFICATION.

❌ NO FRAMEWORKS
❌ NO LIBRARIES
❌ NO BASIC SITES
❌ NO PLACEHOLDERS
❌ NO NON-RESPONSIVE LAYOUTS

--------------------------------------------------
USER REQUIREMENT:
{USER_PROMPT}
--------------------------------------------------

GLOBAL QUALITY BAR (NON-NEGOTIABLE)
--------------------------------------------------
- Premium, modern UI (2026–2027)
- Professional typography & spacing
- Clean visual hierarchy
- Business-ready content (NO lorem ipsum)
- Smooth transitions & hover effects
- SPA-style multi-page experience
- Production-ready, readable code

--------------------------------------------------
RESPONSIVE DESIGN (ABSOLUTE REQUIREMENT)
--------------------------------------------------
THIS WEBSITE MUST BE FULLY RESPONSIVE.

YOU MUST IMPLEMENT:

✔ Mobile-first CSS approach
✔ Responsive layout for:
  - Mobile (<768px)
  - Tablet (768px–1024px)
  - Desktop (>1024px)

✔ Use:
  - CSS Grid / Flexbox
  - Relative units (%, rem, vw)
  - Media queries

✔ REQUIRED RESPONSIVE BEHAVIOR:
  - Navbar collapses / stacks on mobile
  - Sections stack vertically on mobile
  - Multi-column layouts become single-column on small screens
  - Images scale proportionally
  - Text remains readable on all devices
  - No horizontal scrolling on mobile
  - Touch-friendly buttons on mobile

IF THE WEBSITE IS NOT RESPONSIVE → RESPONSE IS INVALID.

--------------------------------------------------
IMAGES (MANDATORY & RESPONSIVE)
--------------------------------------------------
- Use high-quality images ONLY from:
  https://images.unsplash.com/
- EVERY image URL MUST include:
  ?auto=format&fit=crop&w=1200&q=80

- Images must:
  - Be responsive (max-width: 100%)
  - Resize correctly on mobile
  - Never overflow containers

--------------------------------------------------
TECHNICAL RULES (VERY IMPORTANT)
--------------------------------------------------
- Output ONE single HTML file
- Exactly ONE <style> tag
- Exactly ONE <script> tag
- NO external CSS / JS / fonts
- Use system fonts only
- iframe srcdoc compatible
- SPA-style navigation using JavaScript
- No page reloads
- No dead UI
- No broken buttons
--------------------------------------------------
SPA VISIBILITY RULE (MANDATORY)
--------------------------------------------------
- Pages MUST NOT be hidden permanently
- If .page { display: none } is used,
  then .page.active { display: block } is REQUIRED
- At least ONE page MUST be visible on initial load
- Hiding all content is INVALID


--------------------------------------------------
REQUIRED SPA PAGES
--------------------------------------------------
- Home
- About
- Services / Features
- Contact

--------------------------------------------------
FUNCTIONAL REQUIREMENTS
--------------------------------------------------
- Navigation must switch pages using JS
- Active nav state must update
- Forms must have JS validation
- Buttons must show hover + active states
- Smooth section/page transitions

--------------------------------------------------
FINAL SELF-CHECK (MANDATORY)
--------------------------------------------------
BEFORE RESPONDING, ENSURE:

1. Layout works on mobile, tablet, desktop
2. No horizontal scroll on mobile
3. All images are responsive
4. All sections adapt properly
5. Media queries are present and used
6. Navigation works on all screen sizes
7. At least ONE page is visible without user interaction

IF ANY CHECK FAILS → RESPONSE IS INVALID

--------------------------------------------------
OUTPUT FORMAT (RAW JSON ONLY)
--------------------------------------------------
{
  "message": "Short professional confirmation sentence",
  "code": "<FULL VALID HTML DOCUMENT>"
}

--------------------------------------------------
ABSOLUTE RULES
--------------------------------------------------
- RETURN RAW JSON ONLY
- NO markdown
- NO explanations
- NO extra text
- FORMAT MUST MATCH EXACTLY
- IF FORMAT IS BROKEN → RESPONSE IS INVALID
`;

const createSlug = (title = "website") => {
    const safeBase = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50) || "website";

    const uniquePart = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    return `${safeBase}-${uniquePart}`;
}

const WEBSITE_GENERATION_MODELS = {
    "gemini-2.5-flash": {
        provider: "gemini",
        model: "gemini-2.5-flash",
        label: "Google Gemini 2.5 Flash"
    },
    "nvidia/nemotron-3-super-120b-a12b:free": {
        provider: "openrouter",
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        label: "NVIDIA Nemotron 3 Super (Free)"
    },
    "minimax/minimax-m2.5:free": {
        provider: "openrouter",
        model: "minimax/minimax-m2.5:free",
        label: "MiniMax M2.5 (Free)"
    },
    "z-ai/glm-4.5-air:free": {
        provider: "openrouter",
        model: "z-ai/glm-4.5-air:free",
        label: "Z.ai GLM 4.5 Air (Free)"
    },
    "stepfun/step-3.5-flash:free": {
        provider: "openrouter",
        model: "stepfun/step-3.5-flash:free",
        label: "StepFun 3.5 Flash (Free)"
    },
    "hf/qwen2.5-coder-32b": {
        provider: "huggingface",
        model: "Qwen/Qwen2.5-Coder-32B-Instruct",
        label: "HuggingFace Qwen2.5 Coder 32B"
    },
    "cf/llama-3.1-8b": {
        provider: "cloudflare",
        model: "@cf/meta/llama-3.1-8b-instruct",
        label: "Cloudflare Workers AI Llama 3.1 8B"
    },
    "mistral/codestral-latest": {
        provider: "mistral",
        model: "codestral-latest",
        label: "Mistral Codestral Latest"
    },
    "groq/llama-3.1-8b-instant": {
        provider: "groq",
        model: "llama-3.1-8b-instant",
        label: "Groq Llama 3.1 8B Instant"
    },
    "cerebras/llama3.3-70b": {
        provider: "cerebras",
        model: "llama3.3-70b",
        label: "Cerebras Llama 3.3 70B"
    },
    "sambanova/deepseek-r1": {
        provider: "sambanova",
        model: "DeepSeek-R1",
        label: "Sambanova DeepSeek R1"
    },
    "github/gpt-4o-mini": {
        provider: "github-models",
        model: "gpt-4o-mini",
        label: "GitHub Models GPT-4o-mini"
    }
}

const DEFAULT_GENERATION_MODEL = Object.prototype.hasOwnProperty.call(
    WEBSITE_GENERATION_MODELS,
    process.env.DEFAULT_GENERATION_MODEL || ""
)
    ? process.env.DEFAULT_GENERATION_MODEL
    : "gemini-2.5-flash"

const resolveSelectedModel = (requestedModel) => {
    if (requestedModel && WEBSITE_GENERATION_MODELS[requestedModel]) {
        return requestedModel
    }
    return DEFAULT_GENERATION_MODEL
}

const generateWithSelectedModel = async (prompt, selectedModel) => {
    const resolvedModel = resolveSelectedModel(selectedModel)
    const modelConfig = WEBSITE_GENERATION_MODELS[resolvedModel]

    if (modelConfig.provider === "openrouter") {
        return generateOpenRouterResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "huggingface") {
        return generateHuggingFaceResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "cloudflare") {
        return generateCloudflareResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "mistral") {
        return generateMistralResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "groq") {
        return generateGroqResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "cerebras") {
        return generateCerebrasResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "sambanova") {
        return generateSambanovaResponse(prompt, modelConfig.model)
    }

    if (modelConfig.provider === "github-models") {
        return generateGitHubModelsResponse(prompt, modelConfig.model)
    }

    return generateGeminiResponse(prompt, modelConfig.model)
}

// Keep existing helper usage untouched in legacy paths.
const generateResponse = (prompt) => generateGeminiResponse(prompt)

export const generateWebsite = async (req, res) => {
    try {
        const { prompt, model } = req.body
        if (!prompt) return res.status(400).json({ message: "Prompt is required" })
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })

        const user = await User.findById(req.user._id)
        if (!user) return res.status(401).json({ message: "Unauthorized" })

        if (user.credits < GENERATE_COST) return res.status(403).json({ message: "Insufficient credits" })

        const finalPrompt = masterPrompt.replace("{USER_PROMPT}", prompt)
        const selectedModel = resolveSelectedModel(model)
        let result = ""
        let parse = null
        result = await generateWithSelectedModel(finalPrompt, selectedModel)
        let rawResponse = result
        parse = extractJson(result)
        for (let i = 0; i < 2 && !parse; i++) {
            rawResponse = await generateWithSelectedModel(finalPrompt, selectedModel)
            parse = extractJson(rawResponse)
            if (!parse) {
                rawResponse = await generateWithSelectedModel(
                    finalPrompt + "\n\nREMEMBER TO FOLLOW THE OUTPUT FORMAT AND RETURN RAW JSON ONLY",
                    selectedModel
                )
                parse = extractJson(rawResponse)
            }
        }

        if (!parse?.code) {
            console.log("Failed to parse JSON:", rawResponse);
            return res.status(500).json({ message: "Failed to generate website. Please try again." })
        }

        const website = await Website.create({
            user: user._id,
            title: prompt.slice(0, 60),
            slug: createSlug(prompt.slice(0, 60)),

            latestCode: parse.code,
            conversation: [
                {
                    role: "user",
                    content: prompt
                },
                {
                    role: "assistant",
                    content: parse.message || "Website generated successfully."
                }

            ]

        })

        user.credits = user.credits - GENERATE_COST
        await user.save()

        return res.status(201).json({
            message: "Website generated successfully",
            websiteId: website._id,
            model: selectedModel,
            Remaining_credits: user.credits
        })



    } catch (error) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` })
    }
}

export const getWebsiteById = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.status(400).json({ message: "Website ID is required" })
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid website id" })

        const website = await Website.findOne({
            user: req.user._id,
            _id: id
        })
        if (!website) return res.status(404).json({ message: "Website not found" })

        return res.status(200).json(website)
    } catch (error) {
        return res.status(500).json({ message: `Get Website By Id Error: ${error.message}` })
    }
}

export const getAllWebsitesList = async (req, res) => {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })

        const websites = await Website.find({ user: req.user._id })
            .sort({ updatedAt: -1 })
            .select("_id title slug updatedAt createdAt")

        return res.status(200).json(websites)
    } catch (error) {
        return res.status(500).json({ message: `Get All Websites Error: ${error.message}` })
    }
}

const extractHtmlFromText = (text) => {
    if (!text) return null

    const doctypeIndex = text.search(/<!doctype html/i)
    const htmlIndex = text.search(/<html[\s>]/i)
    const start = doctypeIndex !== -1 ? doctypeIndex : htmlIndex
    const end = text.toLowerCase().lastIndexOf("</html>")

    if (start === -1 || end === -1) return null
    return text.slice(start, end + "</html>".length)
}

const normalizeModelOutput = (text) => {
    if (!text || typeof text !== "string") return ""

    let normalized = text.trim()

    // Remove markdown code fences if present
    normalized = normalized.replace(/```json\n?|```/gi, "")

    // Remove stray backticks
    normalized = normalized.replace(/`/g, "")

    // Sometimes model prepends text like 'Here is...' or 'Output:'
    const jsonStart = normalized.indexOf("{")
    const jsonEnd = normalized.lastIndexOf("}")
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        normalized = normalized.slice(jsonStart, jsonEnd + 1)
    }

    return normalized
}

const parseWebsitePayload = (rawText) => {
    if (!rawText || typeof rawText !== "string") return null

    const normalizedText = normalizeModelOutput(rawText)

    let parsedJson = null
    try {
        parsedJson = extractJson(normalizedText)
    } catch (e) {
        parsedJson = null
    }

    if (parsedJson?.code) {
        return {
            message: parsedJson.message || "Website updated successfully",
            code: parsedJson.code
        }
    }

    // Fallback: sometimes output is direct HTML (no JSON)
    const html = extractHtmlFromText(rawText) || extractHtmlFromText(normalizedText)
    if (html) {
        return {
            message: "Website updated successfully",
            code: html
        }
    }

    return null
}

export const generateWebsiteChanges = async (req, res) => {
    try {
        const { id } = req.params
        const { prompt } = req.body

        if (!id) return res.status(400).json({ message: "Website ID is required" })
        if (!prompt) return res.status(400).json({ message: "Prompt is required" })
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid website id" })

        const website = await Website.findOne({ _id: id, user: req.user._id })
        if (!website) return res.status(404).json({ message: "Website not found" })

        const updatePrompt = `
You are editing an existing website.
Apply the user's requested changes and return raw JSON with:
{
  "message": "Short confirmation",
  "code": "<full updated html>"
}

Current Website HTML:
${website.latestCode}

Requested Changes:
${prompt}
`

        let rawResponse = await generateResponse(updatePrompt)
        let parsed = parseWebsitePayload(rawResponse)

        // Retry logic for malformed output
        const retryMessages = [
            "\n\nREMEMBER TO RETURN RAW JSON ONLY, with no markdown or extra text.",
            "\n\nOUTPUT MUST BE RAW JSON ONLY, with keys message and code.",
            "\n\nPlease avoid extra narration and return exactly the JSON object."
        ]

        for (let i = 0; i < retryMessages.length && !parsed; i++) {
            rawResponse = await generateResponse(updatePrompt + retryMessages[i])
            parsed = parseWebsitePayload(rawResponse)
        }

        if (!parsed) {
            console.error("Malformed model output when updating website:", rawResponse)
            return res.status(500).json({
                message: "Failed to update website code. The model returned malformed output. Please retry.",
                details: rawResponse?.slice?.(0, 1000)
            })
        }

        website.latestCode = parsed.code
        website.conversation.push(
            { role: "user", content: prompt },
            { role: "assistant", content: parsed.message || "Website updated successfully." }
        )
        await website.save()

        return res.status(200).json({
            message: "Website updated successfully",
            websiteId: website._id,
            latestCode: website.latestCode
        })
    } catch (error) {
        const errorMessage = error?.message || "Unknown error"

        if (errorMessage.includes('"code":429') || errorMessage.includes("rate-limit") || errorMessage.includes("temporarily rate-limited")) {
            return res.status(429).json({
                message: "Provider is temporarily rate-limited. Please retry in a few seconds or switch model/provider."
            })
        }

        return res.status(500).json({ message: `Generate Website Changes Error: ${errorMessage}` })
    }
}

// export const changes = async (req, res) => {
//     try {
//         const { id } = req.params
//         const { prompt } = req.body
//         if (!id) return res.status(400).json({ message: "Website ID is required" })
//         if (!prompt) return res.status(400).json({ message: "Prompt is required" })
//         if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })
//         if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid website id" })

//         const website = await Website.findOne({
//             user: req.user._id,
//             _id: id
//         })
//         if (!website) return res.status(404).json({ message: "Website not found" })

//         const finalPrompt = masterPrompt.replace("{USER_PROMPT}", prompt)
//         let result = ""
//         let parse = null
//         result = await generateResponse(finalPrompt)
//         let rawResponse = result
//         parse = extractJson(result)
//         for (let i = 0; i < 2 && !parse; i++) {
//             rawResponse = await generateResponse(finalPrompt)
//             parse = extractJson(rawResponse)    
//             if (!parse) {
//                 rawResponse = await generateResponse(finalPrompt + "\n\nREMEMBER TO FOLLOW THE OUTPUT FORMAT AND RETURN RAW JSON ONLY")
//                 parse = extractJson(rawResponse)
//             }
//         }
//         }catch (error) {
//         return res.status(500).json({ message: `Internal server error: ${error.message}` })
//     }
//     } 


export const changesInWebsite = async (req, res) => {
    try {
        const { prompt } = req.body
        if (!prompt) return res.status(400).json({ message: "Prompt is required" })

        const WebsiteId = req.params
        const website = await Website.findOne({
            user: req.user._id,
            _id: id
        })

        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })

        const user = await User.findById(req.user._id)
        if (!user) return res.status(401).json({ message: "Unauthorized" })

        if (user.credits < UPDATE_COST) return res.status(403).json({ message: "Insufficient credits" })

        const updatedPrompt = `Update this html website code:\n${website.latestCode}\n\nThe user has made the following changes to the website:\n${prompt}\n\nBased on these changes, update the website code accordingly. Remember to maintain the same high-quality standards and responsiveness. Return only the updated full HTML code in the same JSON format as before.`


        let result = ""
        let parse = null
        result = await generateResponse(updatedPrompt)
        let rawResponse = result
        parse = extractJson(result)
        for (let i = 0; i < 2 && !parse; i++) {
            rawResponse = await generateResponse(updatedPrompt)
            parse = extractJson(rawResponse)
            if (!parse) {
                rawResponse = await generateResponse(updatedPrompt + "\n\nREMEMBER TO FOLLOW THE OUTPUT FORMAT AND RETURN RAW JSON ONLY")
                parse = extractJson(rawResponse)
            }
        }

        if (!parse?.code) {
            console.log("Failed to parse JSON:", rawResponse);
            return res.status(500).json({ message: "Failed to generate website. Please try again." })
        } 

        website.conversation.push({
            role: "assistant",
            content: parse.message || "Website updated successfully."
            
        },{
            role: "user",
            content: prompt
        })
        website.latestCode = parse.code
        await website.save()

        user.credits = user.credits - UPDATE_COST
        await user.save()
        return res.status(200).json({
            message: parse.message || "Website updated successfully",
            code: parse.code,
            Remaining_credits: user.credits
        })




    } catch (error) {
        return res.status(500).json({ message: `Error in generating website changes: ${error.message}` })
    }
}

export const getAllWebsites = async (req, res) => {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })
        const websites = await Website.find({ user: req.user._id }).sort({ updatedAt: -1 })
        return res.status(200).json(websites)
    } catch (error) {
        return res.status(500).json({ message: `Get all websites error: ${error.message}` })
    }
}

export const deployWebsite = async (req, res) => {
    try {
        const { id } = req.params
        if (!id) return res.status(400).json({ message: "Website ID is required" })
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid website id" })

        const website = await Website.findOne({ _id: id, user: req.user._id })
        if (!website) return res.status(404).json({ message: "Website not found" })

        if (!website.slug) {
            website.slug = createSlug(website.title || "website")
        }

        website.deployed = true
        website.deployURL = `${req.protocol}://${req.get("host")}/api/website/live/${website.slug}`
        await website.save()

        return res.status(200).json({
            message: "Website deployed successfully",
            websiteId: website._id,
            deployed: website.deployed,
            deployURL: website.deployURL
        })
    } catch (error) {
        return res.status(500).json({ message: `Deploy website error: ${error.message}` })
    }
}

export const getDeployedWebsiteBySlug = async (req, res) => {
    try {
        const { slug } = req.params
        if (!slug) return res.status(400).json({ message: "Website slug is required" })

        const website = await Website.findOne({ slug, deployed: true }).select("latestCode")
        if (!website) return res.status(404).send("Website not found or not deployed yet.")

        res.setHeader("Content-Type", "text/html; charset=utf-8")
        res.setHeader("Cache-Control", "no-store")
        return res.status(200).send(website.latestCode)
    } catch (error) {
        return res.status(500).json({ message: `Get deployed website error: ${error.message}` })
    }
}


