const express = require('express');

const {
    exportExcel
} = require('../controllers/excelExportController');

const router = express.Router();

router.get(
    '/',
    exportExcel
);

module.exports = router;