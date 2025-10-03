// src/api/analyzerApi.js

import axios from 'axios';

// Ensure this URL matches your Express server running on port 3000
const API_BASE_URL = 'http://localhost:3000/api'; 

/**
 * P0: POST /upload (Raw JSON payload)
 */
export const uploadDataRaw = async (text, country, erp) => {
    const response = await axios.post(`${API_BASE_URL}/upload`, { 
        text, 
        country, 
        erp 
    }, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

/**
 * P0: POST /analyze
 */
export const analyzeData = async (uploadId, questionnaire) => {
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
        uploadId,
        questionnaire,
    }, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

/**
 * P0/P1: GET /report/:reportId (Used for shared link)
 */
export const getReport = async (reportId) => {
    const response = await axios.get(`${API_BASE_URL}/report/${reportId}`);
    return response.data;
};