const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Middleware ====
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ⬅ for accessing uploaded notes

// ==== MongoDB Connection ====
mongoose.connect("mongodb://localhost:27017/notesApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection failed", err));

// ==== Mongoose Models ====
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  prn: { type: String, unique: true },
  email: String,
  password: String,
  role: String, // student or teacher
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
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir); // create if not exists
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ==== API Routes ====

app.post("/register", async (req, res) => {
  try {
    const existing = await User.findOne({ prn: req.body.prn });
    if (existing) return res.status(409).send({ status: "error", message: "PRN already exists." });

    const user = new User(req.body);
    await user.save();
    res.send({ status: "ok", message: "Registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "error", message: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  const { prn, password } = req.body;
  try {
    const user = await User.findOne({ prn, password });
    if (!user) return res.status(401).send({ message: "Invalid credentials" });

    res.send({ status: "ok", user });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "error", message: "Login failed" });
  }
});

app.post("/upload", upload.single("note"), async (req, res) => {
  try {
    const note = new Note({
      title: req.body.title,
      subject: req.body.subject,
      year: req.body.year,
      filename: req.file.filename,
      uploadedBy: req.body.uploadedBy,
    });
    await note.save();
    res.send({ status: "ok", message: "Note uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: "error", message: "Upload failed" });
  }
});

app.get("/notes", async (req, res) => {
  try {
    const { subject, year } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (year) filter.year = year;

    const notes = await Note.find(filter);
    res.send(notes);
  } catch (err) {
    res.status(500).send({ status: "error", message: "Fetching notes failed" });
  }
});

// ==== Serve HTML Pages ====
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/student.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

app.get("/teacher.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "teacher.html"));
});

app.get("/", (req, res) => {
  res.redirect("/login");
});

// ==== Start Server ====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
