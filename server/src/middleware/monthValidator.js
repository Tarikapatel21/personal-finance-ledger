function validateMonth(req, res, next) {
    const { month, opening_balance } = req.body;

    const errors = [];

    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        errors.push('month must be in YYYY-MM format.');
    }

    if (
        !Number.isInteger(opening_balance) ||
        opening_balance < 0
    ) {
        errors.push(
            'opening_balance must be a non-negative integer in paise.'
        );
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed.',
            errors
        });
    }

    next();
}

module.exports = validateMonth;