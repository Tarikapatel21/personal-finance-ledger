const {
    createTransaction,
    getTransactionsByMonth,
    updateTransaction,
    deleteTransaction
} = require('../services/transactionService');

function createTransactionController(req, res) {
    try {
        const result = createTransaction(req.body);

        if (!result.success) {
            if (result.reason === 'MONTH_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Month not found.'
                });
            }

            if (result.reason === 'MONTH_COMPLETED') {
                return res.status(409).json({
                    message: 'Transactions cannot be added to a completed month.'
                });
            }
        }

        res.status(201).json({
            message: 'Transaction created successfully.',
            transaction: result.transaction
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to create transaction.'
        });
    }
}

function getTransactionsController(req, res) {
    const monthId = Number(req.query.month_id);

    if (!Number.isInteger(monthId) || monthId <= 0) {
        return res.status(400).json({
            message: 'month_id must be a positive integer.'
        });
    }

    try {
        const transactions = getTransactionsByMonth(monthId);

        res.status(200).json({
            transactions
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to get transactions.'
        });
    }
}

function updateTransactionController(req, res) {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        return res.status(400).json({
            message: 'Transaction ID must be a positive integer.'
        });
    }

    try {
        const result = updateTransaction(
            transactionId,
            req.body
        );

        if (!result.success) {
            if (result.reason === 'TRANSACTION_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Transaction not found.'
                });
            }

            if (result.reason === 'MONTH_COMPLETED') {
                return res.status(409).json({
                    message: 'Transactions cannot be edited in a completed month.'
                });
            }
        }

        res.status(200).json({
            message: 'Transaction updated successfully.',
            transaction: result.transaction
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to update transaction.'
        });
    }
}

function deleteTransactionController(req, res) {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId) || transactionId <= 0) {
        return res.status(400).json({
            message: 'Transaction ID must be a positive integer.'
        });
    }

    try {
        const result = deleteTransaction(transactionId);

        if (!result.success) {
            if (result.reason === 'TRANSACTION_NOT_FOUND') {
                return res.status(404).json({
                    message: 'Transaction not found.'
                });
            }

            if (result.reason === 'MONTH_COMPLETED') {
                return res.status(409).json({
                    message: 'Transactions cannot be deleted from a completed month.'
                });
            }
        }

        res.status(200).json({
            message: 'Transaction deleted successfully.'
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to delete transaction.'
        });
    }
}

module.exports = {
    createTransaction: createTransactionController,
    getTransactions: getTransactionsController,
    updateTransaction: updateTransactionController,
    deleteTransaction: deleteTransactionController
};