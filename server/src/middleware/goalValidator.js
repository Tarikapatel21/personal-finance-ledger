function isValidDate(dateString) {
    if (
        typeof dateString !== 'string' ||
        !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(
            dateString
        )
    ) {
        return false;
    }

    const [year, month, day] =
        dateString.split('-').map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}


function validateGoal(req, res, next) {
    const {
        name,
        target_amount,
        target_date,
        saved_amount
    } = req.body;

    const errors = [];


    // ==========================================
    // GOAL NAME
    // ==========================================

    if (
        !name ||
        typeof name !== 'string' ||
        name.trim() === ''
    ) {
        errors.push(
            'name is required.'
        );
    } else if (
        name.trim().length > 100
    ) {
        errors.push(
            'name cannot exceed 100 characters.'
        );
    }


    // ==========================================
    // TARGET AMOUNT
    // ==========================================

    if (
        !Number.isInteger(target_amount) ||
        target_amount <= 0
    ) {
        errors.push(
            'target_amount must be a positive integer in paise.'
        );
    }


    // ==========================================
    // TARGET DATE
    // ==========================================

    if (!isValidDate(target_date)) {
        errors.push(
            'target_date must be a valid date in YYYY-MM-DD format.'
        );
    }


    // ==========================================
    // SAVED AMOUNT
    // ==========================================

    if (
        saved_amount === undefined ||
        saved_amount === null
    ) {
        req.body.saved_amount = 0;
    } else if (
        !Number.isInteger(saved_amount) ||
        saved_amount < 0
    ) {
        errors.push(
            'saved_amount must be a non-negative integer in paise.'
        );
    }


    // ==========================================
    // SAVED AMOUNT CANNOT EXCEED TARGET
    // ==========================================

    const finalSavedAmount =
        req.body.saved_amount;

    if (
        Number.isInteger(target_amount) &&
        Number.isInteger(finalSavedAmount) &&
        finalSavedAmount > target_amount
    ) {
        errors.push(
            'saved_amount cannot be greater than target_amount.'
        );
    }


    // ==========================================
    // RETURN ERRORS
    // ==========================================

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed.',
            errors
        });
    }


    // ==========================================
    // VALIDATION PASSED
    // ==========================================

    next();
}


module.exports = validateGoal;