export const CHAT_MODELS = [
    {
        id: "auto",
        label: "Auto (Best from CROMP Config)",
        provider: "internal",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "openrouter/free",
        label: "OpenRouter Free (Auto)",
        provider: "openrouter",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "openai/gpt-oss-120b:free",
        label: "GPT-OSS 120B Free",
        provider: "openrouter",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "mistral/codestral-latest",
        label: "Mistral Codestral",
        provider: "mistral",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "mistral/magistral-medium-latest",
        label: "Mistral Magistral Medium",
        provider: "mistral",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "mistral/mistral-small-latest",
        label: "Mistral Small Latest",
        provider: "mistral",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "gemini/gemma-4-26b-a4b-it",
        label: "Google Gemma-4 26B",
        provider: "gemini",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    },
    {
        id: "gemini/gemini-2.5-flash",
        label: "Google Gemini 2.5 Flash",
        provider: "gemini",
        defaultMaxTokens: 4096,
        minMaxTokens: 512,
        maxMaxTokens: 8192
    }
]

export const CODING_MODELS = [
    {
        id: "auto",
        label: "auto",
        provider: "internal",
        providerNote: "Auto",
        upstreamModel: "openrouter/free",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "openrouter/free",
        label: "openrouter:free",
        provider: "openrouter",
        providerNote: "Free",
        upstreamModel: "openrouter/free",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "openai/gpt-oss-120b:free",
        label: "GPT-OSS 120B Free",
        provider: "openrouter",
        providerNote: "OpenRouter",
        upstreamModel: "openai/gpt-oss-120b:free",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "gpt-4o-mini",
        label: "AICC GPT-4o-mini",
        provider: "aicc",
        providerNote: "AICC",
        upstreamModel: "gpt-4o-mini",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "hf/qwen2.5-coder-32b",
        label: "HuggingFace Qwen2.5 Coder 32B",
        provider: "huggingface",
        providerNote: "HuggingFace",
        upstreamModel: "Qwen/Qwen2.5-Coder-32B-Instruct",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "mistral/codestral-latest",
        label: "Mistral Codestral",
        provider: "mistral",
        providerNote: "Mistral",
        upstreamModel: "codestral-latest",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "mistral/magistral-medium-latest",
        label: "Mistral Magistral Medium",
        provider: "mistral",
        providerNote: "Mistral",
        upstreamModel: "magistral-medium-latest",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "mistral/mistral-small-latest",
        label: "Mistral Small Latest",
        provider: "mistral",
        providerNote: "Mistral",
        upstreamModel: "mistral-small-latest",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "groq/llama-3.1-8b-instant",
        label: "Groq Llama 3.1 8B Instant",
        provider: "groq",
        providerNote: "Groq",
        upstreamModel: "llama-3.1-8b-instant",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "sambanova/deepseek-v3.1",
        label: "Sambanova DeepSeek V3.1",
        provider: "sambanova",
        providerNote: "Sambanova",
        upstreamModel: "DeepSeek-V3.1",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "gemini/gemma-4-26b-a4b-it",
        label: "Google Gemma-4 26B",
        provider: "gemini",
        providerNote: "Google",
        upstreamModel: "gemma-4-26b-a4b-it",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    },
    {
        id: "gemini/gemini-2.5-flash",
        label: "Google Gemini 2.5 Flash",
        provider: "gemini",
        providerNote: "Google",
        upstreamModel: "gemini-2.5-flash",
        defaultMaxTokens: 8192,
        minMaxTokens: 1024,
        maxMaxTokens: 16384
    }
]

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const toMap = (models) => {
    return models.reduce((acc, model) => {
        acc[model.id] = model
        return acc
    }, {})
}

export const CHAT_MODELS_MAP = toMap(CHAT_MODELS)
export const CODING_MODELS_MAP = toMap(CODING_MODELS)

export const DEFAULT_CHAT_MODEL = "auto"
export const DEFAULT_CODING_MODEL = "auto"

const AUTO_CHAT_TARGET = process.env.AUTO_CHAT_MODEL || "openrouter/free"
const AUTO_CODING_TARGET = process.env.AUTO_CODING_MODEL || "openai/gpt-oss-120b:free"

const resolveAutoTarget = (mode, fallback) => {
    const requested = mode === "chat" ? AUTO_CHAT_TARGET : AUTO_CODING_TARGET
    if (requested && fallback[requested]) {
        return requested
    }
    return mode === "chat" ? "openrouter/free" : "openai/gpt-oss-120b:free"
}

export const resolveChatModel = (requestedModel) => {
    if (requestedModel === "auto") {
        return resolveAutoTarget("chat", CHAT_MODELS_MAP)
    }
    if (requestedModel && CHAT_MODELS_MAP[requestedModel]) {
        return requestedModel
    }
    return resolveAutoTarget("chat", CHAT_MODELS_MAP)
}

export const getChatModelProvider = (requestedModel) => {
    const resolvedModel = resolveChatModel(requestedModel)
    return CHAT_MODELS_MAP[resolvedModel]?.provider || "aicc"
}

export const resolveCodingModel = (requestedModel) => {
    if (requestedModel === "auto") {
        return resolveAutoTarget("coding", CODING_MODELS_MAP)
    }
    if (requestedModel && CODING_MODELS_MAP[requestedModel]) {
        return requestedModel
    }
    return resolveAutoTarget("coding", CODING_MODELS_MAP)
}

export const resolveChatMaxTokens = (requestedModel, requestedMaxTokens) => {
    const resolvedModel = resolveChatModel(requestedModel)
    const config = CHAT_MODELS_MAP[resolvedModel]
    const parsed = Number.parseInt(requestedMaxTokens, 10)

    if (Number.isNaN(parsed)) {
        return config.defaultMaxTokens
    }

    return clamp(parsed, config.minMaxTokens, config.maxMaxTokens)
}

export const resolveCodingMaxTokens = (requestedModel, requestedMaxTokens) => {
    const resolvedModel = resolveCodingModel(requestedModel)
    const config = CODING_MODELS_MAP[resolvedModel]
    const parsed = Number.parseInt(requestedMaxTokens, 10)

    if (Number.isNaN(parsed)) {
        return config.defaultMaxTokens
    }

    return clamp(parsed, config.minMaxTokens, config.maxMaxTokens)
}

export const getUnifiedModelCatalog = () => {
    const contentMap = {
        "zhipu/glm-4.6": "GLM-4.6 (Primary - 200K context)",
        "mistral/codestral-latest": "Mistral Codestral (Code Specialist)",
        "mistral/magistral-medium-latest": "Mistral Magistral Medium (Reasoning)",
        "mistral/mistral-small-latest": "Mistral Small Latest (Fast)"
    }

    const researchMap = {
        "zhipu/glm-4.6": "GLM-4.6 (Primary - 200K context)",
        "mistral/magistral-medium-latest": "Mistral Magistral Medium (Reasoning)",
        "mistral/mistral-small-latest": "Mistral Small Latest (Fast)"
    }

    const chatMap = CHAT_MODELS.reduce((acc, model) => {
        acc[model.id] = model.label
        return acc
    }, {})

    return {
        content: contentMap,
        research: researchMap,
        chat: chatMap,
        chatModels: CHAT_MODELS,
        codingModels: CODING_MODELS,
        defaults: {
            chatModel: DEFAULT_CHAT_MODEL,
            codingModel: DEFAULT_CODING_MODEL
        }
    }
}
