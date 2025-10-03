// src/components/Results/CoveragePanel.js

import React from 'react';

const CoverageItem = ({ target, status, candidate }) => {
    const className = status.toLowerCase();
    
    // P1 Requirement: Close-match hints (Implemented with template logic)
    const hint = status === 'CLOSE' 
        ? `${candidate} likely maps to ${target} (name similarity).`
        : status === 'MISSING'
        ? `Mandatory field is absent in source data.`
        : `Exact match found in source.`;

    return (
        <li className={`coverage-item ${className}`}>
            <span className="coverage-target">{target}</span>
            <span className={`coverage-status-badge badge-${className}`}>{status}</span>
            <p className="coverage-hint">{hint}</p>
        </li>
    );
};

const CoveragePanel = ({ coverage }) => {
    const allCoverage = [
        ...coverage.matched.map(target => ({ target, status: 'MATCHED' })),
        ...coverage.close.map(item => ({ target: item.target, status: 'CLOSE', candidate: item.candidate })),
        ...coverage.missing.map(target => ({ target, status: 'MISSING' })),
    ].sort((a, b) => a.status.localeCompare(b.status));

    return (
        <div className="coverage-panel card">
            <h3>Schema Coverage Map (35% Score)</h3>
            <p>Detection of required GETS v0.1 fields in your data sample.</p>
            <ul className="coverage-list">
                {allCoverage.map((item, index) => (
                    <CoverageItem key={index} {...item} />
                ))}
            </ul>
        </div>
    );
};

export default CoveragePanel;