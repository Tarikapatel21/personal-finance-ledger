import { useEffect, useState } from 'react';

import {
    getMonthlyHistory
} from '../services/api';

function formatRupees(paise) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(Number(paise || 0) / 100);
}

function getMonthName(monthString) {
    if (!monthString) {
        return 'Unknown Month';
    }

    const [year, month] =
        monthString.split('-').map(Number);

    return new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric'
    }).format(
        new Date(year, month - 1, 1)
    );
}

function MonthlyHistoryPage({ onBack }) {
    const [months, setMonths] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadHistory() {
        try {
            setLoading(true);
            setError('');

            const data =
                await getMonthlyHistory();

            setMonths(data.months || []);

        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Failed to load monthly history.'
            );

        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <div className="page-container">

            {/* PAGE HEADER */}

            <div className="page-header">

                <div>

                    <button
                        type="button"
                        className="back-button"
                        onClick={onBack}
                    >
                        ← Back to Dashboard
                    </button>

                    <h1>
                        Monthly History
                    </h1>

                    <p>
                        View your previous and current
                        monthly financial records.
                    </p>

                </div>

            </div>


            {/* LOADING */}

            {loading && (

                <div className="empty-state">

                    <div className="empty-state-icon">
                        ⏳
                    </div>

                    <h2>
                        Loading monthly history...
                    </h2>

                    <p>
                        Please wait while we load
                        your financial records.
                    </p>

                </div>

            )}


            {/* ERROR */}

            {!loading && error && (

                <div className="empty-state">

                    <div className="empty-state-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to load history
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={loadHistory}
                    >
                        Try Again
                    </button>

                </div>

            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                months.length === 0 && (

                    <div className="empty-state">

                        <div className="empty-state-icon">
                            📅
                        </div>

                        <h2>
                            No monthly history yet
                        </h2>

                        <p>
                            Your monthly financial
                            records will appear here.
                        </p>

                    </div>

                )}


            {/* MONTH LIST */}

            {!loading &&
                !error &&
                months.length > 0 && (

                    <div className="history-list">

                        {months.map((month) => (

                            <div
                                className="history-card"
                                key={month.id}
                            >

                                {/* CARD HEADER */}

                                <div className="history-card-header">

                                    <div>

                                        <h2>
                                            {getMonthName(
                                                month.month
                                            )}
                                        </h2>

                                        <span
                                            className={
                                                `history-status history-status-${month.status}`
                                            }
                                        >
                                            {month.status ===
                                            'completed'
                                                ? 'Completed'
                                                : 'Active'}
                                        </span>

                                    </div>

                                    <span className="history-month-id">
                                        Month ID: {month.id}
                                    </span>

                                </div>


                                {/* FINANCIAL DETAILS */}

                                <div className="history-details">

                                    <div className="history-detail">

                                        <span>
                                            Opening Balance
                                        </span>

                                        <strong>
                                            {formatRupees(
                                                month.openingBalance
                                            )}
                                        </strong>

                                    </div>


                                    <div className="history-detail">

                                        <span>
                                            Income
                                        </span>

                                        <strong
                                            className="amount-positive"
                                        >
                                            +
                                            {formatRupees(
                                                month.income
                                            )}
                                        </strong>

                                    </div>


                                    <div className="history-detail">

                                        <span>
                                            Expenses
                                        </span>

                                        <strong
                                            className="amount-negative"
                                        >
                                            -
                                            {formatRupees(
                                                month.expenses
                                            )}
                                        </strong>

                                    </div>


                                    <div className="history-detail">

                                        <span>
                                            Money Lent
                                        </span>

                                        <strong
                                            className="amount-negative"
                                        >
                                            -
                                            {formatRupees(
                                                month.lent
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* SAVINGS + CLOSING BALANCE */}

                                <div className="history-bottom">

                                    <div>

                                        <span>
                                            Monthly Savings
                                        </span>

                                        <strong>
                                            {formatRupees(
                                                month.monthlySavings
                                            )}
                                        </strong>

                                        <small>
                                            Income minus expenses
                                        </small>

                                    </div>


                                    <div className="history-closing">

                                        <span>
                                            Closing Balance
                                        </span>

                                        <strong>
                                            {formatRupees(
                                                month.closingBalance
                                            )}
                                        </strong>

                                        <small>
                                            Balance carried forward
                                            when the month is closed
                                        </small>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

        </div>
    );
}

export default MonthlyHistoryPage;