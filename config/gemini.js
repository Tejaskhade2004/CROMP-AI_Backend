import dotenv from "dotenv"
dotenv.config()

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const model = "gemini-2.5-flash"

export const generateResponse = async (prompt, modelOverride = model) => {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in .env")
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelOverride}:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 16384
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
        throw new Error("Gemini API error: empty completion content")
    }

    return content
}
