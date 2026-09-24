const express = require('express');

const {
    getAnalytics
} = require('../controllers/analyticsController');

const router = express.Router();


// Get complete financial analytics

router.get(
    '/',
    getAnalytics
);


module.exports = router;