import { useEffect, useState } from 'react';

import {
    getGoals,
    deleteGoal
} from '../services/api';

function formatRupees(paise) {
    return `₹${(Number(paise || 0) / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })}`;
}

function formatDate(dateString) {
    if (!dateString) {
        return 'No date';
    }

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getGoalStatus(goal) {
    if (goal.status === 'completed') {
        return 'Completed';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(
        `${goal.target_date}T00:00:00`
    );

    if (targetDate < today) {
        return 'Overdue';
    }

    return 'Active';
}

function SavingsGoalsPage({
    onBack,
    onAddGoal,
    onGoalUpdated
}) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingGoal, setEditingGoal] = useState(null);
    const [deletingGoalId, setDeletingGoalId] = useState(null);

    async function loadGoals() {
        try {
            setLoading(true);
            setError('');

            const data =
                await getGoals();

            setGoals(data.goals || []);
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Failed to load savings goals.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadGoals();
    }, []);

    async function handleDelete(goal) {
        const confirmed = window.confirm(
            `Are you sure you want to delete the "${goal.name}" savings goal?\n\n` +
            `Target: ${formatRupees(goal.target_amount)}\n` +
            `Saved: ${formatRupees(goal.saved_amount)}\n\n` +
            `This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingGoalId(goal.id);
            setError('');

            await deleteGoal(goal.id);

            setGoals((previousGoals) =>
                previousGoals.filter(
                    (item) => item.id !== goal.id
                )
            );
        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                'Failed to delete savings goal.'
            );
        } finally {
            setDeletingGoalId(null);
        }
    }

    function handleEdit(goal) {
        setEditingGoal(goal);
    }

    function handleGoalUpdated(updatedGoal) {
        setGoals((previousGoals) =>
            previousGoals.map((goal) =>
                goal.id === updatedGoal.id
                    ? updatedGoal
                    : goal
            )
        );

        setEditingGoal(null);

        if (onGoalUpdated) {
            onGoalUpdated(updatedGoal);
        }
    }

    const totalTarget = goals.reduce(
        (total, goal) =>
            total + Number(goal.target_amount || 0),
        0
    );

    const totalSaved = goals.reduce(
        (total, goal) =>
            total + Number(goal.saved_amount || 0),
        0
    );

    const totalRemaining = goals.reduce(
        (total, goal) =>
            total + Number(goal.remaining_amount || 0),
        0
    );

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
                        Savings Goals
                    </h1>

                    <p>
                        Plan and track what you are
                        saving for.
                    </p>
                </div>

                <button
                    type="button"
                    className="primary-button"
                    onClick={onAddGoal}
                >
                    + Add Goal
                </button>

            </div>


            {/* SUMMARY */}

            {!loading &&
                !error &&
                goals.length > 0 && (

                    <div className="summary-grid">

                        <div className="summary-card">

                            <span className="summary-label">
                                Total Target
                            </span>

                            <strong>
                                {formatRupees(totalTarget)}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-label">
                                Total Saved
                            </span>

                            <strong>
                                {formatRupees(totalSaved)}
                            </strong>

                        </div>


                        <div className="summary-card">

                            <span className="summary-label">
                                Total Remaining
                            </span>

                            <strong>
                                {formatRupees(totalRemaining)}
                            </strong>

                        </div>

                    </div>
                )}


            {/* ERROR */}

            {!loading && error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {/* LOADING */}

            {loading && (

                <div className="empty-state">

                    <div className="empty-state-icon">
                        ⏳
                    </div>

                    <h2>
                        Loading savings goals...
                    </h2>

                    <p>
                        Please wait while we load
                        your goals.
                    </p>

                </div>
            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                goals.length === 0 && (

                    <div className="empty-state">

                        <div className="empty-state-icon">
                            🎯
                        </div>

                        <h2>
                            No savings goals yet
                        </h2>

                        <p>
                            Create your first goal
                            and start planning
                            what you want to save for.
                        </p>

                        <button
                            type="button"
                            className="primary-button"
                            onClick={onAddGoal}
                        >
                            + Create Your First Goal
                        </button>

                    </div>
                )}


            {/* GOALS */}

            {!loading &&
                !error &&
                goals.length > 0 && (

                    <div className="goals-grid">

                        {goals.map((goal) => {

                            const progress = Math.min(
                                Number(
                                    goal.progress_percentage || 0
                                ),
                                100
                            );

                            const status =
                                getGoalStatus(goal);

                            const isDeleting =
                                deletingGoalId === goal.id;

                            return (

                                <div
                                    className="goal-card"
                                    key={goal.id}
                                >

                                    {/* CARD HEADER */}

                                    <div className="goal-card-header">

                                        <div>

                                            <h2>
                                                {goal.name}
                                            </h2>

                                            <span
                                                className={
                                                    `goal-status goal-status-${status.toLowerCase()}`
                                                }
                                            >
                                                {status}
                                            </span>

                                        </div>

                                        <div className="goal-target">

                                            <span>
                                                Target
                                            </span>

                                            <strong>
                                                {formatRupees(
                                                    goal.target_amount
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* PROGRESS */}

                                    <div className="goal-progress-section">

                                        <div className="goal-progress-header">

                                            <span>
                                                Progress
                                            </span>

                                            <strong>
                                                {progress}%
                                            </strong>

                                        </div>

                                        <div className="progress-bar">

                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width:
                                                        `${progress}%`
                                                }}
                                            />

                                        </div>

                                    </div>


                                    {/* DETAILS */}

                                    <div className="goal-details">

                                        <div>

                                            <span>
                                                Saved
                                            </span>

                                            <strong>
                                                {formatRupees(
                                                    goal.saved_amount
                                                )}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Remaining
                                            </span>

                                            <strong>
                                                {formatRupees(
                                                    goal.remaining_amount
                                                )}
                                            </strong>

                                        </div>


                                        <div>

                                            <span>
                                                Target Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    goal.target_date
                                                )}
                                            </strong>

                                        </div>

                                    </div>


                                    {/* ACTIONS */}

                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '10px',
                                            marginTop: '18px'
                                        }}
                                    >

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() =>
                                                handleEdit(goal)
                                            }
                                            disabled={isDeleting}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() =>
                                                handleDelete(goal)
                                            }
                                            disabled={isDeleting}
                                            style={{
                                                color: '#b91c1c'
                                            }}
                                        >
                                            {isDeleting
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </button>

                                    </div>


                                    {/* FOOTER */}

                                    <div className="goal-card-footer">

                                        <span>
                                            Goal ID: {goal.id}
                                        </span>

                                        <span>
                                            Saved amount is
                                            planning data and
                                            does not reduce
                                            your available
                                            balance.
                                        </span>

                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}


            {/* EDIT FORM */}

            {editingGoal && (

                <GoalForm
                    goal={editingGoal}
                    onClose={() =>
                        setEditingGoal(null)
                    }
                    onGoalAdded={
                        handleGoalUpdated
                    }
                />

            )}

        </div>
    );
}

export default SavingsGoalsPage;