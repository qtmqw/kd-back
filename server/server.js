// import modules
const express = require("express")
const mongoose = require("mongoose")
const { json, urlencoded } = express
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
var nodemailer = require('nodemailer');


// require
require("./schemas/UserSchema")
require("dotenv").config();

// app
const app = express()
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors())
app.set("view engine", "ejs")

// db
mongoose.set("strictQuery", false);
mongoose.connect(process.env.mongoUrl, {
    useNewUrlParser: true,
})
    .then(() => { console.log("DB CONNECTED") })
    .catch(e => console.log(e))

const User = mongoose.model("UserInfo")

// register
app.post("/register", async (req, res) => {
    const { username, email, password, userType } = req.body
    const encryptedPassword = await bcrypt.hash(password, 10)
    try {
        const oldUser = await User.findOne({ email })
        if (oldUser) {
            res.send({ error: "Lietotāja e-pasts jau eksistē" })
        }
        await User.create({
            username,
            email,
            password: encryptedPassword,
            userType,
        })
        res.send({ status: "OK" })
    } catch (error) {
        res.send({ status: "error" })
    }
})

// login
app.post("/login", async (req, res) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
        return res.json({ error: "Lietotājs neeksistē" })
    }
    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "604800s",
        })
        if (res.status(201)) {
            return res.json({ status: "OK", data: token })
        } else {
            return res.json({ error: "error" })
        }
    }
    res.json({ status: "error", error: "Nepareiza parole" })
})

// user data

app.post("/userData", async (req, res) => {
    const { token } = req.body;
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET, (err, res) => {
            if (err) {
                return "token expired";
            }
            return res;
        });
        console.log(user);
        if (user == "token expired") {
            return res.send({ status: "error", data: "token expired" });
        }

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

app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const oldUser = await User.findOne({ email });
        if (!oldUser) {
            return res.json({ status: "User Not Exists!!" });
        }
        const secret = process.env.JWT_SECRET + oldUser.password;
        const token = jwt.sign({ email: oldUser.email, id: oldUser._id }, secret, {
            expiresIn: "5m",
        });
        const link = `http://localhost:8080/reset-password/${oldUser._id}/${token}`;
        var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "someone1.pass@gmail.com",
                pass: "wkyhyjzcjpohbczi",
            },
        });

        var mailOptions = {
            from: "Abika.reset.password.com",
            to: "maikls303@gmail.com",
            subject: "Password Reset",
            text: link,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
        console.log(link);
    } catch (error) { }
});


app.get("/reset-password/:id/:token", async (req, res) => {
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

app.post("/reset-password/:id/:token", async (req, res) => {
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

app.get("/getAllUser", async (req, res) => {
    try {
        const allUser = await User.find({})
        res.send({ status: "OK", data: allUser })
    } catch (err) {
        console.log(err)
    }
})

app.post("/deleteUser", async (req, res) => {
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

// port
const port = process.env.PORT || 8080

// listener
const server = app.listen(port, () => { console.log("Server started!") })