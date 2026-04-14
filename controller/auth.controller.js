import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

const setAuthCookie = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
    const isProduction = process.env.NODE_ENV === "production"
    const isLocalhost = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes("localhost")
    
    res.cookie("token", token, {
        httpOnly: true,
        secure: isProduction && !isLocalhost,
        sameSite: isLocalhost ? "lax" : "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })
}

export const googleAuth = async (req, res) => {
    try {
        if (req.app?.locals?.dbReady === false) {
            return res.status(503).json({
                message: "Authentication service unavailable. Database is not connected."
            })
        }

        const { name, email, avatar } = req.body
        if (!email) {
            return res.status(400).json({
                message: "Email is Required"
            })
        }
        let user = await User.findOne({ email })
        if (!user) {
            user = await User.create({ name, email, avatar })
        }
        setAuthCookie(res, user._id)

        return res.status(200).json(user)

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            message: `Google Auth Error ${error}`
        })
    }
}

export const manualAuth = async (req, res) => {
    try {
        if (req.app?.locals?.dbReady === false) {
            return res.status(503).json({
                message: "Authentication service unavailable. Database is not connected."
            })
        }

        const { email, name, avatar } = req.body
        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }
        let user = await User.findOne({ email })
        if (!user) {
            if (!name) return res.status(400).json({ message: "Name required for new user" })
            user = await User.create({ name, email, avatar })
        }

        setAuthCookie(res, user._id)
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: `Manual Auth Error ${error}` })
    }
}


export const logOut = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === "production"
        const isLocalhost = !process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes("localhost")
        
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction && !isLocalhost,
            sameSite: isLocalhost ? "lax" : "none",
            path: "/"
        })
        return res.status(200).json({
            message: "Logout Success"
        })
    } catch (error) {
        return res.status(500).json({
            message: `LogOut Error ${error}`
        })
    }
}
