const formidable = require('formidable');
const csv = require('csvtojson');
const fs = require('fs/promises'); // For file system operations in parseFile
const Upload = require('../models/Upload');
const Report = require('../models/Report'); // Import Report model

// --- Constants and Helpers ---

// Function to generate a simple unique ID
const generateUploadId = () => 'u_' + Math.random().toString(36).substring(2, 9);
const generateReportId = () => 'r_' + Math.random().toString(36).substring(2, 9);

// Maximum number of rows to process (P0 Requirement)
const MAX_ROWS = 200;

// Mock GETS v0.1 Schema Path List
const GETS_SCHEMA = {
    required: [
        'invoice.id', 'invoice.issue_date', 'invoice.currency', 
        'invoice.total_excl_vat', 'invoice.vat_amount', 'invoice.total_incl_vat',
        'seller.name', 'seller.trn', 'seller.country', 
        'buyer.name', 'buyer.trn', 'buyer.country', 
        'lines[].sku', 'lines[].qty', 'lines[].unit_price', 'lines[].line_total'
    ],
    allowedCurrencies: ["AED", "SAR", "MYR", "USD"]
};

const normalizeKey = (key) => key.toLowerCase().replace(/[\W_]+/g, '');

// --- Core Helper Functions ---

const parseFile = async (filePath, isJson) => {
    if (isJson) {
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content);
        return Array.isArray(data) ? data : [data];
    } else {
        const data = await csv().fromFile(filePath);
        return data;
    }
};

const saveUpload = async (res, data, format, country = null, erp = null) => {
    const limitedData = data.slice(0, MAX_ROWS);
    
    if (limitedData.length === 0) {
        return res.status(400).json({ error: 'The input file or text contained no parsable data.' });
    }

    const newUpload = new Upload({
        uploadId: generateUploadId(),
        country: country,
        erp: erp,
        sourceFormat: format,
        data: limitedData,
        rowsParsed: limitedData.length
    });

    await newUpload.save();
    
    return res.status(200).json({ uploadId: newUpload.uploadId });
};


// --- Handler for Raw Body Upload (JSON/Text) ---
const handleRawBody = async (req, res) => {
    const { text, country, erp } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Missing "text" field in raw body request.' });
    }

    try {
        let parsedData;
        let sourceFormat = 'json';

        try {
            parsedData = JSON.parse(text);
            if (!Array.isArray(parsedData)) {
                parsedData = [parsedData];
            }
        } catch (e) {
            sourceFormat = 'csv';
            parsedData = await csv().fromString(text);
        }

        const limitedData = parsedData.slice(0, MAX_ROWS);
        
        await saveUpload(res, limitedData, sourceFormat, country, erp);

    } catch (e) {
        console.error('Raw body parsing error:', e);
        return res.status(400).json({ error: 'Could not parse the provided text as valid JSON or CSV.' });
    }
};

// --- Handler for File Upload (Multipart) ---
const handleFileUpload = (req, res) => {
    const form = formidable({ 
        maxFileSize: 5 * 1024 * 1024,
        multiples: false,
    });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(500).json({ error: 'File upload failed or file too large.' });
        }

        const file = files.file ? files.file[0] : null;

        if (!file) {
            return res.status(400).json({ error: 'Missing file field in multipart request.' });
        }

        const filePath = file.filepath;
        const fileName = file.originalFilename || '';
        const isJson = fileName.endsWith('.json') || file.mimetype === 'application/json';
        const isCsv = fileName.endsWith('.csv') || file.mimetype === 'text/csv';

        if (!isJson && !isCsv) {
            return res.status(400).json({ error: 'Unsupported file format. Must be JSON or CSV.' });
        }

        try {
            const parsedData = await parseFile(filePath, isJson);
            await saveUpload(res, parsedData, isJson ? 'json' : 'csv', fields.country, fields.erp);
        } catch (parseError) {
            console.error('Parsing error:', parseError);
            return res.status(400).json({ error: 'Could not parse data. Ensure file is valid.' });
        }
    });
};

// --- CORE ANALYSIS LOGIC ---

