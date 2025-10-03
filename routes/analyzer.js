// routes/analyzer.js

const express = require('express');
const router = express.Router();
const analyzerController = require('../controllers/analyzerController');

// P0 Required API
router.post('/upload', analyzerController.upload);
router.post('/analyze', analyzerController.analyze);      // <-- UNCOMMENT THIS LINE
router.get('/report/:reportId', analyzerController.getReport); // <-- UNCOMMENT THIS LINE

module.exports = router;