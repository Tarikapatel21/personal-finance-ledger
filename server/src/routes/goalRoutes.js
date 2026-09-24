const express = require('express');

const {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal
} = require('../controllers/goalController');

const validateGoal =
    require('../middleware/goalValidator');

const router = express.Router();


router.post(
    '/',
    validateGoal,
    createGoal
);


router.get(
    '/',
    getGoals
);


router.put(
    '/:id',
    validateGoal,
    updateGoal
);


router.delete(
    '/:id',
    deleteGoal
);


module.exports = router;