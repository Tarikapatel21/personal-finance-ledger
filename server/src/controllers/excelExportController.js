const {
    generateExcelReport
} = require('../services/excelExportService');

async function exportExcelController(
    req,
    res
) {
    try {

        const workbook =
            await generateExcelReport();

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename="Personal-Finance-Report.xlsx"'
        );

        await workbook.xlsx.write(
            res
        );

        res.end();

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                'Failed to generate Excel report.'
        });
    }
}

module.exports = {
    exportExcel:
        exportExcelController
};