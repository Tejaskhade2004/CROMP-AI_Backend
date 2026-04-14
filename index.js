import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectdb from "./config/db.js"
import mongoose from "mongoose"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import UserRouter from "./routes/user.routes.js"
import WebsiteRouter from "./routes/Website.routes.js"
import AIRouter from "./routes/ai.routes.js"


const app=express()
app.locals.dbReady = false
app.use(express.json())
app.use(cookieParser())

// CORS configuration for both development and production
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    process.env.FRONTEND_URL || "https://cromp-ai-frontend.onrender.com"
]

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

// Fix Firebase COOP warning
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
    next()
})
app.use("/api/auth",authRouter)
app.use("/api/user",UserRouter)
app.use("/api/website",WebsiteRouter)
app.use("/api/ai",AIRouter)

const startServer = async () => {
    try {
        await connectdb()
        app.locals.dbReady = true

        mongoose.connection.on("disconnected", () => {
            app.locals.dbReady = false
            console.warn("MongoDB disconnected")
        })

        mongoose.connection.on("connected", () => {
            app.locals.dbReady = true
        })

        const port = process.env.PORT || 5000
        app.listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
    } catch (error) {
        console.error("Server startup failed:", error.message)
        process.exit(1)
    }
}

startServer()
