const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  company: String,
  role: String,
  location: String,
  status: String, // Applied, Interview, Rejected, etc.
  stipend: String,
  dateApplied: Date,
  notes: String,
  emailId: String, // Gmail message ID to track processed emails
});

module.exports = mongoose.model("Job", jobSchema); 