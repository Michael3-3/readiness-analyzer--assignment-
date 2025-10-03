// src/components/Step2_Upload.js

import React, { useState } from 'react';
import { uploadDataRaw, analyzeData } from '../api/analyzerApi';

const initialFormState = {
    invoiceData: '',
    webhooks: true,
    sandbox_env: true,
    retries: false,
};

const Step2Upload = ({ setUploadId, setReportData, setLoading, setError, onSuccess }) => {
    const [form, setForm] = useState(initialFormState);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState([]);

    // P0 Requirement: Table preview with first 20 rows
    const generatePreview = (text) => {
        try {
            const data = JSON.parse(text);
            const arrayData = Array.isArray(data) ? data : [data];
            setPreviewData(arrayData.slice(0, 20)); // Cap at 20 rows
        } catch (e) {
            setPreviewData([{ error: "Cannot parse preview. Ensure valid JSON." }]);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setForm(prev => ({ ...prev, [name]: newValue }));
        
        if (name === 'invoiceData') {
            generatePreview(newValue);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setUploading(true);
        if (!form.invoiceData.trim()) { setError("Please paste data."); setUploading(false); return; }

        try {
            setLoading(true);
            
            // 1. POST /upload
            const uploadResponse = await uploadDataRaw(form.invoiceData, 'N/A', 'N/A');
            const newUploadId = uploadResponse.uploadId;
            setUploadId(newUploadId);

            // 2. POST /analyze
            const questionnaireData = { webhooks: form.webhooks, sandbox_env: form.sandbox_env, retries: form.retries };
            const report = await analyzeData(newUploadId, questionnaireData);

            setReportData(report);
            setLoading(false);
            onSuccess(); // Move to Step 3
        } catch (err) {
            setLoading(false);
            const errorMessage = err.response?.data?.error || "Analysis failed due to a network or server error.";
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const getKeys = () => {
        if (previewData.length === 0 || previewData[0].error) return [];
        return Object.keys(previewData[0]);
    };

    return (
        <form onSubmit={handleSubmit} className="step-content">
            <h2>2. Data Ingestion & Context</h2>
            
            {/* Input Area */}
            <div className="input-section">
                <textarea
                    name="invoiceData"
                    value={form.invoiceData}
                    onChange={handleChange}
                    placeholder="Paste your CSV or JSON invoice data here (JSON format preferred for preview accuracy)..."
                    rows="10"
                    className="data-input"
                    disabled={uploading}
                />
            </div>

            {/* P0 Requirement: Table Preview */}
            <div className="table-preview-container">
                <h3>Table Preview (First {previewData.length} Rows)</h3>
                <div className="table-wrapper">
                    <table className="table-preview">
                        <thead>
                            <tr>{getKeys().map(key => <th key={key}>{key}</th>)}</tr>
                        </thead>
                        <tbody>
                            {previewData.map((row, index) => (
                                <tr key={index}>
                                    {getKeys().map(key => (
                                        <td key={`${index}-${key}`}>
                                            {row.error ? <span className="error-badge">{row.error}</span> : String(row[key]).substring(0, 30) }
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {(previewData.length === 0 || previewData[0].error) && (
                            <tr><td colSpan={100} style={{textAlign: 'center', padding: '20px'}}>
                                {previewData[0]?.error || "No data or preview available. Paste data above."}
                            </td></tr>
                        )}
                    </table>
                </div>
            </div>

            {/* P0 Requirement: Questionnaire for Posture Score */}
            <h3 style={{marginTop: '20px'}}>Operational Posture (10% Score)</h3>
            <div className="questionnaire-section">
                <label><input type="checkbox" name="webhooks" checked={form.webhooks} onChange={handleChange} /> We support webhooks.</label>
                <label><input type="checkbox" name="sandbox_env" checked={form.sandbox_env} onChange={handleChange} /> We have a Sandbox environment.</label>
                <label><input type="checkbox" name="retries" checked={form.retries} onChange={handleChange} /> Our system implements retry logic.</label>
            </div>

            <button 
                type="submit"
                disabled={uploading || !form.invoiceData.trim()}
                className="btn-primary"
            >
                {uploading ? 'Analyzing...' : 'Analyze & Get Results'}
            </button>
        </form>
    );
};

export default Step2Upload;