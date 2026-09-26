const express = require('express');
const router = express.Router();
const { User, MonthData, ExpensesData } = require('./models');

const defaultWorkdayHours = {
  0: 9, 1: 9, 2: 9, 3: 9, 4: 9
};

// Register
router.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ success: false, message: 'Username exists.' });

    const user = new User({
      username,
      password,
      theme: 'light',
      viewMode: 'list',
      defaultStartTime: '09:00',
      defaultEndTime: '18:00',
      workdayHours: defaultWorkdayHours,
      workStartDate: ''
    });
    await user.save();
    res.json({
      success: true,
      theme: user.theme,
      viewMode: user.viewMode,
      defaultStartTime: user.defaultStartTime,
      defaultEndTime: user.defaultEndTime,
      workdayHours: user.workdayHours,
      workStartDate: user.workStartDate
    });
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
      viewMode: user.viewMode || 'list',
      defaultStartTime: user.defaultStartTime || '09:00',
      defaultEndTime: user.defaultEndTime || '18:00',
      workdayHours: user.workdayHours || defaultWorkdayHours,
      workStartDate: user.workStartDate || ''
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

// Update Default Hours (Global fallback)
router.post('/api/auth/default-hours', async (req, res) => {
  try {
    const { username, defaultStartTime, defaultEndTime } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { defaultStartTime, defaultEndTime } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Specific Workday Target Hours
router.post('/api/auth/workday-hours', async (req, res) => {
  try {
    const { username, workdayHours } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { workdayHours } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Work Start Date
router.post('/api/auth/work-start-date', async (req, res) => {
  try {
    const { username, workStartDate } = req.body;
    await User.findOneAndUpdate({ username }, { $set: { workStartDate } });
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