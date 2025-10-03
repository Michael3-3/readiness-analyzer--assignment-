const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // Needed for serving static files

const analyzerRoutes = require('./routes/analyzer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(express.json()); // For parsing application/json

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --- API Routes ---
app.use('/api', analyzerRoutes); 

// Simple health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', db: 'mongodb', uptime: process.uptime() });
});

// --- Consolidated Frontend Serving (P0 Deployment Requirement) ---

const FRONTEND_BUILD_PATH = path.join(__dirname, 'frontend-build');

app.use(express.static(FRONTEND_BUILD_PATH));

app.get('*', (req, res) => {
    if (!req.url.startsWith('/api')) {
        res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'));
    } else {
        res.status(404).send("API Endpoint Not Found");
    }
});

app.listen(PORT, () => {
    console.log(`Server running consolidated app on port ${PORT}`);
});