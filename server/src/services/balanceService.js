const db = require('../database');

function getBalance(monthId) {
    const result = db.prepare(`
        SELECT
            m.id,
            m.month,
            m.opening_balance,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'income' THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS income,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'expense' THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS expenses,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'lent' THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS lent

        FROM months m

        LEFT JOIN transactions t
            ON t.month_id = m.id

        WHERE m.id = ?

        GROUP BY m.id
    `).get(monthId);

    if (!result) {
        return null;
    }

    const availableBalance =
        result.opening_balance +
        result.income -
        result.expenses -
        result.lent;

    return {
        monthId: result.id,
        month: result.month,
        openingBalance: result.opening_balance,
        income: result.income,
        expenses: result.expenses,
        lent: result.lent,
        availableBalance
    };
}

module.exports = {
    getBalance
};