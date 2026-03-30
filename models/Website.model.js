import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });

const websiteSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        default: "Untitled Website"
    },
    latestCode: {
        type: String,
        required: true
    },
    conversation: [messageSchema],
    deployed: {
        type: Boolean,
        default: false
    },
    deployURL: {
        type: String,
        default: ""
    },
    slug: {
        type: String,
        unique: true,
        // required: true
    }
}, { timestamps: true });

const Website =
    mongoose.models.Website ||
    mongoose.model("Website", websiteSchema);

export default Website;