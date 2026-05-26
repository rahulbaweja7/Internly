require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { startReminderSchedule } = require('./utils/reminderService');

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    startReminderSchedule();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });