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

// Hours Schema
const MonthDataSchema = new mongoose.Schema({
  username: { type: String, required: true },
  month: { type: String, required: true }, // Format "YYYY-MM"
  data: { type: Object, default: {} } // Stores the day objects
}, { minimize: false });

// Expenses Schema (Updated for nested array reliability)
const ExpensesDataSchema = new mongoose.Schema({
  username: { type: String, required: true },
  month: { type: String, required: true }, // Format "YYYY-MM"
  data: {
    fuel: { type: Array, default: [] },
    food: { type: Array, default: [] },
    other: { type: Array, default: [] }
  }
}, { minimize: false });

MonthDataSchema.index({ username: 1, month: 1 }, { unique: true });
ExpensesDataSchema.index({ username: 1, month: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const MonthData = mongoose.model('MonthData', MonthDataSchema);
const ExpensesData = mongoose.model('ExpensesData', ExpensesDataSchema);

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

// Change Password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    
    // Find user with matching current password
    const user = await User.findOne({ username, password: oldPassword });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid current password.' });
    }
    
    // Update and save new password
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Month Data (Hours)
app.get('/api/workdata/:username/:month', async (req, res) => {
  try {
    const doc = await MonthData.findOne({ username: req.params.username, month: req.params.month });
    res.json(doc ? doc.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Day Data (Hours - Updated for Reliability)
app.post('/api/workdata/:username/:month', async (req, res) => {
  try {
    const { username, month } = req.params;
    const dayData = req.body;

    // Fetch existing first to merge the specific day
    let doc = await MonthData.findOne({ username, month });
    let currentData = doc ? doc.data : {};
    currentData[dayData.day] = dayData;

    await MonthData.findOneAndUpdate(
      { username, month },
      { $set: { data: currentData } },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Expenses Data
app.get('/api/expenses/:username/:month', async (req, res) => {
  try {
    const doc = await ExpensesData.findOne({ username: req.params.username, month: req.params.month });
    res.json(doc ? doc.data : { fuel: [], food: [], other: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Expenses Data (Updated for Reliability)
app.post('/api/expenses/:username/:month', async (req, res) => {
  try {
    const { username, month } = req.params;
    const expensesData = req.body; // Expects: { fuel: [], food: [], other: [] }

    // Using findOneAndUpdate with upsert perfectly overwrites the nested object
    await ExpensesData.findOneAndUpdate(
      { username, month },
      { $set: { data: expensesData } },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error("Save Expenses Error:", err.message);
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
