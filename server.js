const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect("mongodb://localhost:27017/notesApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// ==== Mongoose Models ====
const User = mongoose.model("User", new mongoose.Schema({
    name: String,
    prn: String,
    email: String,
    password: String,
    role: String, // student / teacher
    course: String,
    year: String,
    subject: String,
}));

const Note = mongoose.model("Note", new mongoose.Schema({
    title: String,
    subject: String,
    year: String,
    filename: String,
    uploadedBy: String,
}));

// ==== Multer Setup ====
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage });

// ==== Routes ====
app.post("/register", async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send({ status: "ok", message: "Registered successfully!" });
});

app.post("/login", async (req, res) => {
    const { prn, password } = req.body;
    const user = await User.findOne({ prn, password });
    if (!user) return res.status(401).send({ message: "Invalid credentials" });
    res.send({ status: "ok", user });
});

app.post("/upload", upload.single("note"), async (req, res) => {
    const note = new Note({
        title: req.body.title,
        subject: req.body.subject,
        year: req.body.year,
        filename: req.file.filename,
        uploadedBy: req.body.uploadedBy,
    });
    await note.save();
    res.send({ status: "ok", message: "Note uploaded successfully!" });
});

app.get("/notes", async (req, res) => {
    const { subject, year } = req.query;
    const notes = await Note.find({ subject, year });
    res.send(notes);
});

// ==== Start Server ====
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
