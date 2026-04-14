import jwt  from "jsonwebtoken"
import User from "../models/user.model.js"

const isAuth = async(req,res,next)=>{
    try {
        if (req.path === "/me" && !req.cookies?.token) {
            return res.status(401).json({
                message:"Token not found.",
                code: "AUTH_TOKEN_MISSING"
            })
        }

        const token = req.cookies.token
        if(!token){
            return res.status(401).json({
                message:"Token not found.",
                code: "AUTH_TOKEN_MISSING"
            })
        }

        if (req.app?.locals?.dbReady === false) {
            return res.status(503).json({
                message: "Database is not connected. Please retry in a few seconds.",
                code: "DB_UNAVAILABLE"
            })
        }

        const decode = jwt.verify(token,process.env.JWT_SECRET)
        req.user = await User.findById(decode.id)
        if (!req.user) {
            return res.status(401).json({
                message: "Invalid token.",
                code: "AUTH_USER_NOT_FOUND"
            })
        }
        next()
    } catch (Error) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/"
        })
        return res.status(401).json({
            message:"Invalid token.",
            code: "AUTH_INVALID_TOKEN"
        })
    }
}

export default isAuth