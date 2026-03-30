import express from "express"

import isAuth from "../middlewares/isAuth.js"
import {
    generateWebsite,
    getWebsiteById,
    generateWebsiteChanges,
    getAllWebsites,
    deployWebsite,
    getDeployedWebsiteBySlug
} from "../controller/website.controllers.js"


const WebsiteRouter = express.Router()



WebsiteRouter.post("/generate",isAuth,generateWebsite)
WebsiteRouter.get("/get-by-id/:id",isAuth,getWebsiteById)
WebsiteRouter.post("/update/:id",isAuth,generateWebsiteChanges)
WebsiteRouter.get("/get-all",isAuth,getAllWebsites)
WebsiteRouter.post("/deploy/:id",isAuth,deployWebsite)
WebsiteRouter.get("/live/:slug",getDeployedWebsiteBySlug)






export default WebsiteRouter
