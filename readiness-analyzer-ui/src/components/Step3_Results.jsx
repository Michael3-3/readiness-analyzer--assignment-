// src/components/Step3_Results.js

import React from 'react';
import ScoreBars from './Results/ScoreBars';
import CoveragePanel from './Results/CoveragePanel';
import RuleFindings from './Results/RuleFindings';

const Step3Results = ({ reportData, onStartOver, isReadOnly = false }) => {
    const { reportId, scores, coverage, ruleFindings, meta } = reportData;

    // Determine Readiness Label based on Overall Score (Example thresholds)
    const getReadinessLabel = (score) => {
        if (score >= 80) return "High Readiness";
        if (score >= 50) return "Medium Readiness";
        return "Low Readiness";
    };

    const overallLabel = getReadinessLabel(scores.overall);
    // Note: The shareable link points to the GET /report/:id endpoint via the frontend router
    const shareUrl = `${window.location.origin}/report/${reportId}`; 

    // P0 Action: Download Report JSON
    const handleDownload = () => {
        const jsonString = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `readiness_report_${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // P0 Action: Copy shareable link
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
            .then(() => alert('Shareable URL copied to clipboard!'))
            .catch(() => alert('Failed to copy URL.'));
    };

    return (
        <div className="step-content">
            <h2>3. Analysis Results: {overallLabel}</h2>
            <div className="card results-header">
                <h3>Report ID: {reportId}</h3>
                <p>Analysis for {meta.rowsParsed} rows from {meta.erp} ({meta.country}) via {meta.db}.</p>
            </div>

            {/* --- P0 Requirement: Score Bars (Four + Overall) --- */}
            <ScoreBars scores={scores} overallLabel={overallLabel} />

            <div className="results-grid">
                {/* --- P0 Requirement: Rule Findings Panel --- */}
                <div className="grid-item">
                    <RuleFindings ruleFindings={ruleFindings} />
                </div>

                {/* --- P0 Requirement: Coverage Panel --- */}
                <div className="grid-item">
                    <CoveragePanel coverage={coverage} />
                </div>
            </div>

            {/* --- P0 Requirement: Actions --- */}
            {!isReadOnly && (
                <div className="results-actions">
                    <button onClick={handleDownload} className="btn-secondary" style={{marginRight: '10px'}}>
                        Download Report JSON
                    </button>
                    <button onClick={handleCopyLink} className="btn-secondary">
                        Copy Shareable Link
                    </button>
                    <button onClick={onStartOver} className="btn-primary" style={{ marginLeft: 'auto' }}>
                        Start New Analysis
                    </button>
                </div>
            )}
        </div>
    );
};

export default Step3Results;
