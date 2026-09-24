const db = require('../database');


// ==========================================
// OVERALL FINANCIAL SUMMARY
// ==========================================

function getAnalyticsSummary() {
    const result = db.prepare(`
        SELECT

            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'income'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS income,

            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'expense'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS expenses,

            COALESCE(
                SUM(
                    CASE
                        WHEN type = 'lent'
                        THEN amount
                        ELSE 0
                    END
                ),
                0
            ) AS lent,

            COUNT(*) AS transaction_count

        FROM transactions
    `).get();

    const income =
        Number(result.income || 0);

    const expenses =
        Number(result.expenses || 0);

    const lent =
        Number(result.lent || 0);

    const monthlySavings =
        income - expenses;

    return {
        income,
        expenses,
        lent,
        monthlySavings,
        transactionCount:
            Number(result.transaction_count || 0)
    };
}


// ==========================================
// EXPENSES BY CATEGORY
// ==========================================

function getExpensesByCategory() {
    const categories = db.prepare(`
        SELECT
            category,
            SUM(amount) AS amount,
            COUNT(*) AS transaction_count

        FROM transactions

        WHERE type = 'expense'

        GROUP BY category

        ORDER BY amount DESC
    `).all();

    const totalExpenses =
        categories.reduce(
            (total, item) =>
                total + Number(item.amount || 0),
            0
        );

    return categories.map((item) => {

        const amount =
            Number(item.amount || 0);

        const percentage =
            totalExpenses === 0
                ? 0
                : Number(
                    (
                        (amount / totalExpenses) *
                        100
                    ).toFixed(2)
                );

        return {
            category: item.category,
            amount,
            percentage,
            transactionCount:
                Number(
                    item.transaction_count || 0
                )
        };
    });
}


// ==========================================
// MONTHLY TREND
// ==========================================

function getMonthlyTrend() {
    const months = db.prepare(`
        SELECT

            m.id,
            m.month,
            m.opening_balance,
            m.status,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'income'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS income,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'expense'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS expenses,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'lent'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS lent

        FROM months m

        LEFT JOIN transactions t
            ON t.month_id = m.id

        GROUP BY
            m.id,
            m.month,
            m.opening_balance,
            m.status

        ORDER BY
            m.month ASC
    `).all();

    return months.map((month) => {

        const income =
            Number(month.income || 0);

        const expenses =
            Number(month.expenses || 0);

        const lent =
            Number(month.lent || 0);

        const monthlySavings =
            income - expenses;

        const closingBalance =
            Number(
                month.opening_balance || 0
            ) +
            income -
            expenses -
            lent;

        return {
            monthId: month.id,
            month: month.month,

            openingBalance:
                Number(
                    month.opening_balance || 0
                ),

            income,
            expenses,
            lent,
            monthlySavings,
            closingBalance,

            status: month.status
        };
    });
}


// ==========================================
// EXPENSES BY PAYMENT METHOD
// ==========================================

function getExpensesByPaymentMethod() {
    const methods = db.prepare(`
        SELECT
            payment_method,
            SUM(amount) AS amount,
            COUNT(*) AS transaction_count

        FROM transactions

        WHERE type = 'expense'

        GROUP BY payment_method

        ORDER BY amount DESC
    `).all();

    return methods.map((item) => ({
        paymentMethod:
            item.payment_method,

        amount:
            Number(item.amount || 0),

        transactionCount:
            Number(
                item.transaction_count || 0
            )
    }));
}


// ==========================================
// COMPLETE ANALYTICS
// ==========================================

function getAnalytics() {
    return {
        summary:
            getAnalyticsSummary(),

        expensesByCategory:
            getExpensesByCategory(),

        monthlyTrend:
            getMonthlyTrend(),

        expensesByPaymentMethod:
            getExpensesByPaymentMethod()
    };
}


module.exports = {
    getAnalytics
};