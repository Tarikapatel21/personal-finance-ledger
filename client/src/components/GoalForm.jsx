import { useEffect, useState } from 'react';

import {
    createGoal,
    updateGoal
} from '../services/api';

function GoalForm({
    onClose,
    onGoalAdded,
    goal = null
}) {
    const isEditing = Boolean(goal);

    const [formData, setFormData] = useState({
        name: '',
        target_amount: '',
        target_date: '',
        saved_amount: ''
    });

    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (goal) {
            setFormData({
                name: goal.name || '',
                target_amount:
                    Number(goal.target_amount || 0) / 100,
                target_date:
                    goal.target_date || '',
                saved_amount:
                    Number(goal.saved_amount || 0) / 100
            });
        } else {
            setFormData({
                name: '',
                target_amount: '',
                target_date: '',
                saved_amount: ''
            });
        }
    }, [goal]);

    function handleChange(event) {
        const {
            name,
            value
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError('');

        const targetAmount =
            Number(formData.target_amount);

        const savedAmount =
            Number(
                formData.saved_amount || 0
            );

        if (!formData.name.trim()) {
            setError(
                'Please enter a goal name.'
            );
            return;
        }

        if (formData.name.trim().length > 100) {
            setError(
                'Goal name cannot be longer than 100 characters.'
            );
            return;
        }

        if (
            !Number.isFinite(targetAmount) ||
            targetAmount <= 0
        ) {
            setError(
                'Please enter a valid target amount.'
            );
            return;
        }

        if (
            !Number.isFinite(savedAmount) ||
            savedAmount < 0
        ) {
            setError(
                'Saved amount cannot be negative.'
            );
            return;
        }

        if (savedAmount > targetAmount) {
            setError(
                'Saved amount cannot be greater than the target amount.'
            );
            return;
        }

        if (!formData.target_date) {
            setError(
                'Please select a target date.'
            );
            return;
        }

        try {
            setSaving(true);

            const requestBody = {
                name: formData.name.trim(),
                target_amount:
                    Math.round(targetAmount * 100),
                target_date:
                    formData.target_date,
                saved_amount:
                    Math.round(savedAmount * 100)
            };

            const data = isEditing
                ? await updateGoal(
                    goal.id,
                    requestBody
                )
                : await createGoal(
                    requestBody
                );

            onGoalAdded(data.goal);
            onClose();

        } catch (err) {
            console.error(err);

            setError(
                err.message ||
                (
                    isEditing
                        ? 'Failed to update savings goal.'
                        : 'Failed to create savings goal.'
                )
            );

        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="modal-overlay">

            <div className="transaction-modal">

                {/* HEADER */}

                <div className="modal-header">

                    <div>

                        <h2>
                            {isEditing
                                ? 'Edit Savings Goal'
                                : 'Add Savings Goal'}
                        </h2>

                        <p>
                            {isEditing
                                ? 'Update your savings goal details.'
                                : 'Plan what you want to save for.'}
                        </p>

                    </div>

                    <button
                        className="close-button"
                        onClick={onClose}
                        type="button"
                        disabled={saving}
                    >
                        ×
                    </button>

                </div>


                {/* FORM */}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">

                        <label htmlFor="name">
                            Goal Name
                        </label>

                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Laptop"
                            value={formData.name}
                            onChange={handleChange}
                            maxLength={100}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="target_amount">
                            Target Amount (₹)
                        </label>

                        <input
                            id="target_amount"
                            name="target_amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="60000"
                            value={
                                formData.target_amount
                            }
                            onChange={handleChange}
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="saved_amount">
                            Already Saved (₹)
                        </label>

                        <input
                            id="saved_amount"
                            name="saved_amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={
                                formData.saved_amount
                            }
                            onChange={handleChange}
                        />

                        <small
                            style={{
                                display: 'block',
                                marginTop: '6px',
                                color: '#6b7280',
                                lineHeight: '1.5'
                            }}
                        >
                            This is planning data and
                            does not reduce your
                            available balance.
                        </small>

                    </div>


                    <div className="form-group">

                        <label htmlFor="target_date">
                            Target Date
                        </label>

                        <input
                            id="target_date"
                            name="target_date"
                            type="date"
                            value={
                                formData.target_date
                            }
                            onChange={handleChange}
                            required
                        />

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
                            disabled={saving}
                        >
                            {saving
                                ? (
                                    isEditing
                                        ? 'Updating...'
                                        : 'Saving...'
                                )
                                : (
                                    isEditing
                                        ? 'Save Changes'
                                        : 'Save Goal'
                                )}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default GoalForm;