const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Models
const Job = require("./models/Job");
const User = require("./models/User");

// Passport configuration
passport.use(new (require('passport-google-oauth20').Strategy)({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }
    
    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
const authRoutes = require("./routes/auth");
const gmailRoutes = require("./routes/gmail");

app.use("/api/auth", authRoutes);
app.use("/api/gmail", gmailRoutes);

// Add OAuth callback route at root level
app.use("/", gmailRoutes);

// Protected job routes
app.get("/api/jobs", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const jobs = await Job.find({ userId: req.user._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/jobs", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    console.log('Received job data:', req.body);
    const job = new Job({
      ...req.body,
      userId: req.user._id
    });
    console.log('Created job object:', job);
    await job.save();
    console.log('Job saved successfully:', job._id);
    res.status(201).json(job);
  } catch (error) {
    console.error('Error saving job:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/jobs/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, 
      req.body, 
      { new: true }
    );
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/jobs/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const job = await Job.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001")); 