const calculateCoverage = (sampleData) => {
    const sourceKeys = new Set();
    sampleData.forEach(doc => {
        Object.keys(doc).forEach(key => sourceKeys.add(key));
        if (doc.lines && Array.isArray(doc.lines)) {
            doc.lines.forEach(line => {
                Object.keys(line).forEach(key => sourceKeys.add(`lines[].${key}`));
            });
        }
    });

    const normalizedSourceKeys = Array.from(sourceKeys).map(key => ({
        original: key,
        normalized: normalizeKey(key)
    }));
    
    const normalizedGetsPaths = GETS_SCHEMA.required.map(path => ({
        original: path,
        normalized: normalizeKey(path.replace('[]', ''))
    }));

    const coverage = { matched: [], close: [], missing: [] };
    const usedSourceKeys = new Set();
    
    for (const getsPath of normalizedGetsPaths) {
        let bestMatch = null;
        
        for (const sourceKey of normalizedSourceKeys) {
            const similarity = sourceKey.normalized.includes(getsPath.normalized) || getsPath.normalized.includes(sourceKey.normalized);

            if (similarity) {
                if (sourceKey.normalized === getsPath.normalized && !usedSourceKeys.has(sourceKey.original)) {
                    coverage.matched.push(getsPath.original);
                    usedSourceKeys.add(sourceKey.original);
                    bestMatch = null; 
                    break; 
                }
                
                if (bestMatch === null) {
                    bestMatch = { target: getsPath.original, candidate: sourceKey.original, confidence: 0.8 }; 
                }
            }
        }
        
        if (coverage.matched.includes(getsPath.original)) continue;
        
        if (bestMatch) {
            coverage.close.push(bestMatch);
        } else {
            coverage.missing.push(getsPath.original);
        }
    }
    
    return { coverage };
};

const runRuleChecks = (sampleData) => {
    const findings = [];
    let passedCount = 0;
    
    // Rule 1: TOTALS_BALANCE
    const totalsBalanceFailed = sampleData.some(doc => {
        const excl = doc.total_excl_vat || 0;
        const vat = doc.vat_amount || 0;
        const incl = doc.total_incl_vat || 0;
        return Math.abs((Number(excl) + Number(vat)) - Number(incl)) > 0.01;
    });
    
    findings.push({ rule: "TOTALS_BALANCE", ok: !totalsBalanceFailed });
    if (!totalsBalanceFailed) passedCount++;


    // Rule 2: LINE_MATH
    let lineMathFailedDetails = null;
    const lineMathFailed = sampleData.some((doc, docIndex) => {
        if (!doc.lines || !Array.isArray(doc.lines)) return false;
        
        return doc.lines.some((line, lineIndex) => {
            const qty = Number(line.qty) || 0;
            const price = Number(line.unit_price) || 0;
            const total = Number(line.line_total) || 0;
            
            const expected = qty * price;
            if (Math.abs(expected - total) > 0.01) {
                lineMathFailedDetails = {
                    exampleLine: docIndex + 1,
                    expected: parseFloat(expected.toFixed(2)),
                    got: parseFloat(total.toFixed(2))
                };
                return true;
            }
            return false;
        });
    });
    
    findings.push({ rule: "LINE_MATH", ok: !lineMathFailed, ...lineMathFailedDetails });
    if (!lineMathFailed) passedCount++;
    
    
    // Rule 3: DATE_ISO
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; 
    const dateIsoFailed = sampleData.some(doc => {
        const dateStr = doc.date || doc.invoice_issue_date || null;
        return dateStr && !dateRegex.test(String(dateStr));
    });

    findings.push({ rule: "DATE_ISO", ok: !dateIsoFailed });
    if (!dateIsoFailed) passedCount++;


    // Rule 4: CURRENCY_ALLOWED
    let currencyAllowedFailedValue = null;
    const currencyAllowedFailed = sampleData.some(doc => {
        const currency = (doc.currency || '').toUpperCase();
        if (currency && !GETS_SCHEMA.allowedCurrencies.includes(currency)) {
            currencyAllowedFailedValue = currency;
            return true;
        }
        return false;
    });

    findings.push({ rule: "CURRENCY_ALLOWED", ok: !currencyAllowedFailed, value: currencyAllowedFailedValue });
    if (!currencyAllowedFailed) passedCount++;
    
    
    // Rule 5: TRN_PRESENT
    const trnPresentFailed = sampleData.some(doc => {
        const buyerTrn = doc.buyer_trn || '';
        const sellerTrn = doc.seller_trn || '';
        return !String(buyerTrn).trim() || !String(sellerTrn).trim();
    });

    findings.push({ rule: "TRN_PRESENT", ok: !trnPresentFailed });
    if (!trnPresentFailed) passedCount++;

    const ruleScore = Math.round((passedCount / 5) * 100);
    
    return { findings, ruleScore };
};


// --- CORE SCORING LOGIC ---

