const express = require('express');
const cors = require('cors');

const transactionRoutes =
    require('./routes/transactionRoutes');

const monthRoutes =
    require('./routes/monthRoutes');

const goalRoutes =
    require('./routes/goalRoutes');

const analyticsRoutes =
    require('./routes/analyticsRoutes');

const excelExportRoutes =
    require('./routes/excelExportRoutes');

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

// Set CORS_ORIGIN (comma-separated for multiple) in production.
// Falls back to allowing all origins for local development.
const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : '*';

app.use(cors({ origin: corsOrigin }));

app.use(express.json());


// ==========================================
// API ROUTES
// ==========================================

app.use(
    '/api/transactions',
    transactionRoutes
);

app.use(
    '/api/months',
    monthRoutes
);

app.use(
    '/api/goals',
    goalRoutes
);

app.use(
    '/api/analytics',
    analyticsRoutes
);

app.use(
    '/api/export/excel',
    excelExportRoutes
);


// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
    '/api/health',
    (req, res) => {

        res.json({
            status: 'ok',
            message:
                'Personal Finance Ledger API is running'
        });

    }
);


module.exports = app;