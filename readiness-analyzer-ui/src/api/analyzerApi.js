// src/api/analyzerApi.js

import axios from 'axios';

// CRITICAL CHANGE: Use a relative path. 
// When the frontend (served by Express) requests /api, Express handles it directly 
// on the same port (3000) without relying on 'localhost'.
const API_BASE_URL = '/api'; 


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
    // The relative path correctly targets http://<EC2-IP>:3000/api/report/:reportId
    const response = await axios.get(`${API_BASE_URL}/report/${reportId}`); 
    return response.data;
};