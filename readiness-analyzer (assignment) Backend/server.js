// server.js

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const analyzerRoutes = require('./routes/analyzer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api', analyzerRoutes); 

// Simple health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', db: 'mongodb', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});