const {
    getMonthHistory
} = require('../services/monthHistoryService');

function getMonthHistoryController(
    req,
    res
) {
    try {

        const months =
            getMonthHistory();

        return res.status(200).json({
            months
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to get monthly history.'
        });
    }
}

module.exports = {
    getMonthHistory:
        getMonthHistoryController
};