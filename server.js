const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

// Apply extracted routes
app.use('/', routes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/worktracker';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
