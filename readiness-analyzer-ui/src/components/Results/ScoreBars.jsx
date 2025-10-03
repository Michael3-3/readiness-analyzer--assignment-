// src/components/Results/ScoreBars.js

import React from 'react';

const ScoreBar = ({ label, score, color }) => (
    <div className="score-item">
        <p className="score-label">{label} ({score}%)</p>
        <div className="score-bar-container">
            <div 
                className="score-bar-fill" 
                style={{ width: `${score}%`, backgroundColor: color }}
            ></div>
        </div>
    </div>
);

const ScoreBars = ({ scores, overallLabel }) => {
    return (
        <div className="score-dashboard card">
            <h2>Overall Readiness: <span className={`readiness-label ${overallLabel.toLowerCase().replace(' ', '-')}`}>{overallLabel} ({scores.overall})</span></h2>
            
            <ScoreBar label="Data Quality (25%)" score={scores.data} color="#28a745" />
            <ScoreBar label="Schema Coverage (35%)" score={scores.coverage} color="#007bff" />
            <ScoreBar label="Rule Compliance (30%)" score={scores.rules} color="#ffc107" />
            <ScoreBar label="Operational Posture (10%)" score={scores.posture} color="#6c757d" />
        </div>
    );
};

export default ScoreBars;