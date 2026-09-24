const db = require('../database');

function getMonthHistory() {
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
            m.month DESC
    `).all();

    return months.map((month) => {

        const openingBalance =
            Number(month.opening_balance || 0);

        const income =
            Number(month.income || 0);

        const expenses =
            Number(month.expenses || 0);

        const lent =
            Number(month.lent || 0);

        const monthlySavings =
            income - expenses;

        const closingBalance =
            openingBalance +
            income -
            expenses -
            lent;

        return {
            id: month.id,

            month: month.month,

            openingBalance,

            income,

            expenses,

            lent,

            monthlySavings,

            closingBalance,

            status: month.status
        };
    });
}

module.exports = {
    getMonthHistory
};