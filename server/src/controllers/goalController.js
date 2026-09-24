const {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal
} = require('../services/goalService');


// ==========================================
// CREATE GOAL
// ==========================================

function createGoalController(req, res) {
    try {
        const goal =
            createGoal(req.body);

        return res.status(201).json({
            message:
                'Savings goal created successfully.',
            goal
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                'Failed to create savings goal.'
        });
    }
}


// ==========================================
// GET GOALS
// ==========================================

function getGoalsController(req, res) {
    try {
        const goals =
            getGoals();

        return res.status(200).json({
            goals
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                'Failed to get savings goals.'
        });
    }
}


// ==========================================
// UPDATE GOAL
// ==========================================

function updateGoalController(req, res) {
    const goalId =
        Number(req.params.id);


    if (
        !Number.isInteger(goalId) ||
        goalId <= 0
    ) {
        return res.status(400).json({
            message:
                'Goal ID must be a positive integer.'
        });
    }


    try {
        const goal =
            updateGoal(
                goalId,
                req.body
            );


        if (!goal) {
            return res.status(404).json({
                message:
                    'Savings goal not found.'
            });
        }


        return res.status(200).json({
            message:
                'Savings goal updated successfully.',
            goal
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                'Failed to update savings goal.'
        });
    }
}


// ==========================================
// DELETE GOAL
// ==========================================

function deleteGoalController(req, res) {
    const goalId =
        Number(req.params.id);


    if (
        !Number.isInteger(goalId) ||
        goalId <= 0
    ) {
        return res.status(400).json({
            message:
                'Goal ID must be a positive integer.'
        });
    }


    try {
        const deleted =
            deleteGoal(goalId);


        if (!deleted) {
            return res.status(404).json({
                message:
                    'Savings goal not found.'
            });
        }


        return res.status(200).json({
            message:
                'Savings goal deleted successfully.'
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message:
                'Failed to delete savings goal.'
        });
    }
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    createGoal:
        createGoalController,

    getGoals:
        getGoalsController,

    updateGoal:
        updateGoalController,

    deleteGoal:
        deleteGoalController
};