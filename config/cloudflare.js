import dotenv from "dotenv"
dotenv.config()

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const defaultModel =
    process.env.CLOUDFLARE_DEFAULT_MODEL || "@cf/meta/llama-3.1-8b-instruct"

const getCloudflareUrl = () => {
    if (!CLOUDFLARE_ACCOUNT_ID) {
        throw new Error("CLOUDFLARE_ACCOUNT_ID is missing in .env")
    }
    return `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`
}

export const generateResponse = async (prompt, modelOverride = defaultModel) => {
    if (!CLOUDFLARE_API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is missing in .env")

    const response = await fetch(getCloudflareUrl(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: modelOverride,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a helpful assistant that helps to generate code for websites based on user prompts. You must return valid raw JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cloudflare Workers AI error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const content = data?.result?.response || data?.choices?.[0]?.message?.content

    if (!content) {
        throw new Error("Cloudflare Workers AI error: empty completion content")
    }

    return content
}
