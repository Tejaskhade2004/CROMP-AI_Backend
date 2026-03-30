import express from "express"
import {
    createStripeCheckoutSession,
    getCurrentUser,
    verifyStripeCheckoutSession
} from "../controller/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const UserRouter = express.Router()



UserRouter.get("/me",isAuth,getCurrentUser)
UserRouter.post("/stripe/create-checkout-session",isAuth,createStripeCheckoutSession)
UserRouter.post("/stripe/verify-checkout-session",isAuth,verifyStripeCheckoutSession)



export default UserRouter
