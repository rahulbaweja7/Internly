const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Models
const Job = require("./models/Job");

// Routes
const gmailRoutes = require("./routes/gmail");
app.use("/api/gmail", gmailRoutes);

// Add OAuth callback route at root level
app.use("/", gmailRoutes);

// Routes
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    const job = new Job(req.body);
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001")); 