import dotenv from "dotenv"
import Stripe from "stripe"

dotenv.config()

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export const assertStripeConfigured = () => {
    if (!stripe) {
        throw new Error("STRIPE_SECRET_KEY is missing in .env")
    }
}

export default stripe
