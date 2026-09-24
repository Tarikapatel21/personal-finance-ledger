const express = require('express');

const {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

const validateTransaction = require('../middleware/transactionValidator');

const router = express.Router();

router.post('/', validateTransaction, createTransaction);

router.get('/', getTransactions);

router.put('/:id', validateTransaction, updateTransaction);

router.delete('/:id', deleteTransaction);

module.exports = router;