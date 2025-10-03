// src/App.js

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { getReport } from './api/analyzerApi';
import Step1Context from './components/Step1_Context';
import Step2Upload from './components/Step2_Upload';
import Step3Results from './components/Step3_Results';
import './App.css'; 

// --- Core Wizard Logic ---
const AnalyzerWizard = () => {
  const [step, setStep] = useState(1);
  const [uploadId, setUploadId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleNext = () => setStep(prev => prev + 1);
  const handleStartOver = () => {
    setStep(1);
    setUploadId(null);
    setReportData(null);
    setError(null);
    navigate('/');
  };

  const renderStep = () => {
    // Note: Loading state is rendered in App.js
    
    switch (step) {
      case 1:
        return <Step1Context onNext={handleNext} />;
      case 2:
        return (
          <Step2Upload 
            setUploadId={setUploadId} 
            setReportData={setReportData} 
            setLoading={setLoading} 
            setError={setError}
            onSuccess={() => setStep(3)}
          />
        );
      case 3:
        if (!reportData) return <p className="error-message">Error: Report data is missing. Please start over.</p>;
        return (
          <Step3Results 
            reportData={reportData} 
            onStartOver={handleStartOver} 
          />
        );
      default:
        return <Step1Context onNext={handleNext} />;
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>E-Invoicing Readiness & Gap Analyzer</h1>
      </header>
      
      {/* P0 Requirement: Wizard Progress Bar */}
      <div className="wizard-progress-container">
        <div className={`step-item ${step === 1 ? 'active' : ''}`}>1. Context</div>
        <div className={`step-item ${step === 2 ? 'active' : ''}`}>2. Upload & Analyze</div>
        <div className={`step-item ${step === 3 ? 'active' : ''}`}>3. Results</div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <main>
        {renderStep()}
      </main>
    </div>
  );
};


// --- P1 Nice-to-Have: Read-Only Report View (Share Link Target) ---
const ReportView = () => {
    const { reportId } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        const fetchReport = async () => {
            try {
                // Retrieves report from the backend's GET /report/:id endpoint
                const data = await getReport(reportId);
                setReport(data);
            } catch (err) {
                setError("Report not found or failed to load.");
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    if (loading) return <div className="loading-spinner">Loading Report {reportId}...</div>;
    if (error) return <div className="error-message">{error}</div>;
    
    // Render Step3Results in read-only mode for shared link
    return (
      <div className="app-container">
        <header>
            <h1>Read-Only Analysis Report</h1>
        </header>
        <Step3Results reportData={report} isReadOnly={true} />
        <footer><p>This report survives restarts for ≥7 days (ID: {reportId}).</p></footer>
      </div>
    );
};

// --- App Router Setup ---
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<AnalyzerWizard />} />
                <Route path="/report/:reportId" element={<ReportView />} />
            </Routes>
            <footer style={{textAlign: 'center', marginTop: '20px', fontSize: '0.8em'}}>
                <p>Built for Assignment PRD — Powered by MREN Stack on MongoDB Atlas.</p>
            </footer>
        </BrowserRouter>
    );
}

export default App;