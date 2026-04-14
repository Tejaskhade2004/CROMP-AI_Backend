import dotenv from "dotenv"
dotenv.config()

const AICC_API_KEY = process.env.AICC_API_KEY
const model = "gpt-4o-mini"

export const generateResponse = async (prompt, modelOverride = model, options = {}) => {
    if (!AICC_API_KEY) throw new Error("AICC_API_KEY is missing in .env")
    
    const AICC_URL = `https://api.ai.cc/v1/chat/completions`

    const response = await fetch(AICC_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${AICC_API_KEY}`
        },
        body: JSON.stringify({
            model: modelOverride,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: options.maxTokens || 16384
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`AICC API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("AICC API error: empty completion content")
    }

    return content
}
