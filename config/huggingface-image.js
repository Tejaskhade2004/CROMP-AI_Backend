import dotenv from "dotenv"
dotenv.config()

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY

const IMAGE_MODELS = {
    "black-forest-labs/FLUX.1-schnell": {
        name: "Flux 1 Schnell",
        url: "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
    },
    "stabilityai/stable-diffusion-xl-base-1.0": {
        name: "SDXL Base",
        url: "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"
    }
}

const DEFAULT_MODEL = "black-forest-labs/FLUX.1-schnell"

export const generateImage = async (prompt, model = DEFAULT_MODEL, numberOfImages = 1) => {
    if (!HUGGINGFACE_API_KEY) {
        throw new Error("HUGGINGFACE_API_KEY is missing in .env")
    }

    const modelConfig = IMAGE_MODELS[model] || IMAGE_MODELS[DEFAULT_MODEL]
    const safeCount = Math.max(1, Math.min(numberOfImages, 4))
    const results = []

    for (let i = 0; i < safeCount; i++) {
        try {
            const response = await fetch(modelConfig.url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    inputs: prompt
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HuggingFace Image API error (${response.status}): ${errorText}`)
            }

            const buffer = Buffer.from(await response.arrayBuffer())
            const base64 = buffer.toString('base64')
            const imageData = `data:image/png;base64,${base64}`

            results.push({
                model: model,
                modelName: modelConfig.name,
                prompt: prompt,
                url: null,
                data: imageData
            })
        } catch (error) {
            console.error(`Image generation error (attempt ${i + 1}):`, error.message)
            if (i === safeCount - 1) {
                throw new Error(`Failed to generate image: ${error.message}`)
            }
        }
    }

    return results
}

export const getAvailableImageModels = () => {
    return {
        image: {
            "black-forest-labs/FLUX.1-schnell": "Flux 1 Schnell (Fast)",
            "stabilityai/stable-diffusion-xl-base-1.0": "SDXL Base (Detailed)"
        }
    }
}
