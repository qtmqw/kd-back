const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
    {
/*         image: {
            type: String,
            required: true,
        }, */
        title: {
            type: String,
            required: true,
            index: true,
        },
        description: {
            type: String,
            required: true,
        },
        color: {
            type: [
                {
                    type: String,
                    enum: ["red", "green", "blue"], // example validation
                },
            ],
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: "Products",
    }
);

const Products = mongoose.model("Product", productSchema)

module.exports = Products