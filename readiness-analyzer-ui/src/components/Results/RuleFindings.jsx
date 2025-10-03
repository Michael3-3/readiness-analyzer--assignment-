// src/components/Results/RuleFindings.js

import React from 'react';

const RuleItem = ({ rule, ok, exampleLine, value, expected, got }) => {
    const statusText = ok ? 'PASS' : 'FAIL';
    const statusClass = ok ? 'pass' : 'fail';
    
    let detail = '';
    
    if (!ok) {
        if (rule === 'LINE_MATH') {
            detail = `Line ${exampleLine} failed: Expected ${expected} but got ${got}.`;
        } else if (rule === 'CURRENCY_ALLOWED' && value) {
            detail = `Disallowed currency found: ${value}.`;
        } else if (rule === 'DATE_ISO') {
            detail = 'Date is not in YYYY-MM-DD format.';
        } else if (rule === 'TOTALS_BALANCE') {
            detail = 'Sum of VAT/Excl. VAT does not match Incl. VAT.';
        } else if (rule === 'TRN_PRESENT') {
            detail = 'Mandatory Tax Registration Number (TRN) is missing.';
        }
    }
    
    // P1 Nice-to-have: Fix Tip
    const fixTip = !ok ? (
        rule === 'DATE_ISO' ? "Tip: Use ISO dates like 2025-01-31." :
        rule === 'CURRENCY_ALLOWED' ? "Tip: Use one of: AED, SAR, MYR, USD." :
        "Tip: Check calculation logic or ensure field is present/non-empty."
    ) : null;


    return (
        <li className={`rule-item ${statusClass}`}>
            <span className="rule-name">{rule}</span>
            <span className={`rule-status badge-${statusClass}`}>{statusText}</span>
            {detail && <p className="rule-detail">{detail}</p>}
            {fixTip && <p className="rule-fix-tip">{fixTip}</p>}
        </li>
    );
};

const RuleFindings = ({ ruleFindings }) => {
    return (
        <div className="rule-findings-panel card">
            <h3>Rule Compliance (30% Score)</h3>
            <p>5 mandatory integrity checks run across all data rows.</p>
            <ul className="rule-list">
                {ruleFindings.map((finding, index) => (
                    <RuleItem key={index} {...finding} />
                ))}
            </ul>
        </div>
    );
};

export default RuleFindings;