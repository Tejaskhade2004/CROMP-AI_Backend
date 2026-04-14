import mongoose from "mongoose"
import dns from "node:dns"

const shouldApplyCustomDns = () => {
    const value = (process.env.MONGODB_APPLY_CUSTOM_DNS || "true").toLowerCase()
    return value !== "false" && value !== "0" && value !== "no"
}

const applyCustomDnsServers = () => {
    if (!shouldApplyCustomDns()) return

    const configured = process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1"
    const servers = configured
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)

    if (servers.length === 0) return

    try {
        dns.setServers(servers)
    } catch (error) {
        console.warn("Could not apply custom DNS servers:", error.message)
    }
}

const isSrvDnsFailure = (error) => {
    const message = error?.message || ""
    return (
        message.includes("querySrv") ||
        message.includes("ENOTFOUND") ||
        message.includes("ETIMEOUT")
    )
}

const buildDirectFallbackUri = (mongoUrl) => {
    if (typeof mongoUrl !== "string" || !mongoUrl.startsWith("mongodb+srv://")) return null

    const directBase = mongoUrl.replace(/^mongodb\+srv:\/\//, "mongodb://")

    if (directBase.includes("directConnection=")) {
        return directBase
    }

    if (directBase.includes("?")) {
        return `${directBase}&tls=true&directConnection=true`
    }

    return `${directBase}?tls=true&directConnection=true`
}

const connectdb = async () => {
    const mongoUrl = process.env.MONGODB_URL

    if (!mongoUrl) {
        throw new Error("MONGODB_URL is missing in .env")
    }

    mongoose.set("bufferCommands", false)
    applyCustomDnsServers()

    const baseOptions = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        family: 4
    }

    try {
        const connection = await mongoose.connect(mongoUrl, baseOptions)

        console.log(`Database Connected: ${connection.connection.host}`)
        return connection
    } catch (err) {
        const fallbackFromEnv = process.env.MONGODB_URL_DIRECT
        const fallbackFromSrv = buildDirectFallbackUri(mongoUrl)
        const fallbackUri = fallbackFromEnv || fallbackFromSrv

        if (isSrvDnsFailure(err) && fallbackUri) {
            try {
                console.warn("Primary MongoDB SRV lookup failed, trying direct fallback URI...")
                const fallbackConnection = await mongoose.connect(fallbackUri, baseOptions)
                console.log(`Database Connected (fallback): ${fallbackConnection.connection.host}`)
                return fallbackConnection
            } catch (fallbackError) {
                console.error("DB fallback connection failed:", fallbackError.message)
                throw fallbackError
            }
        }

        console.error("DB connection failed:", err.message)
        if (isSrvDnsFailure(err) && !fallbackUri) {
            console.error("Tip: set MONGODB_URL_DIRECT in .env to a non-SRV mongodb:// URI")
        }
        throw err
    }
}

export default connectdb