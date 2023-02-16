// import modules
const express = require("express")
const mongoose = require("mongoose")
const { json, urlencoded } = express
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")



// require
require("./schemas/UserSchema")
require("dotenv").config();

// app
const app = express()
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors())

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
    const { username, email, password } = req.body
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
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET)

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
                res.send({ status: "ok", data: data });
            })
            .catch((error) => {
                res.send({ status: "error", data: error });
            });
    } catch (error) { }
});


// port
const port = process.env.PORT || 8080

// listener
const server = app.listen(port, () => { console.log("Server started!") })