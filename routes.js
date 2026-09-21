const express = require('express');
const router = express.Router();
const { User, MonthData, ExpensesData } = require('./models');

// Register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username exists.' });
    
    const user = new User({ username, password, theme: 'light', viewMode: 'list' });
    await user.save();
    res.json({ success: true, theme: user.theme, viewMode: user.viewMode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
router.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    
    res.json({ 
      success: true, 
      theme: user.theme || 'light',
      viewMode: user.viewMode || 'list'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Change Password
router.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ username, password: oldPassword });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid current password.' });
    
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Theme
router.post('/api/auth/theme', async (req, res) => {
  try {
    const { username, theme } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { theme } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update View Mode 
router.post('/api/auth/viewmode', async (req, res) => {
  try {
    const { username, viewMode } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { viewMode } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update View Mode (Settings)
router.post('/api/auth/settings', async (req, res) => {
  try {
    const { username, viewMode } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { viewMode } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get Month Data
router.get('/api/workdata/:username/:month', async (req, res) => {
  try {
    const doc = await MonthData.findOne({ username: req.params.username, month: req.params.month });
    res.json(doc ? doc.data : {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Day Data
router.post('/api/workdata/:username/:month', async (req, res) => {
  try {
    const { username, month } = req.params;
    const dayData = req.body;

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
router.get('/api/expenses/:username/:month', async (req, res) => {
  try {
    const doc = await ExpensesData.findOne({ username: req.params.username, month: req.params.month });
    res.json(doc ? doc.data : { fuel: [], food: [], other: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Expenses Data
router.post('/api/expenses/:username/:month', async (req, res) => {
  try {
    const { username, month } = req.params;
    const expensesData = req.body;

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

module.exports = router;