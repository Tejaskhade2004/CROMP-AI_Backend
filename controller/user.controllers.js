import stripe, { assertStripeConfigured } from "../config/stripe.js"

const STRIPE_PLAN_CATALOG = {
    pro: {
        monthly: {
            amount: 1900,
            credits: 1500,
            plan: "pro",
            name: "CROMP AI Pro Monthly"
        },
        yearly: {
            amount: 18000,
            credits: 20000,
            plan: "pro",
            name: "CROMP AI Pro Yearly"
        }
    },
    studio: {
        monthly: {
            amount: 3900,
            credits: 4000,
            plan: "enterprise",
            name: "CROMP AI Studio Monthly"
        },
        yearly: {
            amount: 37200,
            credits: 60000,
            plan: "enterprise",
            name: "CROMP AI Studio Yearly"
        }
    }
}

const getClientBaseUrl = () =>
    process.env.CLIENT_URL || process.env.PREVIOUS_URL || "http://localhost:5173"

export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.json({ user: null })
        }

        return res.json(req.user)
    } catch (error) {
        return res.status(500).json({ message: `get Current user error ${error}` })
    }
}

export const createStripeCheckoutSession = async (req, res) => {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })

        const { planId, billingMode } = req.body
        if (!planId) return res.status(400).json({ message: "planId is required" })
        if (planId === "starter") {
            return res.status(400).json({ message: "Starter plan is free and does not require checkout." })
        }

        const plan = STRIPE_PLAN_CATALOG[planId]
        if (!plan) return res.status(400).json({ message: "Invalid planId" })

        const normalizedBilling = billingMode === "yearly" ? "yearly" : "monthly"
        const selectedPlan = plan[normalizedBilling]

        assertStripeConfigured()

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        unit_amount: selectedPlan.amount,
                        product_data: {
                            name: selectedPlan.name,
                            description: `${selectedPlan.credits} credits added to your CROMP.AI account`
                        }
                    },
                    quantity: 1
                }
            ],
            success_url: `${getClientBaseUrl()}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getClientBaseUrl()}/pricing?checkout=cancel`,
            metadata: {
                userId: String(req.user._id),
                planId,
                billingMode: normalizedBilling,
                planTier: selectedPlan.plan,
                creditsToAdd: String(selectedPlan.credits)
            }
        })

        return res.status(200).json({
            checkoutUrl: session.url,
            sessionId: session.id
        })
    } catch (error) {
        return res.status(500).json({ message: `Create Stripe session error: ${error.message}` })
    }
}

export const verifyStripeCheckoutSession = async (req, res) => {
    try {
        if (!req.user?._id) return res.status(401).json({ message: "Unauthorized" })

        const { sessionId } = req.body
        if (!sessionId) return res.status(400).json({ message: "sessionId is required" })

        assertStripeConfigured()

        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (!session) return res.status(404).json({ message: "Checkout session not found" })
        if (session.payment_status !== "paid") {
            return res.status(400).json({ message: "Checkout session is not paid yet." })
        }

        const sessionUserId = session?.metadata?.userId
        if (!sessionUserId || sessionUserId !== String(req.user._id)) {
            return res.status(403).json({ message: "This checkout session does not belong to the current user." })
        }

        const user = req.user
        if (!user.processedStripeSessions) {
            user.processedStripeSessions = []
        }

        if (user.processedStripeSessions.includes(sessionId)) {
            return res.status(200).json({
                message: "Payment already verified.",
                user
            })
        }

        const creditsToAdd = Number(session?.metadata?.creditsToAdd || 0)
        const planTier = session?.metadata?.planTier

        if (!Number.isFinite(creditsToAdd) || creditsToAdd <= 0) {
            return res.status(400).json({ message: "Invalid credits configured for this payment." })
        }

        user.credits = (user.credits || 0) + creditsToAdd
        if (planTier && ["free", "pro", "enterprise"].includes(planTier)) {
            user.plan = planTier
        }
        user.processedStripeSessions.push(sessionId)
        await user.save()

        return res.status(200).json({
            message: "Payment verified and credits added successfully.",
            creditsAdded: creditsToAdd,
            user
        })
    } catch (error) {
        return res.status(500).json({ message: `Verify Stripe session error: ${error.message}` })
    }
}
