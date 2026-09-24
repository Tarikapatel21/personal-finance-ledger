const ExcelJS = require('exceljs');
const db = require('../database');


// ==========================================
// FORMAT DATE FOR EXCEL
// ==========================================

function formatDate(dateString) {
    if (!dateString) {
        return '';
    }

    const [year, month, day] =
        dateString.split('-').map(Number);

    /*
        Use UTC so the date does not shift
        backward because of the local timezone.

        Example:
        2026-12-01 stays 01-Dec-2026
        2026-09-14 stays 14-Sep-2026
    */

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );
}


// ==========================================
// GET TRANSACTIONS
// ==========================================

function getTransactions() {
    return db.prepare(`
        SELECT
            t.id,
            m.month,
            t.transaction_date,
            t.type,
            t.category,
            t.description,
            t.amount,
            t.payment_method

        FROM transactions t

        INNER JOIN months m
            ON m.id = t.month_id

        ORDER BY
            t.transaction_date ASC,
            t.id ASC
    `).all();
}


// ==========================================
// GET MONTHLY SUMMARY
// ==========================================

function getMonthlySummary() {
    const months = db.prepare(`
        SELECT
            m.id,
            m.month,
            m.opening_balance,
            m.status,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'income'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS income,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'expense'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS expenses,

            COALESCE(
                SUM(
                    CASE
                        WHEN t.type = 'lent'
                        THEN t.amount
                        ELSE 0
                    END
                ),
                0
            ) AS lent

        FROM months m

        LEFT JOIN transactions t
            ON t.month_id = m.id

        GROUP BY
            m.id,
            m.month,
            m.opening_balance,
            m.status

        ORDER BY
            m.month ASC
    `).all();

    return months.map((month) => {

        const openingBalance =
            Number(
                month.opening_balance || 0
            );

        const income =
            Number(
                month.income || 0
            );

        const expenses =
            Number(
                month.expenses || 0
            );

        const lent =
            Number(
                month.lent || 0
            );

        const monthlySavings =
            income - expenses;

        const closingBalance =
            openingBalance +
            income -
            expenses -
            lent;

        return {
            id: month.id,
            month: month.month,
            openingBalance,
            income,
            expenses,
            lent,
            monthlySavings,
            closingBalance,
            status: month.status
        };
    });
}


// ==========================================
// GET SAVINGS GOALS
// ==========================================

function getSavingsGoals() {
    return db.prepare(`
        SELECT
            id,
            name,
            target_amount,
            target_date,
            saved_amount,
            status

        FROM savings_goals

        ORDER BY
            target_date ASC,
            id ASC
    `).all();
}


// ==========================================
// GET CATEGORY SUMMARY
// ==========================================

function getCategorySummary() {
    return db.prepare(`
        SELECT
            category,
            SUM(amount) AS amount,
            COUNT(*) AS transaction_count

        FROM transactions

        WHERE type = 'expense'

        GROUP BY category

        ORDER BY amount DESC
    `).all();
}


// ==========================================
// STYLE WORKSHEET HEADER
// ==========================================

function styleHeader(row) {

    row.font = {
        bold: true
    };

    row.alignment = {
        vertical: 'middle'
    };
}


// ==========================================
// GENERATE EXCEL FILE
// ==========================================

