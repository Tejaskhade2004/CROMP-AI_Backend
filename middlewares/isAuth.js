import jwt  from "jsonwebtoken"
import User from "../models/user.model.js"

const isAuth = async(req,res,next)=>{
    try {
        const token = req.cookies.token
        if(!token){
            console.log("isAuth: no token cookie found", {
                cookies: req.cookies,
                headers: {
                    cookie: req.headers.cookie
                }
            })

            return res.status(400).json({
                message:"Token not Found."
            })
        }
        const decode = jwt.verify(token,process.env.JWT_SECRET)
        req.user = await User.findById(decode.id)
        next()
    } catch (Error) {
        return res.status(500).json({
            message:"Invalid token."
        })
    }
}

export default isAuth