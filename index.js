import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectdb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import UserRouter from "./routes/user.routes.js"
import WebsiteRouter from "./routes/Website.routes.js"


const app=express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"https://cromp-ai-frontend.onrender.com",
    credentials:true
}))
app.use("/api/auth",authRouter)
app.use("/api/user",UserRouter)
app.use("/api/website",WebsiteRouter)

app.listen(process.env.PORT || 5000,()=>{
    console.log("Server running...");
    connectdb()
    
})
