const express = require('express');

const {
    createMonth,
    completeMonth,
    createNextMonth,
    getActiveMonth
} = require('../controllers/monthController');

const {
    getBalance
} = require('../controllers/balanceController');

const {
    getMonthSummary
} = require('../controllers/monthSummaryController');

const {
    getMonthHistory
} = require('../controllers/monthHistoryController');

const validateMonth =
    require('../middleware/monthValidator');

const router = express.Router();


// ==========================================
// CREATE MONTH
// ==========================================

router.post(
    '/',
    validateMonth,
    createMonth
);


// ==========================================
// MONTH HISTORY
// ==========================================

router.get(
    '/history',
    getMonthHistory
);


// ==========================================
// ACTIVE MONTH
// ==========================================

router.get(
    '/active',
    getActiveMonth
);


// ==========================================
// MONTH BALANCE
// ==========================================

router.get(
    '/:monthId/balance',
    getBalance
);


// ==========================================
// MONTH SUMMARY
// ==========================================

router.get(
    '/:monthId/summary',
    getMonthSummary
);


// ==========================================
// COMPLETE MONTH
// ==========================================

router.post(
    '/:monthId/complete',
    completeMonth
);


// ==========================================
// CREATE NEXT MONTH
// ==========================================

router.post(
    '/:monthId/next',
    createNextMonth
);


module.exports = router;