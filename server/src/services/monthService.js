const db = require('../database');
const { getBalance } = require('./balanceService');


// ==========================================
// GET NEXT CALENDAR MONTH
// ==========================================

function getNextCalendarMonth(month) {
    const [year, monthNumber] =
        month.split('-').map(Number);

    const date = new Date(
        year,
        monthNumber - 1,
        1
    );

    date.setMonth(
        date.getMonth() + 1
    );

    const nextYear =
        date.getFullYear();

    const nextMonthNumber =
        String(
            date.getMonth() + 1
        ).padStart(2, '0');

    return `${nextYear}-${nextMonthNumber}`;
}


// ==========================================
// COMPLETE MONTH
// ==========================================

function completeMonth(monthId) {
    const month = db.prepare(`
        SELECT
            id,
            month,
            status
        FROM months
        WHERE id = ?
    `).get(monthId);

    if (!month) {
        return {
            success: false,
            reason: 'MONTH_NOT_FOUND'
        };
    }

    if (month.status === 'completed') {
        return {
            success: false,
            reason: 'MONTH_ALREADY_COMPLETED'
        };
    }

    const balance = getBalance(monthId);

    if (!balance) {
        return {
            success: false,
            reason: 'BALANCE_NOT_FOUND'
        };
    }

    db.prepare(`
        UPDATE months
        SET status = 'completed'
        WHERE id = ?
    `).run(monthId);

    return {
        success: true,
        monthId: month.id,
        month: month.month,
        status: 'completed',
        closingBalance:
            balance.availableBalance
    };
}


// ==========================================
// CREATE NEXT MONTH
// ==========================================

function createNextMonth(
    previousMonthId,
    nextMonth
) {
    const previousMonth = db.prepare(`
        SELECT
            id,
            month,
            status
        FROM months
        WHERE id = ?
    `).get(previousMonthId);

    if (!previousMonth) {
        return {
            success: false,
            reason: 'PREVIOUS_MONTH_NOT_FOUND'
        };
    }

    if (previousMonth.status !== 'completed') {
        return {
            success: false,
            reason: 'PREVIOUS_MONTH_NOT_COMPLETED'
        };
    }

    const expectedNextMonth =
        getNextCalendarMonth(
            previousMonth.month
        );

    if (nextMonth !== expectedNextMonth) {
        return {
            success: false,
            reason: 'INVALID_NEXT_MONTH',
            expectedMonth: expectedNextMonth
        };
    }

    const existingMonth = db.prepare(`
        SELECT id
        FROM months
        WHERE month = ?
    `).get(nextMonth);

    if (existingMonth) {
        return {
            success: false,
            reason: 'NEXT_MONTH_ALREADY_EXISTS'
        };
    }

    const previousBalance =
        getBalance(previousMonthId);

    if (!previousBalance) {
        return {
            success: false,
            reason: 'BALANCE_NOT_FOUND'
        };
    }

    try {
        const statement = db.prepare(`
            INSERT INTO months (
                month,
                opening_balance
            )
            VALUES (?, ?)
        `);

        const result = statement.run(
            nextMonth,
            previousBalance.availableBalance
        );

        return {
            success: true,
            month: {
                id: Number(
                    result.lastInsertRowid
                ),
                month: nextMonth,
                opening_balance:
                    previousBalance.availableBalance,
                status: 'active'
            }
        };

    } catch (error) {

        if (
            error.code ===
            'SQLITE_CONSTRAINT_UNIQUE'
        ) {
            return {
                success: false,
                reason:
                    'NEXT_MONTH_ALREADY_EXISTS'
            };
        }

        throw error;
    }
}


// ==========================================
// GET ACTIVE MONTH
// ==========================================

function getActiveMonth() {
    const month = db.prepare(`
        SELECT
            id,
            month,
            opening_balance,
            status
        FROM months
        WHERE status = 'active'
        ORDER BY month DESC
        LIMIT 1
    `).get();

    if (!month) {
        return null;
    }

    const [
        year,
        monthNumber
    ] = month.month.split('-').map(Number);

    const monthName =
        new Intl.DateTimeFormat(
            'en-IN',
            {
                month: 'long',
                year: 'numeric'
            }
        ).format(
            new Date(
                year,
                monthNumber - 1,
                1
            )
        );

    return {
        ...month,
        monthName
    };
}


// ==========================================
// EXPORT FUNCTIONS
// ==========================================

module.exports = {
    completeMonth,
    createNextMonth,
    getActiveMonth
};