const db = require('../database');

function validateTransaction(req, res, next) {
    const {
        month_id,
        transaction_date,
        type,
        category,
        description,
        amount,
        payment_method
    } = req.body;

    const errors = [];

    // ==========================================
    // MONTH ID
    // ==========================================

    if (!Number.isInteger(month_id) || month_id <= 0) {
        errors.push(
            'month_id must be a positive integer.'
        );
    }


    // ==========================================
    // TRANSACTION DATE
    // ==========================================

    if (!transaction_date) {
        errors.push(
            'transaction_date is required.'
        );
    } else if (
        !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(
            transaction_date
        )
    ) {
        errors.push(
            'transaction_date must be in YYYY-MM-DD format.'
        );
    }


    // ==========================================
    // TRANSACTION TYPE
    // ==========================================

    const validTypes = [
        'income',
        'expense',
        'lent'
    ];

    if (!validTypes.includes(type)) {
        errors.push(
            'type must be income, expense, or lent.'
        );
    }


    // ==========================================
    // CATEGORY
    // ==========================================

    if (
        !category ||
        typeof category !== 'string' ||
        category.trim() === ''
    ) {
        errors.push(
            'category is required.'
        );
    }


    // ==========================================
    // DESCRIPTION
    // ==========================================

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== 'string'
    ) {
        errors.push(
            'description must be text.'
        );
    }


    // ==========================================
    // AMOUNT
    // ==========================================

    if (
        !Number.isInteger(amount) ||
        amount <= 0
    ) {
        errors.push(
            'amount must be a positive integer in paise.'
        );
    }


    // ==========================================
    // PAYMENT METHOD
    // ==========================================

    if (
        !payment_method ||
        typeof payment_method !== 'string' ||
        payment_method.trim() === ''
    ) {
        errors.push(
            'payment_method is required.'
        );
    }


    // ==========================================
    // RETURN BASIC VALIDATION ERRORS
    // ==========================================

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed.',
            errors
        });
    }


    // ==========================================
    // CHECK THE SELECTED MONTH
    // ==========================================

    const month = db.prepare(`
        SELECT
            id,
            month,
            status
        FROM months
        WHERE id = ?
    `).get(month_id);


    if (!month) {
        return res.status(404).json({
            message: 'Selected month does not exist.'
        });
    }


    // ==========================================
    // PREVENT TRANSACTIONS IN COMPLETED MONTHS
    // ==========================================

    if (month.status === 'completed') {
        return res.status(409).json({
            message:
                'This month is completed. New transactions cannot be added.'
        });
    }


    // ==========================================
    // CHECK DATE BELONGS TO SELECTED MONTH
    // ==========================================

    if (
        !transaction_date.startsWith(
            `${month.month}-`
        )
    ) {
        return res.status(400).json({
            message:
                'Transaction date must belong to the selected month.',
            errors: [
                `Selected month is ${month.month}, but transaction date is ${transaction_date}.`
            ]
        });
    }


    // ==========================================
    // ALL VALIDATION PASSED
    // ==========================================

    next();
}

module.exports = validateTransaction;