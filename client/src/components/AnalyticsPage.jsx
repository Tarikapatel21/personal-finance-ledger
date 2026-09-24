import { useEffect, useState } from 'react';

import {
    getAnalytics
} from '../services/api';


// ==========================================
// FORMAT RUPEES
// ==========================================

function formatRupees(paise) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(
        Number(paise || 0) / 100
    );
}


// ==========================================
// FORMAT MONTH
// ==========================================

function formatMonth(monthString) {
    if (!monthString) {
        return 'Unknown';
    }

    const [
        year,
        month
    ] = monthString
        .split('-')
        .map(Number);

    return new Intl.DateTimeFormat(
        'en-IN',
        {
            month: 'short',
            year: 'numeric'
        }
    ).format(
        new Date(
            year,
            month - 1,
            1
        )
    );
}


// ==========================================
// ANALYTICS PAGE
// ==========================================

function AnalyticsPage({ onBack }) {

    const [analytics, setAnalytics] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');


    // ======================================
    // LOAD ANALYTICS
    // ======================================

    async function loadAnalytics() {

        try {

            setLoading(true);
            setError('');

            const data =
                await getAnalytics();

            setAnalytics(
                data.analytics
            );

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                'Failed to load analytics.'
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {
        loadAnalytics();
    }, []);


    // ======================================
    // LOADING
    // ======================================

    if (loading) {

        return (
            <div className="page-container">

                <div className="empty-state">

                    <div className="empty-state-icon">
                        ⏳
                    </div>

                    <h2>
                        Loading analytics...
                    </h2>

                    <p>
                        Please wait while we
                        calculate your financial
                        analytics.
                    </p>

                </div>

            </div>
        );
    }


    // ======================================
    // ERROR
    // ======================================

    if (error) {

        return (
            <div className="page-container">

                <div className="empty-state">

                    <div className="empty-state-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to load analytics
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={loadAnalytics}
                    >
                        Try Again
                    </button>

                </div>

            </div>
        );
    }


    // ======================================
    // SAFETY DEFAULTS
    // ======================================

    const summary =
        analytics?.summary || {};

    const categories =
        analytics?.expensesByCategory || [];

    const monthlyTrend =
        analytics?.monthlyTrend || [];

    const paymentMethods =
        analytics?.expensesByPaymentMethod || [];


    // ======================================
    // CATEGORY MAX
    // ======================================

    const maxCategoryAmount =
        Math.max(
            ...categories.map(
                (item) =>
                    Number(item.amount || 0)
            ),
            0
        );


    // ======================================
    // PAYMENT METHOD MAX
    // ======================================

    const maxPaymentAmount =
        Math.max(
            ...paymentMethods.map(
                (item) =>
                    Number(item.amount || 0)
            ),
            0
        );


    return (
        <div className="page-container">

            {/* ==================================
                HEADER
            ================================== */}

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
                        Analytics
                    </h1>

                    <p>
                        Understand your financial
                        activity and spending patterns.
                    </p>

                </div>

            </div>


            {/* ==================================
                SUMMARY
            ================================== */}

            <div className="analytics-summary-grid">

                <div className="analytics-summary-card">

                    <span>
                        Total Income
                    </span>

                    <strong>
                        {formatRupees(
                            summary.income
                        )}
                    </strong>

                    <small>
                        Money received
                    </small>

                </div>


                <div className="analytics-summary-card">

                    <span>
                        Total Expenses
                    </span>

                    <strong>
                        {formatRupees(
                            summary.expenses
                        )}
                    </strong>

                    <small>
                        Money spent
                    </small>

                </div>


                <div className="analytics-summary-card">

                    <span>
                        Money Lent
                    </span>

                    <strong>
                        {formatRupees(
                            summary.lent
                        )}
                    </strong>

                    <small>
                        Money given to others
                    </small>

                </div>


                <div className="analytics-summary-card">

                    <span>
                        Monthly Savings
                    </span>

                    <strong>
                        {formatRupees(
                            summary.monthlySavings
                        )}
                    </strong>

                    <small>
                        Income minus expenses
                    </small>

                </div>

            </div>


            {/* ==================================
                CATEGORY + PAYMENT METHOD
            ================================== */}

            <div className="analytics-two-column">


                {/* CATEGORY */}

                <div className="analytics-card">

                    <div className="analytics-card-header">

                        <div>

                            <h2>
                                Expenses by Category
                            </h2>

                            <p>
                                Where your spending
                                is going.
                            </p>

                        </div>

                    </div>


                    {categories.length === 0 ? (

                        <div className="analytics-empty">
                            No expense data available.
                        </div>

                    ) : (

                        <div className="analytics-bars">

                            {categories.map(
                                (item) => {

                                    const amount =
                                        Number(
                                            item.amount || 0
                                        );

                                    const width =
                                        maxCategoryAmount === 0
                                            ? 0
                                            : (
                                                amount /
                                                maxCategoryAmount
                                            ) * 100;

                                    return (

                                        <div
                                            className="analytics-bar-item"
                                            key={
                                                item.category
                                            }
                                        >

                                            <div className="analytics-bar-label">

                                                <span>
                                                    {item.category}
                                                </span>

                                                <strong>
                                                    {formatRupees(
                                                        amount
                                                    )}
                                                </strong>

                                            </div>


                                            <div className="analytics-bar-track">

                                                <div
                                                    className="analytics-bar-fill"
                                                    style={{
                                                        width:
                                                            `${width}%`
                                                    }}
                                                />

                                            </div>


                                            <small>
                                                {item.percentage}%
                                                {' · '}
                                                {item.transactionCount}
                                                {' '}
                                                transaction
                                                {item.transactionCount !== 1
                                                    ? 's'
                                                    : ''}
                                            </small>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>


                {/* PAYMENT METHOD */}

                <div className="analytics-card">

                    <div className="analytics-card-header">

                        <div>

                            <h2>
                                Expenses by Payment Method
                            </h2>

                            <p>
                                How your expenses
                                were paid.
                            </p>

                        </div>

                    </div>


                    {paymentMethods.length === 0 ? (

                        <div className="analytics-empty">
                            No payment data available.
                        </div>

                    ) : (

                        <div className="analytics-bars">

                            {paymentMethods.map(
                                (item) => {

                                    const amount =
                                        Number(
                                            item.amount || 0
                                        );

                                    const width =
                                        maxPaymentAmount === 0
                                            ? 0
                                            : (
                                                amount /
                                                maxPaymentAmount
                                            ) * 100;

                                    return (

                                        <div
                                            className="analytics-bar-item"
                                            key={
                                                item.paymentMethod
                                            }
                                        >

                                            <div className="analytics-bar-label">

                                                <span>
                                                    {item.paymentMethod}
                                                </span>

                                                <strong>
                                                    {formatRupees(
                                                        amount
                                                    )}
                                                </strong>

                                            </div>


                                            <div className="analytics-bar-track">

                                                <div
                                                    className="analytics-bar-fill"
                                                    style={{
                                                        width:
                                                            `${width}%`
                                                    }}
                                                />

                                            </div>


                                            <small>
                                                {
                                                    item.transactionCount
                                                }
                                                {' '}
                                                transaction
                                                {item.transactionCount !== 1
                                                    ? 's'
                                                    : ''}
                                            </small>

                                        </div>
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>

            </div>


            {/* ==================================
                MONTHLY TREND
            ================================== */}

            <div className="analytics-card analytics-trend-card">

                <div className="analytics-card-header">

                    <div>

                        <h2>
                            Monthly Financial Trend
                        </h2>

                        <p>
                            Compare income,
                            expenses, lending,
                            and savings across
                            your recorded months.
                        </p>

                    </div>

                </div>


                {monthlyTrend.length === 0 ? (

                    <div className="analytics-empty">
                        No monthly data available.
                    </div>

                ) : (

                    <div className="monthly-trend-table">

                        <div className="monthly-trend-header">

                            <span>
                                Month
                            </span>

                            <span>
                                Income
                            </span>

                            <span>
                                Expenses
                            </span>

                            <span>
                                Lent
                            </span>

                            <span>
                                Savings
                            </span>

                            <span>
                                Closing Balance
                            </span>

                        </div>


                        {monthlyTrend.map(
                            (item) => (

                                <div
                                    className="monthly-trend-row"
                                    key={item.monthId}
                                >

                                    <strong>
                                        {formatMonth(
                                            item.month
                                        )}
                                    </strong>

                                    <span className="amount-positive">
                                        +
                                        {formatRupees(
                                            item.income
                                        )}
                                    </span>

                                    <span className="amount-negative">
                                        -
                                        {formatRupees(
                                            item.expenses
                                        )}
                                    </span>

                                    <span className="amount-negative">
                                        -
                                        {formatRupees(
                                            item.lent
                                        )}
                                    </span>

                                    <span>
                                        {formatRupees(
                                            item.monthlySavings
                                        )}
                                    </span>

                                    <strong>
                                        {formatRupees(
                                            item.closingBalance
                                        )}
                                    </strong>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>


            {/* ==================================
                INFORMATION
            ================================== */}

            <div className="analytics-note">

                <strong>
                    How these numbers are calculated
                </strong>

                <p>
                    Monthly savings is calculated as
                    income minus expenses. Money lent
                    is shown separately because lending
                    is not treated as spending.
                </p>

            </div>

        </div>
    );
}

export default AnalyticsPage;