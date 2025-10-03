// src/components/Step1_Context.js

import React from 'react';

const Step1Context = ({ onNext }) => {
  return (
    <div className="card">
      <h2>1. Welcome to the Readiness Analyzer</h2>
      <p>
        This tool analyzes your invoice data against the mock GETS v0.1 schema. 
        It provides a score based on coverage, compliance, and data quality.
      </p>
      <button 
        onClick={onNext}
        className="btn-primary"
      >
        Start Upload & Analysis &rarr;
      </button>
    </div>
  );
};

export default Step1Context;