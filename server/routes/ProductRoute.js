// import modules
const express = require("express");
const router = express.Router();
const Product = require("../models/Products");

router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

router.post("/", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.json(product);
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        res.json(product);
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(product);
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(400).json(`Error: ${err}`);
    }
});

module.exports = router;