const {
    getAnalytics
} = require('../services/analyticsService');

function getAnalyticsController(
    req,
    res
) {
    try {

        const analytics =
            getAnalytics();

        return res.status(200).json({
            analytics
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to get analytics.'
        });
    }
}

module.exports = {
    getAnalytics:
        getAnalyticsController
};