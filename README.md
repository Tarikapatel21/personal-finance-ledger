# Personal Finance Ledger

A full-stack personal finance management web application designed to help users track monthly income, expenses, lending, available balance, savings goals, financial trends, and downloadable Excel reports.

The application uses a manual transaction-entry approach and maintains historical monthly records without deleting completed months.

---

## Overview

Personal Finance Ledger is a browser-based financial tracking application built to answer two practical questions:

1. Where is my money going?
2. What am I saving for, and how much money do I have available?

Users can create monthly financial records, manually record transactions, track savings goals, analyze spending patterns, view historical financial activity, and export their records to Excel.

---

## Key Features

### Transaction Management

- Add income, expenses, and money lent
- Record transaction category and description
- Record transaction date
- Record payment method
- Edit existing transactions
- Delete transactions
- Search transactions
- Filter by transaction type
- Sort transactions by date
- Month-specific transaction records

### Monthly Finance Management

- Create monthly financial records
- Set opening balance
- Track income
- Track expenses
- Track money lent separately
- Calculate available balance
- Complete a month
- Carry the closing balance into the next month
- Preserve completed months as historical records

### Savings Goals

- Create multiple savings goals
- Set target amount
- Set amount already saved
- Set target date
- Calculate remaining amount
- Calculate progress percentage
- Track active and completed goals

Savings goals are treated as planning allocations and do not directly reduce the available account balance.

### Analytics

- Total income
- Total expenses
- Total money lent
- Monthly savings
- Expenses by category
- Expenses by payment method
- Monthly financial trends
- Closing balance across recorded months

### Excel Export

The application can generate an Excel workbook containing:

- Transactions
- Monthly Summary
- Savings Goals
- Category Summary

The export converts stored paise values into Indian Rupee values for reporting.

---

## Financial Calculation Logic

### Available Balance

```text
Available Balance =
Opening Balance
+ Income
- Expenses
- Money Lent