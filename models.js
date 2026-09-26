const mongoose = require('mongoose');

const defaultWorkdayHours = {
  0: 9, // Sunday
  1: 9, // Monday
  2: 9, // Tuesday
  3: 9, // Wednesday
  4: 9  // Thursday
};

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  theme: { type: String, default: 'light' },
  viewMode: { type: String, default: 'list' },
  defaultStartTime: { type: String, default: '09:00' },
  defaultEndTime: { type: String, default: '18:00' },
  workdayHours: { type: Object, default: defaultWorkdayHours },
  workStartDate: { type: String, default: '' }
});

const MonthDataSchema = new mongoose.Schema({
  username: { type: String, required: true },
  month: { type: String, required: true },
  data: { type: Object, default: {} }
}, { minimize: false });

const ExpensesDataSchema = new mongoose.Schema({
  username: { type: String, required: true },
  month: { type: String, required: true },
  data: {
    fuel: { type: Array, default: [] },
    food: { type: Array, default: [] },
    other: { type: Array, default: [] }
  }
}, { minimize: false });

MonthDataSchema.index({ username: 1, month: 1 }, { unique: true });
ExpensesDataSchema.index({ username: 1, month: 1 }, { unique: true });

module.exports = {
  User: mongoose.model('User', UserSchema),
  MonthData: mongoose.model('MonthData', MonthDataSchema),
  ExpensesData: mongoose.model('ExpensesData', ExpensesDataSchema)
};