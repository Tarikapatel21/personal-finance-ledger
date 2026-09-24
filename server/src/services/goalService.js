const db = require('../database');


// ==========================================
// FORMAT GOAL
// ==========================================

function formatGoal(goal) {
    const targetAmount =
        Number(goal.target_amount || 0);

    const savedAmount =
        Number(goal.saved_amount || 0);

    const remainingAmount =
        Math.max(
            targetAmount - savedAmount,
            0
        );

    const progressPercentage =
        targetAmount > 0
            ? Number(
                Math.min(
                    (savedAmount / targetAmount) * 100,
                    100
                ).toFixed(2)
            )
            : 0;

    return {
        ...goal,

        target_amount:
            targetAmount,

        saved_amount:
            savedAmount,

        remaining_amount:
            remainingAmount,

        progress_percentage:
            progressPercentage
    };
}


// ==========================================
// GET GOAL BY ID
// ==========================================

function getGoalById(goalId) {
    return db.prepare(`
        SELECT
            id,
            name,
            target_amount,
            target_date,
            saved_amount,
            status,
            created_at,
            updated_at
        FROM savings_goals
        WHERE id = ?
    `).get(goalId);
}


// ==========================================
// CREATE GOAL
// ==========================================

function createGoal(data) {
    const {
        name,
        target_amount,
        target_date,
        saved_amount = 0
    } = data;

    const targetAmount =
        Number(target_amount);

    const savedAmount =
        Number(saved_amount);


    const status =
        savedAmount >= targetAmount
            ? 'completed'
            : 'active';


    const statement = db.prepare(`
        INSERT INTO savings_goals (
            name,
            target_amount,
            target_date,
            saved_amount,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `);


    const result =
        statement.run(
            name.trim(),
            targetAmount,
            target_date,
            savedAmount,
            status
        );


    const goal =
        getGoalById(
            Number(
                result.lastInsertRowid
            )
        );


    return formatGoal(goal);
}


// ==========================================
// GET ALL GOALS
// ==========================================

function getGoals() {
    const goals = db.prepare(`
        SELECT
            id,
            name,
            target_amount,
            target_date,
            saved_amount,
            status,
            created_at,
            updated_at
        FROM savings_goals
        ORDER BY
            CASE
                WHEN status = 'active' THEN 0
                ELSE 1
            END,
            target_date ASC,
            id ASC
    `).all();


    return goals.map(
        formatGoal
    );
}


// ==========================================
// UPDATE GOAL
// ==========================================

function updateGoal(
    goalId,
    data
) {
    const {
        name,
        target_amount,
        target_date,
        saved_amount
    } = data;


    const targetAmount =
        Number(target_amount);

    const savedAmount =
        Number(saved_amount);


    const existingGoal =
        getGoalById(goalId);


    if (!existingGoal) {
        return null;
    }


    const status =
        savedAmount >= targetAmount
            ? 'completed'
            : 'active';


    const statement = db.prepare(`
        UPDATE savings_goals
        SET
            name = ?,
            target_amount = ?,
            target_date = ?,
            saved_amount = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);


    statement.run(
        name.trim(),
        targetAmount,
        target_date,
        savedAmount,
        status,
        goalId
    );


    const goal =
        getGoalById(
            goalId
        );


    return formatGoal(goal);
}


// ==========================================
// DELETE GOAL
// ==========================================

function deleteGoal(goalId) {
    const result = db.prepare(`
        DELETE FROM savings_goals
        WHERE id = ?
    `).run(goalId);


    return result.changes > 0;
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal
};