import express from "express"
import { googleAuth, logOut, manualAuth } from "../controller/auth.controller.js"

const authRouter = express.Router()


authRouter.post("/google",googleAuth)
authRouter.post("/manual",manualAuth)
authRouter.get("/logout",logOut)


export default authRouter

//http:localhost:8000/api/auth/
