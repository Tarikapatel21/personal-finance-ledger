import { useEffect, useState } from 'react';

import {
    createTransaction
} from '../services/api';

function TransactionForm({
    onClose,
    onTransactionAdded,
    monthId,
    month
}) {
    function getMonthDateRange(monthString) {
        if (!monthString) {
            return {
                firstDay: '',
                lastDay: '',
                defaultDate: ''
            };
        }

        const [year, monthNumber] =
            monthString.split('-').map(Number);

        const firstDate = new Date(
            year,
            monthNumber - 1,
            1
        );

        const lastDate = new Date(
            year,
            monthNumber,
            0
        );

        function formatDate(date) {
            const year = date.getFullYear();
            const month = String(
                date.getMonth() + 1
            ).padStart(2, '0');

            const day = String(
                date.getDate()
            ).padStart(2, '0');

            return `${year}-${month}-${day}`;
        }

        return {
            firstDay: formatDate(firstDate),
            lastDay: formatDate(lastDate),
            defaultDate: formatDate(firstDate)
        };
    }

    const dateRange = getMonthDateRange(month);

    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        category: '',
        description: '',
        transaction_date:
            dateRange.defaultDate,
        payment_method: 'UPI'
    });

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    /*
     * When the active month loads or changes,
     * automatically update the transaction date
     * to the first day of that month.
     */
    useEffect(() => {
        if (!dateRange.defaultDate) {
            return;
        }

        setFormData((previous) => ({
            ...previous,
            transaction_date:
                dateRange.defaultDate
        }));

        setError('');
    }, [month]);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');

        if (!monthId) {
            setError(
                'No active month is available.'
            );
            return;
        }

        if (!month) {
            setError(
                'Unable to determine the active month.'
            );
            return;
        }

        /*
         * Make sure the selected date belongs
         * to the active month.
         */
        if (
            formData.transaction_date <
                dateRange.firstDay ||
            formData.transaction_date >
                dateRange.lastDay
        ) {
            setError(
                'Transaction date must belong to the active month.'
            );
            return;
        }

        const amountInRupees =
            Number(formData.amount);

        if (
            !Number.isFinite(amountInRupees) ||
            amountInRupees <= 0
        ) {
            setError(
                'Please enter a valid amount.'
            );
            return;
        }

        if (!formData.category.trim()) {
            setError(
                'Please enter a category.'
            );
            return;
        }

        try {
            setSaving(true);

            const data =
                await createTransaction({
                    month_id: monthId,
                    transaction_date:
                        formData.transaction_date,
                    type: formData.type,
                    category:
                        formData.category.trim(),
                    description:
                        formData.description.trim(),
                    amount: Math.round(
                        amountInRupees * 100
                    ),
                    payment_method:
                        formData.payment_method
                });

            onTransactionAdded(
                data.transaction
            );

            onClose();
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                    'Unable to save transaction.'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay">
            <div className="transaction-modal">

                <div className="modal-header">
                    <div>
                        <h2>
                            Add Transaction
                        </h2>

                        <p>
                            Record your financial activity.
                        </p>
                    </div>

                    <button
                        className="close-button"
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label htmlFor="amount">
                            Amount (₹)
                        </label>

                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="500"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="type">
                            Transaction Type
                        </label>

                        <select
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
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
                        <label htmlFor="category">
                            Category
                        </label>

                        <input
                            id="category"
                            name="category"
                            type="text"
                            placeholder="Food, Travel, Salary..."
                            value={formData.category}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="description">
                            Description
                        </label>

                        <input
                            id="description"
                            name="description"
                            type="text"
                            placeholder="Lunch at college"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>


                    <div className="form-group">
                        <label htmlFor="transaction_date">
                            Date
                        </label>

                        <input
                            id="transaction_date"
                            name="transaction_date"
                            type="date"
                            value={
                                formData.transaction_date
                            }
                            min={
                                dateRange.firstDay
                            }
                            max={
                                dateRange.lastDay
                            }
                            onChange={handleChange}
                            required
                        />

                        {month && (
                            <small
                                style={{
                                    display: 'block',
                                    marginTop: '6px',
                                    color: '#6b7280'
                                }}
                            >
                                Date must be within the
                                active month.
                            </small>
                        )}
                    </div>


                    <div className="form-group">
                        <label htmlFor="payment_method">
                            Payment Method
                        </label>

                        <select
                            id="payment_method"
                            name="payment_method"
                            value={
                                formData.payment_method
                            }
                            onChange={handleChange}
                        >
                            <option value="UPI">
                                UPI
                            </option>

                            <option value="Cash">
                                Cash
                            </option>

                            <option value="Card">
                                Card
                            </option>

                            <option value="Bank Transfer">
                                Bank Transfer
                            </option>

                            <option value="Other">
                                Other
                            </option>
                        </select>
                    </div>


                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}


                    <div className="modal-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                saving ||
                                !monthId
                            }
                        >
                            {saving
                                ? 'Saving...'
                                : 'Save Transaction'}
                        </button>

                    </div>

                </form>
            </div>
        </div>
    );
}

export default TransactionForm;
