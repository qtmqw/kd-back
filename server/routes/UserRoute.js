// import modules
const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const sendMail = require('../modules/NodeMailer');
const router = express.Router()
const validator = require('validator');
require('dotenv').config();

// db
require("../models/UserSchema")
const User = mongoose.model("UserInfo")

// routes

// register
router.post("/register", async (req, res) => {
    const { username, email, password, userType } = req.body
    // Validate input fields
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: "Invalid email" });
    }
    if (!validator.isLength(username, { min: 4, max: 20 })) {
        return res.status(400).json({ error: "Username must be between 4 and 20 characters" });
    }
    if (!validator.isLength(password, { min: 8 })) {
        return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    try {
        const oldUser = await User.findOne({ email })
        if (oldUser) {
            return res.status(409).json({ error: "User with email already exists" });
        }
        await User.create({
            username,
            email,
            password: await bcrypt.hash(password, 10),
            userType,
        })
        return res.status(201).json({ status: "OK", message: "User created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
})

// login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRATION_TIME || "1h",
        });

        res.status(200).json({ status: "OK", data: token });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

// user data
router.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET, (err, res) => {

            return res;
        });
        console.log(user);

        const useremail = user.email;
        User.findOne({ email: useremail })
            .then((data) => {
                res.send({ status: "OK", data: data });
            })
            .catch((error) => {
                res.send({ status: "error", data: error });
            });
    } catch (error) { }
});

// forgot password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = process.env.JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: "999999999999999s",
        });
        const link = `http://localhost:8080/reset-password/${oldUser._id}/${token}`;
        sendMail({ to: email, subject: 'Reset Password', text: link });
        console.log(link);
    } catch (error) { }
});

// reset password get
router.get("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    console.log(req.params);
    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = process.env.JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        res.render("index", { email: verify.email, status: "Not Verified" });
    } catch (error) {
        console.log(error);
        res.send("Not Verified");
    }
})

// reset password post
router.post("/reset-password/:id/:token", async (req, res) => {
    const { id, token } = req.params;
    const { password } = req.body

    const oldUser = await User.findOne({ _id: id });
    if (!oldUser) {
        return res.json({ status: "User Not Exists!!" });
    }
    const secret = process.env.JWT_SECRET + oldUser.password;
    try {
        const verify = jwt.verify(token, secret);
        const encryptedPassword = await bcrypt.hash(password, 10);
        await User.updateOne(
            {
                _id: id,
            },
            {
                $set: {
                    password: encryptedPassword,
                },
            }
        );
        res.render("index", { email: verify.email, status: "Verified" });
    } catch (error) {
        console.log(error);
        res.send({ status: "Parole netika atjaunota" });
    }
})

// get all users
router.get("/getAllUser", async (req, res) => {
    try {
        const allUser = await User.find({})
        res.send({ status: "OK", data: allUser })
    } catch (err) {
        console.log(err)
    }
})

// delete user
router.post("/deleteUser", async (req, res) => {
    const { userid } = req.body;
    try {
        User.deleteOne({ _id: userid }, function (err, res) {
            console.log(err);
        });
        res.send({ status: "OK", data: "Deleted" });
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;