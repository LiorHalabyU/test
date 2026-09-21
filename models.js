const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  theme: { type: String, default: 'light' },
  viewMode: { type: String, default: 'list' }
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