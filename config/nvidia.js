import dotenv from "dotenv"
dotenv.config()

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const model = "deepseek-ai/deepseek-v3.2"

export const generateResponse = async (prompt) => {
    if (!NVIDIA_API_KEY) throw new Error("NVIDIA_API_KEY is missing in .env")

    const response = await fetch(NVIDIA_BASE_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${NVIDIA_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that helps to generate code for websites based on user prompts. You must return valid raw JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 16384,
            stream: true
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`NVIDIA API error (${response.status}): ${errorText}`)
    }

    // Read the SSE stream and collect all chunks
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ""
    let buffer = ""

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE lines from the buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() // Keep incomplete line in buffer

        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") continue

            try {
                const parsed = JSON.parse(data)
                const delta = parsed?.choices?.[0]?.delta?.content
                if (delta) fullContent += delta
            } catch {
                // skip malformed chunks
            }
        }
    }

    if (!fullContent) {
        throw new Error("NVIDIA API error: empty completion content")
    }

    return fullContent
}