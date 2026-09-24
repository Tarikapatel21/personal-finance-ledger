import { useEffect, useMemo, useState } from 'react';

import {
    getTransactions,
    updateTransaction,
    deleteTransaction
} from '../services/api';


function formatRupees(paise) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Number(paise || 0) / 100);
}


function formatDate(dateString) {
    if (!dateString) return '';

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(new Date(`${dateString}T00:00:00`));
}


function getMonthName(monthString) {
    if (!monthString) return 'Current Month';

    const [year, monthNumber] =
        monthString.split('-').map(Number);

    return new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric'
    }).format(
        new Date(
            year,
            monthNumber - 1,
            1
        )
    );
}


function getTransactionType(type) {
    if (type === 'income') return 'Income';
    if (type === 'lent') return 'Money Lent';

    return 'Expense';
}


function getTransactionIcon(type) {
    if (type === 'income') return '↗';
    if (type === 'lent') return '↔';

    return '↘';
}


function TransactionsPage({
    onBack,
    onAddTransaction,
    monthId,
    month
}) {
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');

    const [editingTransaction, setEditingTransaction] =
        useState(null);

    const [deletingTransaction, setDeletingTransaction] =
        useState(null);

    const [saving, setSaving] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [actionError, setActionError] = useState('');

    const [editForm, setEditForm] = useState({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        transaction_date: '',
        payment_method: 'UPI'
    });


    async function loadTransactions() {
        if (!monthId) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const data = await getTransactions(monthId);

            setTransactions(data.transactions || []);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Unable to load transactions.'
            );
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        if (monthId) {
            loadTransactions();
        }
    }, [monthId]);


    const filteredTransactions = useMemo(() => {
        const searchText = search
            .trim()
            .toLowerCase();

        const result = transactions.filter(
            (transaction) => {
                const matchesFilter =
                    filter === 'all' ||
                    transaction.type === filter;

                const searchableText = [
                    transaction.description,
                    transaction.category,
                    transaction.payment_method
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const matchesSearch =
                    !searchText ||
                    searchableText.includes(searchText);

                return (
                    matchesFilter &&
                    matchesSearch
                );
            }
        );

        return result.sort((a, b) => {
            const dateA = new Date(
                `${a.transaction_date}T00:00:00`
            );

            const dateB = new Date(
                `${b.transaction_date}T00:00:00`
            );

            if (sortOrder === 'oldest') {
                return dateA - dateB;
            }

            return dateB - dateA;
        });
    }, [
        transactions,
        search,
        filter,
        sortOrder
    ]);


    const totals = useMemo(() => {
        return transactions.reduce(
            (result, transaction) => {
                if (transaction.type === 'income') {
                    result.income += Number(
                        transaction.amount
                    );
                }

                if (transaction.type === 'expense') {
                    result.expenses += Number(
                        transaction.amount
                    );
                }

                if (transaction.type === 'lent') {
                    result.lent += Number(
                        transaction.amount
                    );
                }

                return result;
            },
            {
                income: 0,
                expenses: 0,
                lent: 0
            }
        );
    }, [transactions]);


    const netChange =
        totals.income -
        totals.expenses -
        totals.lent;


    function openEdit(transaction) {
        setActionError('');

        setEditingTransaction(transaction);

        setEditForm({
            amount:
                Number(transaction.amount || 0) / 100,

            type: transaction.type,

            category:
                transaction.category || '',

            description:
                transaction.description || '',

            transaction_date:
                transaction.transaction_date || '',

            payment_method:
                transaction.payment_method || 'UPI'
        });
    }


    function closeEdit() {
        if (saving) return;

        setEditingTransaction(null);
        setActionError('');
    }


    function handleEditChange(event) {
        const {
            name,
            value
        } = event.target;

        setEditForm((previous) => ({
            ...previous,
            [name]: value
        }));
    }


    async function handleUpdate(event) {
        event.preventDefault();

        setActionError('');

        const amountInRupees =
            Number(editForm.amount);

        if (
            !Number.isFinite(amountInRupees) ||
            amountInRupees <= 0
        ) {
            setActionError(
                'Please enter a valid amount.'
            );

            return;
        }

        if (!editForm.category.trim()) {
            setActionError(
                'Please enter a category.'
            );

            return;
        }

        if (!editForm.transaction_date) {
            setActionError(
                'Please select a date.'
            );

            return;
        }

        try {
            setSaving(true);

            const amountInPaise =
                Math.round(
                    amountInRupees * 100
                );

            await updateTransaction(
                editingTransaction.id,
                {
                    month_id:
                        editingTransaction.month_id,

                    transaction_date:
                        editForm.transaction_date,

                    type:
                        editForm.type,

                    category:
                        editForm.category.trim(),

                    description:
                        editForm.description.trim(),

                    amount:
                        amountInPaise,

                    payment_method:
                        editForm.payment_method
                }
            );

            setEditingTransaction(null);

            await loadTransactions();
        } catch (err) {
            console.error(err);

            setActionError(
                err.message ||
                'Unable to update transaction.'
            );
        } finally {
            setSaving(false);
        }
    }


    function askDelete(transaction) {
        setActionError('');
        setDeletingTransaction(transaction);
    }


    function closeDelete() {
        if (deleteLoading) return;

        setDeletingTransaction(null);
        setActionError('');
    }


    async function handleDelete() {
        if (!deletingTransaction) return;

        try {
            setDeleteLoading(true);
            setActionError('');

            await deleteTransaction(
                deletingTransaction.id
            );

            setTransactions((previous) =>
                previous.filter(
                    (transaction) =>
                        transaction.id !==
                        deletingTransaction.id
                )
            );

            setDeletingTransaction(null);
        } catch (err) {
            console.error(err);

            setActionError(
                err.message ||
                'Unable to delete transaction.'
            );
        } finally {
            setDeleteLoading(false);
        }
    }


    return (
        <div className="transactions-page">

            {/* HEADER */}

            <header className="transactions-header">

                <div className="transactions-title">

                    <button
                        className="back-button"
                        onClick={onBack}
                        type="button"
                    >
                        ←
                    </button>

                    <div>

                        <p className="eyebrow">
                            FINANCIAL ACTIVITY
                        </p>

                        <h1>
                            Transactions
                        </h1>

                        <p>
                            Financial activity for the current month.
                        </p>

                        {month && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '8px',
                                    fontSize: '13px',
                                    color: '#6b7280'
                                }}
                            >
                                <strong
                                    style={{
                                        color: '#17233f'
                                    }}
                                >
                                    {month.monthName ||
                                        getMonthName(month.month)}
                                </strong>

                                <span>•</span>

                                <span>
                                    Month ID: {month.id}
                                </span>
                            </div>
                        )}

                    </div>

                </div>


                <button
                    className="primary-button"
                    onClick={onAddTransaction}
                    type="button"
                >
                    + Add Transaction
                </button>

            </header>


            {/* SUMMARY */}

            <section className="transaction-summary">

                <div className="transaction-stat">

                    <span className="stat-icon income-icon">
                        ↗
                    </span>

                    <div>

                        <span>
                            Total Income
                        </span>

                        <strong>
                            {formatRupees(
                                totals.income
                            )}
                        </strong>

                    </div>

                </div>


                <div className="transaction-stat">

                    <span className="stat-icon expense-icon">
                        ↘
                    </span>

                    <div>

                        <span>
                            Total Expenses
                        </span>

                        <strong>
                            {formatRupees(
                                totals.expenses
                            )}
                        </strong>

                    </div>

                </div>


                <div className="transaction-stat">

                    <span className="stat-icon lent-icon">
                        ↔
                    </span>

                    <div>

                        <span>
                            Money Lent
                        </span>

                        <strong>
                            {formatRupees(
                                totals.lent
                            )}
                        </strong>

                    </div>

                </div>


                <div className="transaction-stat">

                    <span className="stat-icon net-icon">
                        ₹
                    </span>

                    <div>

                        <span>
                            Net Change
                        </span>

                        <strong>
                            {formatRupees(
                                netChange
                            )}
                        </strong>

                    </div>

                </div>

            </section>


            {/* CONTROLS */}

            <section className="transaction-controls">

                <div className="search-box">

                    <span>
                        ⌕
                    </span>

                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                    />

                </div>


                <div className="filter-group">

                    <button
                        type="button"
                        className={
                            filter === 'all'
                                ? 'filter-button active'
                                : 'filter-button'
                        }
                        onClick={() =>
                            setFilter('all')
                        }
                    >
                        All
                    </button>


                    <button
                        type="button"
                        className={
                            filter === 'income'
                                ? 'filter-button active'
                                : 'filter-button'
                        }
                        onClick={() =>
                            setFilter('income')
                        }
                    >
                        Income
                    </button>


                    <button
                        type="button"
                        className={
                            filter === 'expense'
                                ? 'filter-button active'
                                : 'filter-button'
                        }
                        onClick={() =>
                            setFilter('expense')
                        }
                    >
                        Expenses
                    </button>


                    <button
                        type="button"
                        className={
                            filter === 'lent'
                                ? 'filter-button active'
                                : 'filter-button'
                        }
                        onClick={() =>
                            setFilter('lent')
                        }
                    >
                        Lent
                    </button>

                </div>


                <select
                    className="sort-select"
                    value={sortOrder}
                    onChange={(event) =>
                        setSortOrder(
                            event.target.value
                        )
                    }
                >

                    <option value="newest">
                        Newest first
                    </option>

                    <option value="oldest">
                        Oldest first
                    </option>

                </select>

            </section>


            {/* TRANSACTION TABLE */}

            <section className="transactions-card">

                <div className="transactions-card-header">

                    <div>

                        <h2>
                            All Transactions
                        </h2>

                        <p>
                            {filteredTransactions.length}{' '}
                            transaction
                            {filteredTransactions.length !== 1
                                ? 's'
                                : ''}{' '}
                            shown
                        </p>

                    </div>

                </div>


                {loading && (

                    <div className="transactions-status">

                        <div className="loading-spinner" />

                        Loading transactions...

                    </div>

                )}


                {error && !loading && (

                    <div className="transactions-error">
                        {error}
                    </div>

                )}


                {!loading &&
                    !error &&
                    filteredTransactions.length === 0 && (

                        <div className="transactions-empty">

                            <div className="empty-large-icon">
                                ₹
                            </div>

                            <h3>
                                No transactions found
                            </h3>

                            <p>
                                Try changing your search or
                                filter, or add a new transaction.
                            </p>

                            <button
                                className="primary-button"
                                onClick={onAddTransaction}
                                type="button"
                            >
                                + Add Transaction
                            </button>

                        </div>

                    )}


                {!loading &&
                    !error &&
                    filteredTransactions.length > 0 && (

                        <div className="transaction-table">

                            <div className="transaction-table-head">

                                <span>
                                    Transaction
                                </span>

                                <span>
                                    Type
                                </span>

                                <span>
                                    Payment
                                </span>

                                <span>
                                    Date
                                </span>

                                <span className="amount-column">
                                    Amount
                                </span>

                                <span>
                                    Actions
                                </span>

                            </div>


                            {filteredTransactions.map(
                                (transaction) => (

                                    <div
                                        className="transaction-table-row"
                                        key={transaction.id}
                                    >

                                        <div className="transaction-main">

                                            <div
                                                className={
                                                    `transaction-type-icon ${transaction.type}`
                                                }
                                            >
                                                {getTransactionIcon(
                                                    transaction.type
                                                )}
                                            </div>

                                            <div>

                                                <strong>
                                                    {
                                                        transaction.description ||
                                                        transaction.category
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        transaction.category
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        <div>

                                            <span
                                                className={
                                                    `type-badge ${transaction.type}`
                                                }
                                            >
                                                {getTransactionType(
                                                    transaction.type
                                                )}
                                            </span>

                                        </div>


                                        <div className="payment-method">
                                            {
                                                transaction.payment_method
                                            }
                                        </div>


                                        <div className="transaction-date">
                                            {formatDate(
                                                transaction.transaction_date
                                            )}
                                        </div>


                                        <div
                                            className={
                                                `transaction-amount ${transaction.type}`
                                            }
                                        >

                                            {transaction.type === 'income'
                                                ? '+'
                                                : '-'}

                                            {formatRupees(
                                                transaction.amount
                                            )}

                                        </div>


                                        <div className="transaction-actions">

                                            <button
                                                type="button"
                                                className="edit-action"
                                                onClick={() =>
                                                    openEdit(
                                                        transaction
                                                    )
                                                }
                                                title="Edit transaction"
                                            >
                                                ✎
                                            </button>


                                            <button
                                                type="button"
                                                className="delete-action"
                                                onClick={() =>
                                                    askDelete(
                                                        transaction
                                                    )
                                                }
                                                title="Delete transaction"
                                            >
                                                🗑
                                            </button>

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

            </section>


            {/* EDIT MODAL */}

            {editingTransaction && (

                <div className="modal-overlay">

                    <div className="transaction-modal">

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Edit Transaction
                                </h2>

                                <p>
                                    Update the details of this transaction.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-button"
                                onClick={closeEdit}
                            >
                                ×
                            </button>

                        </div>


                        <form onSubmit={handleUpdate}>

                            <div className="form-group">

                                <label>
                                    Amount (₹)
                                </label>

                                <input
                                    type="number"
                                    name="amount"
                                    min="0.01"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={handleEditChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Transaction Type
                                </label>

                                <select
                                    name="type"
                                    value={editForm.type}
                                    onChange={handleEditChange}
                                >

                                    <option value="expense">
                                        Paid / Expense
                                    </option>

                                    <option value="income">
                                        Received / Income
                                    </option>

                                    <option value="lent">
                                        Money Lent
                                    </option>

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Category
                                </label>

                                <input
                                    type="text"
                                    name="category"
                                    value={editForm.category}
                                    onChange={handleEditChange}
                                    placeholder="Food, Salary, Medical..."
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <input
                                    type="text"
                                    name="description"
                                    value={editForm.description}
                                    onChange={handleEditChange}
                                    placeholder="What was this transaction for?"
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Date
                                </label>

                                <input
                                    type="date"
                                    name="transaction_date"
                                    value={editForm.transaction_date}
                                    onChange={handleEditChange}
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Payment Method
                                </label>

                                <select
                                    name="payment_method"
                                    value={editForm.payment_method}
                                    onChange={handleEditChange}
                                >

                                    <option value="UPI">
                                        UPI
                                    </option>

                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Bank Transfer">
                                        Bank Transfer
                                    </option>

                                    <option value="Card">
                                        Card
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>

                            </div>


                            {actionError && (

                                <div className="form-error">
                                    {actionError}
                                </div>

                            )}


                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={closeEdit}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* DELETE CONFIRMATION */}

            {deletingTransaction && (

                <div className="modal-overlay">

                    <div className="transaction-modal delete-modal">

                        <div className="modal-header">

                            <div>

                                <h2>
                                    Delete Transaction?
                                </h2>

                                <p>
                                    This action cannot be undone.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="close-button"
                                onClick={closeDelete}
                            >
                                ×
                            </button>

                        </div>


                        <div className="delete-preview">

                            <strong>
                                {
                                    deletingTransaction.description ||
                                    deletingTransaction.category
                                }
                            </strong>

                            <span>
                                {getTransactionType(
                                    deletingTransaction.type
                                )}

                                {' • '}

                                {formatDate(
                                    deletingTransaction.transaction_date
                                )}
                            </span>

                            <b>

                                {deletingTransaction.type === 'income'
                                    ? '+'
                                    : '-'}

                                {formatRupees(
                                    deletingTransaction.amount
                                )}

                            </b>

                        </div>


                        {actionError && (

                            <div className="form-error">
                                {actionError}
                            </div>

                        )}


                        <div className="modal-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={closeDelete}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="delete-confirm-button"
                                onClick={handleDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading
                                    ? 'Deleting...'
                                    : 'Delete Transaction'}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


export default TransactionsPage;