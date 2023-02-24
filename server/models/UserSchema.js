const mongoose = require("mongoose")

const UserSchemaDetails = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
        },

        userType: {
            type: String,
            enum: ["Admin", "User"],
            required: true,
            default: "User",
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: "UserInfo",
    }
)

mongoose.model("UserInfo", UserSchemaDetails)