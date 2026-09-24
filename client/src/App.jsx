import { useEffect, useState } from 'react';

import './App.css';

import TransactionForm from './components/TransactionForm';
import GoalForm from './components/GoalForm';
import TransactionsPage from './components/TransactionsPage';
import SavingsGoalsPage from './components/SavingsGoalsPage';
import MonthlyHistoryPage from './components/MonthlyHistoryPage';
import AnalyticsPage from './components/AnalyticsPage';

import {
    getActiveMonth,
    getMonthBalance,
    getMonthSummary,
    getTransactions,
    getGoals,
    completeMonth,
    createNextMonth,
    getExcelExportUrl
} from './services/api';


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

    return new Intl.DateTimeFormat('en-IN', {
        month: 'long',
        year: 'numeric'
    }).format(
        new Date(`${monthString}-01T00:00:00`)
    );
}


function getNextMonth(monthString) {
    const [year, month] =
        monthString.split('-').map(Number);

    const date = new Date(
        year,
        month - 1,
        1
    );

    date.setMonth(
        date.getMonth() + 1
    );

    const nextYear =
        date.getFullYear();

    const nextMonth =
        String(
            date.getMonth() + 1
        ).padStart(2, '0');

    return `${nextYear}-${nextMonth}`;
}


function App() {
    const [page, setPage] =
        useState('dashboard');

    const [activeMonth, setActiveMonth] =
        useState(null);

    const [balance, setBalance] =
        useState(null);

    const [summary, setSummary] =
        useState(null);

    const [transactions, setTransactions] =
        useState([]);

    const [goals, setGoals] =
        useState([]);

    const [showTransactionForm, setShowTransactionForm] =
        useState(false);

    const [showGoalForm, setShowGoalForm] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [closingMonth, setClosingMonth] =
        useState(false);

    const [monthActionError, setMonthActionError] =
        useState('');


    async function loadDashboard() {
        try {
            setLoading(true);
            setError('');

            const activeMonthData =
                await getActiveMonth();

            const month =
                activeMonthData.month;

            setActiveMonth(month);

            const [
                balanceData,
                summaryData,
                transactionData,
                goalData
            ] = await Promise.all([
                getMonthBalance(month.id),
                getMonthSummary(month.id),
                getTransactions(month.id),
                getGoals()
            ]);

            setBalance(
                balanceData.balance
            );

            setSummary(
                summaryData.summary
            );

            setTransactions(
                transactionData.transactions || []
            );

            setGoals(
                goalData.goals || []
            );

        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Unable to load dashboard data.'
            );

        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        loadDashboard();
    }, []);


    const monthlySavings =
        summary
            ? summary.income - summary.expenses
            : 0;


    async function handleCloseMonth() {
        if (!activeMonth) {
            return;
        }

        const monthName =
            getMonthName(
                activeMonth.month
            );

        const closingBalance =
            balance?.availableBalance || 0;

        const confirmed =
            window.confirm(
                `Are you sure you want to close ${monthName}?\n\n` +
                `Closing Balance: ${formatRupees(
                    closingBalance
                )}\n\n` +
                `After closing, transactions from this month cannot be edited or deleted.`
            );

        if (!confirmed) {
            return;
        }

        try {
            setClosingMonth(true);
            setMonthActionError('');

            /*
             * STEP 1
             * Complete the current month.
             */

            await completeMonth(activeMonth.id);


            /*
             * STEP 2
             * Calculate the next calendar month.
             */

            const nextMonth =
                getNextMonth(
                    activeMonth.month
                );


            /*
             * STEP 3
             * Create the next month.
             *
             * The backend automatically
             * carries forward the closing balance.
             */

            await createNextMonth(
                activeMonth.id,
                nextMonth
            );


            /*
             * STEP 4
             * Reload everything.
             */

            await loadDashboard();


            alert(
                `${monthName} has been closed successfully.\n\n` +
                `${getMonthName(nextMonth)} is now active.`
            );

        } catch (err) {
            console.error(err);

            setMonthActionError(
                err.message ||
                'Unable to close month.'
            );

        } finally {
            setClosingMonth(false);
        }
    }


    /*
     * ANALYTICS PAGE
     */

    if (page === 'analytics') {
        return (
            <AnalyticsPage
                onBack={() =>
                    setPage('dashboard')
                }
            />
        );
    }


    /*
     * MONTHLY HISTORY PAGE
     */

    if (page === 'history') {
        return (
            <MonthlyHistoryPage
                onBack={() =>
                    setPage('dashboard')
                }
            />
        );
    }


    /*
     * SAVINGS GOALS PAGE
     */

    if (page === 'goals') {
        return (
            <>
                <SavingsGoalsPage
                    onBack={() =>
                        setPage('dashboard')
                    }
                    onAddGoal={() =>
                        setShowGoalForm(true)
                    }
                />

                {showGoalForm && (
                    <GoalForm
                        onClose={() =>
                            setShowGoalForm(false)
                        }
                        onGoalAdded={() => {
                            setShowGoalForm(false);
                            loadDashboard();
                        }}
                    />
                )}
            </>
        );
    }


    /*
     * TRANSACTIONS PAGE
     */

    if (page === 'transactions') {
        return (
            <>
                <TransactionsPage
                    monthId={activeMonth?.id}
                    month={activeMonth}

                    onBack={() =>
                        setPage('dashboard')
                    }

                    onAddTransaction={() =>
                        setShowTransactionForm(true)
                    }
                />

                {showTransactionForm && (
                    <TransactionForm
                        monthId={activeMonth?.id}

                        month={activeMonth?.month}

                        onClose={() =>
                            setShowTransactionForm(false)
                        }

                        onTransactionAdded={() => {
                            setShowTransactionForm(false);
                            loadDashboard();
                        }}
                    />
                )}
            </>
        );
    }


    return (
        <div className="app">

            {/* ================================
                HEADER
            ================================= */}

            <header className="topbar">

                <div>

                    <h1>
                        Personal Finance Ledger
                    </h1>

                    <p>
                        Track your money. Plan your savings.
                    </p>

                </div>


                <div className="topbar-actions">

                    <button
                        className="primary-button"

                        onClick={() =>
                            setShowTransactionForm(true)
                        }

                        disabled={!activeMonth}
                    >
                        + Add Transaction
                    </button>

                    <div className="month-selector">

                       <span>
                            Current Month
                        </span>

                     <strong>
                         {activeMonth?.monthName ||
                                 getMonthName(activeMonth?.month)}
                         </strong>

                        {activeMonth?.id && (
                            <small>
                            Month ID: {activeMonth.id}
                           </small>
                         )}

                     </div>

                </div>

            </header>


            {/* ================================
                DASHBOARD
            ================================= */}

            <main className="dashboard">

                {loading && (
                    <div className="status-message">
                        Loading your financial data...
                    </div>
                )}


                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}


                {!loading && !error && (
                    <>

                        {/* ================================
                            BALANCE
                        ================================= */}

                        <section className="balance-card">

                            <div>

                                <p className="card-label">
                                    Available Balance
                                </p>

                                <h2>
                                    {formatRupees(
                                        balance?.availableBalance
                                    )}
                                </h2>

                                <p className="balance-note">
                                    Money currently available
                                </p>

                            </div>


                            <div className="balance-icon">
                                ₹
                            </div>

                        </section>


                        {/* ================================
                            MONTH MANAGEMENT
                        ================================= */}

                        <section className="month-management-card">

                            <div className="month-management-info">

                                <div className="month-management-icon">
                                    📅
                                </div>


                                <div>

                                    <p className="card-label">
                                        Month Management
                                    </p>

                                    <h2>
                                        {getMonthName(
                                            activeMonth?.month
                                        )}
                                    </h2>
                                    
                                    {activeMonth?.id && (
                                       <p
                                        style={{
                                        margin: '0 0 6px',
                                        fontSize: '13px',
                                        color: '#6b7280'
                                     }} 
                                    >
                                         Month ID: {activeMonth.id}
                                      </p>
                                    )}

                                    <p className="month-management-note">
                                        Close this month when
                                        your financial activity
                                        is complete. The closing
                                        balance will automatically
                                        carry forward to the next month.
                                    </p>

                                </div>

                            </div>


                            <div
                                className="month-management-action"
                                style={{
                                    display: 'flex',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}
                            >

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        setPage('history')
                                    }
                                >
                                    View History
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        setPage('analytics')
                                    }
                                >
                                    View Analytics
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() => {
                                    window.location.href =
                                         getExcelExportUrl();
                                    }}
                                >
                                     ↓ Export Excel
                                </button>
                                
                                <button
                                    className="secondary-button"

                                    onClick={handleCloseMonth}

                                    disabled={
                                        closingMonth ||
                                        !activeMonth
                                    }
                                >
                                    {closingMonth
                                        ? 'Closing Month...'
                                        : '✓ Close Month'}
                                </button>

                            </div>

                        </section>


                        {monthActionError && (
                            <div className="error-message">
                                {monthActionError}
                            </div>
                        )}


                        {/* ================================
                            SUMMARY
                        ================================= */}

                        <section className="summary-grid">


                            <div className="summary-card">

                                <p>
                                    Income
                                </p>

                                <h3>
                                    {formatRupees(
                                        summary?.income
                                    )}
                                </h3>

                                <span>
                                    Money received
                                </span>

                            </div>


                            <div className="summary-card">

                                <p>
                                    Expenses
                                </p>

                                <h3>
                                    {formatRupees(
                                        summary?.expenses
                                    )}
                                </h3>

                                <span>
                                    Money spent
                                </span>

                            </div>


                            <div className="summary-card">

                                <p>
                                    Money Lent
                                </p>

                                <h3>
                                    {formatRupees(
                                        summary?.lent
                                    )}
                                </h3>

                                <span>
                                    Money given to others
                                </span>

                            </div>


                            <div className="summary-card">

                                <p>
                                    Monthly Savings
                                </p>

                                <h3>
                                    {formatRupees(
                                        monthlySavings
                                    )}
                                </h3>

                                <span>
                                    Income minus expenses
                                </span>

                            </div>

                        </section>


                        {/* ================================
                            LOWER PANELS
                        ================================= */}

                        <section className="content-grid">


                            {/* TRANSACTIONS */}

                            <div className="panel">

                                <div className="panel-header">

                                    <div>

                                        <h2>
                                            Recent Transactions
                                        </h2>

                                        <p>
                                            Your latest financial activity
                                        </p>

                                    </div>


                                    <button
                                        className="secondary-button"

                                        onClick={() =>
                                            setPage(
                                                'transactions'
                                            )
                                        }
                                    >
                                        View All
                                    </button>

                                </div>


                                {transactions.length === 0 ? (

                                    <div className="empty-state">

                                        <div className="empty-icon">
                                            ₹
                                        </div>

                                        <h3>
                                            No transactions yet
                                        </h3>

                                        <p>
                                            Add your first transaction
                                            for this month.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="transaction-list">

                                        {transactions
                                            .slice(0, 5)
                                            .map(
                                                (
                                                    transaction
                                                ) => (

                                                    <div
                                                        className="transaction-item"

                                                        key={
                                                            transaction.id
                                                        }
                                                    >

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

                                                                {' • '}

                                                                {
                                                                    formatDate(
                                                                        transaction.transaction_date
                                                                    )
                                                                }

                                                            </span>

                                                        </div>


                                                        <strong
                                                            className={
                                                                transaction.type ===
                                                                'income'
                                                                    ? 'amount-positive'
                                                                    : 'amount-negative'
                                                            }
                                                        >

                                                            {
                                                                transaction.type ===
                                                                'income'
                                                                    ? '+'
                                                                    : '-'
                                                            }

                                                            {
                                                                formatRupees(
                                                                    transaction.amount
                                                                )
                                                            }

                                                        </strong>

                                                    </div>

                                                )
                                            )}

                                    </div>

                                )}

                            </div>


                            {/* SAVINGS GOALS */}

                            <div className="panel">

                                <div className="panel-header">

                                    <div>

                                        <h2>
                                            Savings Goals
                                        </h2>

                                        <p>
                                            What are you saving for?
                                        </p>

                                    </div>


                                    <button
                                        className="secondary-button"

                                        onClick={() =>
                                            setPage('goals')
                                        }
                                    >
                                        + Add Goal
                                    </button>

                                </div>


                                {goals.filter(
                                    (goal) =>
                                        goal.status ===
                                        'active'
                                ).length === 0 ? (

                                    <div className="empty-state">

                                        <div className="empty-icon">
                                            🎯
                                        </div>

                                        <h3>
                                            No active goals
                                        </h3>

                                        <p>
                                            Create a goal and start
                                            planning your savings.
                                        </p>

                                    </div>

                                ) : (

                                    <div className="goal-list">

                                        {goals
                                            .filter(
                                                (goal) =>
                                                    goal.status ===
                                                    'active'
                                            )
                                            .slice(0, 3)
                                            .map(
                                                (goal) => (

                                                    <div
                                                        className="goal-item"

                                                        key={
                                                            goal.id
                                                        }
                                                    >

                                                        <div className="goal-top">

                                                            <strong>
                                                                {
                                                                    goal.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    goal.progress_percentage
                                                                }%
                                                            </span>

                                                        </div>


                                                        <div className="progress-bar">

                                                            <div
                                                                className="progress-fill"

                                                                style={{
                                                                    width:
                                                                        `${Math.min(
                                                                            goal.progress_percentage,
                                                                            100
                                                                        )}%`
                                                                }}
                                                            />

                                                        </div>


                                                        <div className="goal-bottom">

                                                            <span>

                                                                {
                                                                    formatRupees(
                                                                        goal.saved_amount
                                                                    )
                                                                }

                                                                {' saved'}

                                                            </span>


                                                            <span>

                                                                {
                                                                    formatRupees(
                                                                        goal.remaining_amount
                                                                    )
                                                                }

                                                                {' remaining'}

                                                            </span>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                    </div>

                                )}

                            </div>

                        </section>

                    </>
                )}

            </main>


            {/* ================================
                TRANSACTION FORM
            ================================= */}

            {showTransactionForm && (

                <TransactionForm

                    monthId={
                        activeMonth?.id
                    }

                    month={
                        activeMonth?.month
                    }

                    onClose={() =>
                        setShowTransactionForm(false)
                    }

                    onTransactionAdded={() => {
                        setShowTransactionForm(false);
                        loadDashboard();
                    }}

                />

            )}


            {/* ================================
                GOAL FORM
            ================================= */}

            {showGoalForm && (

                <GoalForm

                    onClose={() =>
                        setShowGoalForm(false)
                    }

                    onGoalAdded={() => {
                        setShowGoalForm(false);
                        loadDashboard();
                    }}

                />

            )}

        </div>
    );
}


export default App;