async function generateExcelReport() {

    const workbook =
        new ExcelJS.Workbook();

    workbook.creator =
        'Personal Finance Ledger';

    workbook.created =
        new Date();


    // ======================================
    // TRANSACTIONS SHEET
    // ======================================

    const transactionsSheet =
        workbook.addWorksheet(
            'Transactions'
        );

    transactionsSheet.columns = [

        {
            header: 'Transaction ID',
            key: 'id',
            width: 16
        },

        {
            header: 'Month',
            key: 'month',
            width: 14
        },

        {
            header: 'Date',
            key: 'transaction_date',
            width: 15
        },

        {
            header: 'Type',
            key: 'type',
            width: 14
        },

        {
            header: 'Category',
            key: 'category',
            width: 20
        },

        {
            header: 'Description',
            key: 'description',
            width: 35
        },

        {
            header: 'Amount (₹)',
            key: 'amount',
            width: 16
        },

        {
            header: 'Payment Method',
            key: 'payment_method',
            width: 20
        }
    ];

    styleHeader(
        transactionsSheet.getRow(1)
    );

    const transactions =
        getTransactions();

    transactions.forEach((transaction) => {

        const row =
            transactionsSheet.addRow({

                id:
                    transaction.id,

                month:
                    transaction.month,

                transaction_date:
                    formatDate(
                        transaction.transaction_date
                    ),

                type:
                    transaction.type,

                category:
                    transaction.category,

                description:
                    transaction.description || '',

                amount:
                    Number(
                        transaction.amount
                    ) / 100,

                payment_method:
                    transaction.payment_method
            });

        row.getCell(
            'transaction_date'
        ).numFmt =
            'dd-mmm-yyyy';

        row.getCell(
            'amount'
        ).numFmt =
            '₹#,##0.00';
    });


    // ======================================
    // MONTHLY SUMMARY SHEET
    // ======================================

    const monthlySheet =
        workbook.addWorksheet(
            'Monthly Summary'
        );

    monthlySheet.columns = [

        {
            header: 'Month',
            key: 'month',
            width: 15
        },

        {
            header: 'Status',
            key: 'status',
            width: 14
        },

        {
            header: 'Opening Balance (₹)',
            key: 'openingBalance',
            width: 22
        },

        {
            header: 'Income (₹)',
            key: 'income',
            width: 16
        },

        {
            header: 'Expenses (₹)',
            key: 'expenses',
            width: 18
        },

        {
            header: 'Money Lent (₹)',
            key: 'lent',
            width: 18
        },

        {
            header: 'Monthly Savings (₹)',
            key: 'monthlySavings',
            width: 22
        },

        {
            header: 'Closing Balance (₹)',
            key: 'closingBalance',
            width: 22
        }
    ];

    styleHeader(
        monthlySheet.getRow(1)
    );

    const monthlySummary =
        getMonthlySummary();

    monthlySummary.forEach((month) => {

        const row =
            monthlySheet.addRow({

                month:
                    month.month,

                status:
                    month.status,

                openingBalance:
                    month.openingBalance / 100,

                income:
                    month.income / 100,

                expenses:
                    month.expenses / 100,

                lent:
                    month.lent / 100,

                monthlySavings:
                    month.monthlySavings / 100,

                closingBalance:
                    month.closingBalance / 100
            });

        for (
            let column = 3;
            column <= 8;
            column++
        ) {

            row.getCell(
                column
            ).numFmt =
                '₹#,##0.00';
        }
    });


    // ======================================
    // SAVINGS GOALS SHEET
    // ======================================

    const goalsSheet =
        workbook.addWorksheet(
            'Savings Goals'
        );

    goalsSheet.columns = [

        {
            header: 'Goal ID',
            key: 'id',
            width: 12
        },

        {
            header: 'Goal Name',
            key: 'name',
            width: 25
        },

        {
            header: 'Target Amount (₹)',
            key: 'target_amount',
            width: 22
        },

        {
            header: 'Saved Amount (₹)',
            key: 'saved_amount',
            width: 21
        },

        {
            header: 'Remaining (₹)',
            key: 'remaining',
            width: 18
        },

        {
            header: 'Progress (%)',
            key: 'progress',
            width: 16
        },

        {
            header: 'Target Date',
            key: 'target_date',
            width: 16
        },

        {
            header: 'Status',
            key: 'status',
            width: 14
        }
    ];

    styleHeader(
        goalsSheet.getRow(1)
    );

    const goals =
        getSavingsGoals();

    goals.forEach((goal) => {

        const targetAmount =
            Number(
                goal.target_amount || 0
            );

        const savedAmount =
            Number(
                goal.saved_amount || 0
            );

        const remaining =
            Math.max(
                targetAmount -
                savedAmount,
                0
            );

        const progress =
            targetAmount === 0
                ? 0
                : (
                    savedAmount /
                    targetAmount
                ) * 100;

        const row =
            goalsSheet.addRow({

                id:
                    goal.id,

                name:
                    goal.name,

                target_amount:
                    targetAmount / 100,

                saved_amount:
                    savedAmount / 100,

                remaining:
                    remaining / 100,

                progress:
                    Number(
                        progress.toFixed(2)
                    ),

                target_date:
                    formatDate(
                        goal.target_date
                    ),

                status:
                    goal.status
            });

        row.getCell(
            'target_amount'
        ).numFmt =
            '₹#,##0.00';

        row.getCell(
            'saved_amount'
        ).numFmt =
            '₹#,##0.00';

        row.getCell(
            'remaining'
        ).numFmt =
            '₹#,##0.00';

        row.getCell(
            'target_date'
        ).numFmt =
            'dd-mmm-yyyy';
    });


    // ======================================
    // CATEGORY SUMMARY SHEET
    // ======================================

    const categorySheet =
        workbook.addWorksheet(
            'Category Summary'
        );

    categorySheet.columns = [

        {
            header: 'Category',
            key: 'category',
            width: 25
        },

        {
            header: 'Total Expenses (₹)',
            key: 'amount',
            width: 22
        },

        {
            header: 'Transactions',
            key: 'transaction_count',
            width: 18
        }
    ];

    styleHeader(
        categorySheet.getRow(1)
    );

    const categories =
        getCategorySummary();

    categories.forEach((category) => {

        const row =
            categorySheet.addRow({

                category:
                    category.category,

                amount:
                    Number(
                        category.amount || 0
                    ) / 100,

                transaction_count:
                    Number(
                        category.transaction_count || 0
                    )
            });

        row.getCell(
            'amount'
        ).numFmt =
            '₹#,##0.00';
    });


    // ======================================
    // FREEZE HEADER ROWS
    // ======================================

    transactionsSheet.views = [
        {
            state: 'frozen',
            ySplit: 1
        }
    ];

    monthlySheet.views = [
        {
            state: 'frozen',
            ySplit: 1
        }
    ];

    goalsSheet.views = [
        {
            state: 'frozen',
            ySplit: 1
        }
    ];

    categorySheet.views = [
        {
            state: 'frozen',
            ySplit: 1
        }
    ];


    // ======================================
    // RETURN WORKBOOK
    // ======================================

    return workbook;
}


module.exports = {
    generateExcelReport
};