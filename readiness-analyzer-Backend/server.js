
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

const analyzerRoutes = require('./routes/analyzer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000', // Allow only the React app origin
    methods: ['GET', 'POST'],
    credentials: true
}));

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