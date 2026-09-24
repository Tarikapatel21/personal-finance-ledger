const db = require('../database');

const {
    completeMonth,
    createNextMonth,
    getActiveMonth
} = require('../services/monthService');


// ==========================================
// CREATE MONTH
// ==========================================

function createMonth(req, res) {
    const {
        month,
        opening_balance
    } = req.body;

    try {
        const statement = db.prepare(`
            INSERT INTO months (
                month,
                opening_balance
            )
            VALUES (?, ?)
        `);

        const result = statement.run(
            month,
            opening_balance
        );

        return res.status(201).json({
            message:
                'Month created successfully.',

            month: {
                id: Number(
                    result.lastInsertRowid
                ),
                month,
                opening_balance,
                status: 'active'
            }
        });

    } catch (error) {

        if (
            error.code ===
            'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return res.status(409).json({
                message:
                    'This month already exists.'
            });
        }

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to create month.'
        });
    }
}


// ==========================================
// COMPLETE MONTH
// ==========================================

function completeMonthController(
    req,
    res
) {
    const monthId =
        Number(req.params.monthId);

    if (
        !Number.isInteger(monthId) ||
        monthId <= 0
    ) {
        return res.status(400).json({
            message:
                'monthId must be a positive integer.'
        });
    }

    try {

        const result =
            completeMonth(monthId);

        if (!result.success) {

            if (
                result.reason ===
                'MONTH_NOT_FOUND'
            ) {
                return res.status(404).json({
                    message:
                        'Month not found.'
                });
            }

            if (
                result.reason ===
                'MONTH_ALREADY_COMPLETED'
            ) {
                return res.status(409).json({
                    message:
                        'This month is already completed.'
                });
            }

            if (
                result.reason ===
                'BALANCE_NOT_FOUND'
            ) {
                return res.status(404).json({
                    message:
                        'Unable to calculate month balance.'
                });
            }
        }

        return res.status(200).json({
            message:
                'Month completed successfully.',
            month: result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to complete month.'
        });
    }
}


// ==========================================
// CREATE NEXT MONTH
// ==========================================

function createNextMonthController(
    req,
    res
) {
    const previousMonthId =
        Number(req.params.monthId);

    const {
        month
    } = req.body;

    if (
        !Number.isInteger(previousMonthId) ||
        previousMonthId <= 0
    ) {
        return res.status(400).json({
            message:
                'monthId must be a positive integer.'
        });
    }

    if (
        !month ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ) {
        return res.status(400).json({
            message:
                'month must be in YYYY-MM format.'
        });
    }

    try {

        const result =
            createNextMonth(
                previousMonthId,
                month
            );

        if (!result.success) {

            if (
                result.reason ===
                'PREVIOUS_MONTH_NOT_FOUND'
            ) {
                return res.status(404).json({
                    message:
                        'Previous month not found.'
                });
            }

            if (
                result.reason ===
                'PREVIOUS_MONTH_NOT_COMPLETED'
            ) {
                return res.status(409).json({
                    message:
                        'Previous month must be completed first.'
                });
            }

            if (
                result.reason ===
                'NEXT_MONTH_ALREADY_EXISTS'
            ) {
                return res.status(409).json({
                    message:
                        'This month already exists.'
                });
            }

            if (
                result.reason ===
                'INVALID_NEXT_MONTH'
            ) {
                return res.status(400).json({
                    message:
                        `Next month must be ${result.expectedMonth}.`
                });
            }

            if (
                result.reason ===
                'BALANCE_NOT_FOUND'
            ) {
                return res.status(404).json({
                    message:
                        'Unable to calculate previous month balance.'
                });
            }
        }

        return res.status(201).json({
            message:
                'Next month created successfully.',
            month: result.month
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to create next month.'
        });
    }
}


// ==========================================
// GET ACTIVE MONTH
// ==========================================

function getActiveMonthController(
    req,
    res
) {
    try {

        const month =
            getActiveMonth();

        if (!month) {
            return res.status(404).json({
                message:
                    'No active month found.'
            });
        }

        return res.status(200).json({
            month
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to get active month.'
        });
    }
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    createMonth:
        createMonth,

    completeMonth:
        completeMonthController,

    createNextMonth:
        createNextMonthController,

    getActiveMonth:
        getActiveMonthController
};