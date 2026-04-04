import dotenv from "dotenv"
dotenv.config()

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY

// ============ MODEL CONFIGURATION ============
const MODELS = {
  LLAMA_2_70B: "meta-llama/llama-2-70b-chat-hf",          // Best for content
  MISTRAL_7B: "mistralai/mistral-7b-instruct-v0.1",       // Good for research
  MIXTRAL_8X7B: "mistralai/mixtral-8x7b-instruct-v0.1"    // Excellent for advanced content
}

// ============ CONTENT GENERATION (Llama 2 70B & Mixtral) ============
export const generateContent = async (prompt, type = 'general', model = 'llama-2-70b') => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const systemPrompts = {
        'movie-description': `You are an acclaimed film critic and screenwriter with 20+ years of experience. Your task is to generate engaging, cinematic movie descriptions that captivate audiences. Write in an eloquent, sophisticated style that highlights the film's unique appeal.`,
        'movie-review': `You are an Oscar-nominated film critic known for balanced, insightful reviews. Write comprehensive reviews that analyze storytelling, cinematography, performances, direction, and sound design. Include pros, cons, and a rating out of 10. Be thorough and nuanced.`,
        'plot-summary': `You are a master storyteller and screenwriter. Create compelling, well-structured plot summaries that maintain suspense and intrigue. Your summaries should be detailed yet don't spoil major twists. Write with dramatic flair.`,
        'character-analysis': `You are a character development expert and acting coach. Provide deep psychological analysis of characters - their motivations, growth arcs, relationships, and how they drive the narrative. Be insightful and detailed.`,
        'screenplay': `You are an Emmy-winning screenwriter. Write professional screenplay sections with proper formatting, character dialogue, action descriptions, and emotional beats. Make it production-ready and cinematic.`,
        'movie-trivia': `You are a film historian and industry expert. Generate fascinating, accurate trivia facts about movies - production secrets, behind-the-scenes stories, casting decisions, technical achievements. Make facts engaging and memorable.`,
        'dialogue-writing': `You are a master dialogue writer. Create realistic, natural conversations between characters that reveal personality, advance plot, and maintain authentic tone. Include subtext and emotional depth.`,
        'scene-description': `You are a cinematographer and director. Describe vivid, cinematic scenes with attention to lighting, camera angles, movement, and atmosphere. Make descriptions visual and evocative.`
    }

    const selectedModel = model === 'mixtral' ? MODELS.MIXTRAL_8X7B : MODELS.LLAMA_2_70B
    const systemPrompt = systemPrompts[type] || systemPrompts['movie-description']

    try {
        const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: selectedModel,
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
                temperature: 0.8,
                max_tokens: 3000,
                top_p: 0.95,
                stream: false
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`NVIDIA API error (${response.status}): ${error.message || JSON.stringify(error)}`)
        }

        const data = await response.json()
        const content = data.choices[0].message.content
        
        return {
            content: content,
            model: selectedModel,
            type: type,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.error('Content generation error:', error)
        throw error
    }
}

// ============ IMAGE GENERATION (HuggingFace Models) ============
export const generateImage = async (prompt, model = 'text-to-image', numberOfImages = 2) => {
    if (!HUGGINGFACE_API_KEY) throw new Error("HUGGINGFACE_API_KEY is missing in .env")

    const modelIdentifier = model === 'flux-pro' 
        ? "black-forest-labs/FLUX.1-pro"
        : model === 'flux-dev'
        ? "black-forest-labs/FLUX.1-dev"
        : "stabilityai/stable-diffusion-3-medium"

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
                            num_inference_steps: 40,
                            guidance_scale: 7.5
                        }
                    }),
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(`Image generation failed: ${errorData.error || JSON.stringify(errorData)}`)
            }

            const blob = await response.blob()
            const base64 = await blobToBase64(blob)
            images.push({
                data: base64,
                model: modelIdentifier,
                prompt: prompt
            })
        }

        return images
    } catch (error) {
        console.error('Image generation error:', error)
        throw error
    }
}