const calculateAllScores = (upload, coverage, ruleScore, questionnaire) => {
    // P0 Weights
    const WEIGHTS = { DATA: 0.25, COVERAGE: 0.35, RULES: 0.30, POSTURE: 0.10 };
    
    // 1. Posture Score (10% weight)
    const posturePoints = (questionnaire.webhooks ? 1 : 0) + 
                          (questionnaire.sandbox_env ? 1 : 0) + 
                          (questionnaire.retries ? 1 : 0);
    const postureScore = Math.round((posturePoints / 3) * 100);

    // 2. Data Score (25% weight)
    const dataScore = Math.round((upload.rowsParsed / MAX_ROWS) * 100);

    // 3. Coverage Score (35% weight)
    const totalRequiredFields = GETS_SCHEMA.required.length;
    const matchedFields = coverage.matched.length;
    const closeFields = coverage.close.length;

    const effectiveCoverage = matchedFields + (closeFields * 0.8);
    let coverageScore = Math.round((effectiveCoverage / totalRequiredFields) * 100);
    
    if (coverageScore > 100) coverageScore = 100;

    // 4. Overall Score (Weighted Sum)
    const overallScore = Math.round(
        (dataScore * WEIGHTS.DATA) + 
        (coverageScore * WEIGHTS.COVERAGE) + 
        (ruleScore * WEIGHTS.RULES) + 
        (postureScore * WEIGHTS.POSTURE)
    );

    return {
        data: dataScore,
        coverage: coverageScore,
        rules: ruleScore,
        posture: postureScore,
        overall: overallScore
    };
};


// --- MAIN EXPORTED API HANDLERS (Resolve TypeError) ---

/**
 * P0: POST /upload
 * Handles ingestion of CSV or JSON data via file upload or raw text/JSON body.
 * (The original 'upload' function is now defined below)
 */
exports.upload = async (req, res) => {
    const contentType = req.headers['content-type'];

    if (contentType && contentType.includes('multipart/form-data')) {
        handleFileUpload(req, res);
    } else {
        // Express.json() should populate req.body if Content-Type is application/json
        handleRawBody(req, res);
    }
};

/**
 * P0: POST /analyze
 * Triggers the analysis, calculates scores, and persists the report.
 */
exports.analyze = async (req, res) => {
    const { uploadId, questionnaire } = req.body;

    if (!uploadId || !questionnaire) {
        return res.status(400).json({ error: 'Missing uploadId or questionnaire in request body.' });
    }
    
    // 1. Retrieve Upload Data
    const upload = await Upload.findOne({ uploadId });
    if (!upload) {
        return res.status(404).json({ error: `Upload ID ${uploadId} not found.` });
    }
    
    const sampleData = upload.data;

    // 2. Run Analysis
    const { coverage } = calculateCoverage(sampleData);
    const { findings: ruleFindings, ruleScore } = runRuleChecks(sampleData);

    // 3. Calculate Scores
    const scores = calculateAllScores(upload, coverage, ruleScore, questionnaire);
    
    // 4. Generate Report JSON
    const reportId = generateReportId();
    const reportJson = {
        reportId: reportId,
        scores: scores,
        coverage: coverage,
        ruleFindings: ruleFindings,
        gaps: ruleFindings.filter(f => !f.ok).map(f => {
            const detail = f.value || (f.exampleLine ? ` (Line ${f.exampleLine})` : '');
            return `Rule Failed: ${f.rule}${detail}`;
        }),
        meta: {
            rowsParsed: upload.rowsParsed,
            linesTotal: sampleData.reduce((acc, doc) => acc + (doc.lines ? doc.lines.length : 0), 0),
            country: upload.country || 'N/A',
            erp: upload.erp || 'N/A',
            db: 'mongodb' 
        }
    };

    // 5. Persist Report
    const newReport = new Report({
        reportId: reportId,
        uploadId: uploadId,
        scoresOverall: scores.overall,
        reportJson: reportJson
    });

    try {
        await newReport.save();
        
        return res.status(200).json(reportJson);
        
    } catch (error) {
        console.error('Error saving report:', error);
        return res.status(500).json({ error: 'Failed to save the analysis report.' });
    }
};

/**
 * P0: GET /report/:reportId
 * Retrieves a persisted report by its ID.
 */
exports.getReport = async (req, res) => {
    const { reportId } = req.params;

    if (!reportId) {
        return res.status(400).json({ error: 'Missing reportId parameter.' });
    }

    try {
        const report = await Report.findOne({ reportId }).select('reportJson');

        if (!report) {
            return res.status(404).json({ error: `Report with ID ${reportId} not found.` });
        }

        return res.status(200).json(report.reportJson);

    } catch (error) {
        console.error(`Error retrieving report ${reportId}:`, error);
        return res.status(500).json({ error: 'An unexpected error occurred while retrieving the report.' });
    }
};