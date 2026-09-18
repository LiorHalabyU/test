const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Schemas ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true } // Note: In production, hash this with bcrypt!
});

const MonthDataSchema = new mongoose.Schema({
  username: { type: String, required: true },
  month: { type: String, required: true }, // Format "YYYY-MM"
  data: { type: Object, default: {} } // Stores the day objects
});

MonthDataSchema.index({ username: 1, month: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const MonthData = mongoose.model('MonthData', MonthDataSchema);

// --- Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username exists.' });
    
    const user = new User({ username, password });
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Month Data
app.get('/api/workdata/:username/:month', async (req, res) => {
  try {
    const doc = await MonthData.findOne({ username: req.params.username, month: req.params.month });
    res.json(doc ? doc.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Day Data
app.post('/api/workdata/:username/:month', async (req, res) => {
  try {
    const { username, month } = req.params;
    const dayData = req.body; // e.g. { day: 15, start: "09:00", end: "18:00" }

    let doc = await MonthData.findOne({ username, month });
    if (!doc) {
      doc = new MonthData({ username, month, data: {} });
    }
    
    // Update the specific day's data inside the JSON object
    doc.data[dayData.day] = dayData;
    // Tell mongoose the object changed
    doc.markModified('data');
    
    await doc.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Connect & Start ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/worktracker';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));