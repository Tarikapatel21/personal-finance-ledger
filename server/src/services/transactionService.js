const db = require('../database');

function createTransaction(data) {
    const {
        month_id,
        transaction_date,
        type,
        category,
        description,
        amount,
        payment_method
    } = data;

    const month = db.prepare(`
        SELECT id, status
        FROM months
        WHERE id = ?
    `).get(month_id);

    if (!month) {
        return {
            success: false,
            reason: 'MONTH_NOT_FOUND'
        };
    }

    if (month.status === 'completed') {
        return {
            success: false,
            reason: 'MONTH_COMPLETED'
        };
    }

    const statement = db.prepare(`
        INSERT INTO transactions (
            month_id,
            transaction_date,
            type,
            category,
            description,
            amount,
            payment_method
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = statement.run(
        month_id,
        transaction_date,
        type,
        category,
        description || null,
        amount,
        payment_method
    );

    return {
        success: true,
        transaction: {
            id: Number(result.lastInsertRowid),
            month_id,
            transaction_date,
            type,
            category,
            description: description || null,
            amount,
            payment_method
        }
    };
}

function getTransactionsByMonth(monthId) {
    const statement = db.prepare(`
        SELECT
            id,
            month_id,
            transaction_date,
            type,
            category,
            description,
            amount,
            payment_method,
            created_at,
            updated_at
        FROM transactions
        WHERE month_id = ?
        ORDER BY transaction_date DESC, id DESC
    `);

    return statement.all(monthId);
}

function updateTransaction(transactionId, data) {
    const existingTransaction = db.prepare(`
        SELECT
            id,
            month_id
        FROM transactions
        WHERE id = ?
    `).get(transactionId);

    if (!existingTransaction) {
        return {
            success: false,
            reason: 'TRANSACTION_NOT_FOUND'
        };
    }

    const month = db.prepare(`
        SELECT id, status
        FROM months
        WHERE id = ?
    `).get(existingTransaction.month_id);

    if (month.status === 'completed') {
        return {
            success: false,
            reason: 'MONTH_COMPLETED'
        };
    }

    const {
        transaction_date,
        type,
        category,
        description,
        amount,
        payment_method
    } = data;

    const statement = db.prepare(`
        UPDATE transactions
        SET
            transaction_date = ?,
            type = ?,
            category = ?,
            description = ?,
            amount = ?,
            payment_method = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    statement.run(
        transaction_date,
        type,
        category,
        description || null,
        amount,
        payment_method,
        transactionId
    );

    const transaction = db.prepare(`
        SELECT
            id,
            month_id,
            transaction_date,
            type,
            category,
            description,
            amount,
            payment_method,
            created_at,
            updated_at
        FROM transactions
        WHERE id = ?
    `).get(transactionId);

    return {
        success: true,
        transaction
    };
}

function deleteTransaction(transactionId) {
    const existingTransaction = db.prepare(`
        SELECT
            id,
            month_id
        FROM transactions
        WHERE id = ?
    `).get(transactionId);

    if (!existingTransaction) {
        return {
            success: false,
            reason: 'TRANSACTION_NOT_FOUND'
        };
    }

    const month = db.prepare(`
        SELECT id, status
        FROM months
        WHERE id = ?
    `).get(existingTransaction.month_id);

    if (month.status === 'completed') {
        return {
            success: false,
            reason: 'MONTH_COMPLETED'
        };
    }

    db.prepare(`
        DELETE FROM transactions
        WHERE id = ?
    `).run(transactionId);

    return {
        success: true
    };
}

module.exports = {
    createTransaction,
    getTransactionsByMonth,
    updateTransaction,
    deleteTransaction
};