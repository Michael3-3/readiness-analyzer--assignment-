// models/Report.js

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Custom string ID for user-facing report links (r_xxx)
    reportId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    
    uploadId: { 
        type: String, 
        required: true 
    },

    createdAt: { 
        type: Date, 
        default: Date.now 
    },

    // P0 Requirement: Reports must survive process restarts for >= 7 days.
    // Setting an index to automatically delete documents after 7 days.
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from creation
        index: { expires: 0 } // MongoDB TTL index 
    },
    
    scoresOverall: { 
        type: Number, 
        required: true 
    },
    
    // Store the entire Report JSON structure
    reportJson: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    }
});

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;