// ============ RESEARCH GENERATION (Mistral 7B - Fast & Focused) ============
export const generateResearch = async (query, type = 'movie-research', model = 'mistral-7b') => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const systemPrompts = {
        'movie-research': `You are a film research specialist with access to vast entertainment databases. Provide thorough, well-researched information about movies. Format with clear sections and bullet points. Include production details, cast information, budget, box office, and cultural impact.`,
        'actor-biography': `You are a celebrity biographer and film historian. Write comprehensive biographies covering early life, career breakthrough, major roles, awards, personal life, and industry impact. Make it engaging and factual.`,
        'director-analysis': `You are a film studies scholar specializing in director analysis. Analyze directorial style, signature techniques, thematic preferences, career evolution, and filmography. Discuss their influence on cinema.`,
        'genre-analysis': `You are a genre expert in film studies. Provide detailed analysis of movie genres - history, key characteristics, evolution, subgenres, iconic films, and influential directors. Be comprehensive.`,
        'market-analysis': `You are a film industry analyst. Analyze box office trends, market dynamics, audience preferences, release strategies, and financial performance. Include relevant statistics and predictions.`,
        'industry-trends': `You are an entertainment industry analyst. Identify and explain current industry trends - streaming impact, production shifts, audience demographics, technology adoption, and market directions. Be insightful and forward-thinking.`,
        'cinematography-analysis': `You are a cinematography expert. Analyze visual storytelling techniques - camera angles, lighting design, color grading, composition, and movement. Discuss how cinematography enhances narrative.`,
        'soundtrack-analysis': `You are a film music composer and critic. Analyze how music and sound design enhance films - themes, emotional impact, orchestration, and memorable scores. Include artist profiles.`
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
                model: MODELS.MISTRAL_7B,
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
                max_tokens: 3000,
                top_p: 0.9,
                stream: false
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`NVIDIA API error (${response.status}): ${error.message || JSON.stringify(error)}`)
        }

        const data = await response.json()
        const research = data.choices[0].message.content
        
        return {
            content: research,
            model: MODELS.MISTRAL_7B,
            type: type,
            timestamp: new Date().toISOString()
        }
    } catch (error) {
        console.error('Research generation error:', error)
        throw error
    }
}

// ============ ADVANCED GENERATION (Mixtral 8x7B - Best Quality) ============
export const generateAdvanced = async (prompt, type = 'advanced-content') => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const systemPrompts = {
        'advanced-content': `You are a world-class creative writer with expertise in film, storytelling, and entertainment. Your task is to produce high-quality, sophisticated content that exceeds industry standards. Work at the highest level of creative excellence.`,
        'screenplay-advanced': `You are an A-list screenwriter who has written award-winning films. Create professional-grade screenplays with perfect formatting, compelling dialogue, vivid descriptions, and emotional depth. Every line should serve the story.`,
        'book-adaptation': `You are a master of adapting literature to film. Analyze books in detail and suggest how they could be transformed into compelling screenplays. Discuss character arc preservation, pacing, and cinematic potential.`,
        'marketing-campaign': `You are a top entertainment marketing strategist. Develop comprehensive marketing campaigns for films. Include positioning, target audience analysis, messaging, and multi-platform strategies.`,
        'franchise-strategy': `You are a franchise development expert. Analyze how films can be developed into successful franchises. Discuss universe building, character development, and long-term storytelling potential.`
    }

    const systemPrompt = systemPrompts[type] || systemPrompts['advanced-content']

    try {
        const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${NVIDIA_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODELS.MIXTRAL_8X7B,
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
                temperature: 0.85,
                max_tokens: 4000,
                top_p: 0.95,
                stream: false
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`NVIDIA API error (${response.status}): ${error.message || JSON.stringify(error)}`)
        }

        const data = await response.json()
        const content = data.choices[0].message.content
        
        return {
            content: content,
            model: MODELS.MIXTRAL_8X7B,
            type: type,
            timestamp: new Date().toISOString(),
            quality: 'premium'
        }
    } catch (error) {
        console.error('Advanced generation error:', error)
        throw error
    }
}

// ============ UTILITY FUNCTIONS ============
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

export const getAvailableModels = () => {
    return {
        content: {
            "llama-2-70b": "Llama 2 70B (Best for detailed content)",
            "mixtral-8x7b": "Mixtral 8x7B (Excellent for advanced content)"
        },
        research: {
            "mistral-7b": "Mistral 7B (Fast & focused research)"
        },
        image: {
            "stable-diffusion": "Stable Diffusion 3 (High quality images)",
            "flux-pro": "FLUX Pro (Ultra-fast generation)",
            "flux-dev": "FLUX Dev (High quality & speed)"
        }
    }
}
