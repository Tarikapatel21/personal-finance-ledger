const { getBalance } = require('../services/balanceService');

function getMonthSummary(req, res) {
    const monthId = Number(req.params.monthId);

    if (!Number.isInteger(monthId) || monthId <= 0) {
        return res.status(400).json({
            message: 'monthId must be a positive integer.'
        });
    }

    try {
        const balance = getBalance(monthId);

        if (!balance) {
            return res.status(404).json({
                message: 'Month not found.'
            });
        }

        res.status(200).json({
            summary: balance
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Failed to get month summary.'
        });
    }
}

module.exports = {
    getMonthSummary
};