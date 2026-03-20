# Gelir Gider Takip

## Current State
App has Dashboard (summary cards, charts, transactions table), Transactions page, Accounts page (add/delete), and Categories page (add/delete). Backend supports accounts, categories, and transactions with income/expense types.

## Requested Changes (Diff)

### Add
- Accounts page: show computed balance per account (sum of income - expense from transactions)
- Accounts page: show transaction count per account
- Categories page: show total spending per category with income/expense breakdown
- Categories page: show transaction count per category
- Dashboard: add a top-5 categories by spending section
- Dashboard: add type filter (all/income/expense) to transactions table

### Modify
- AccountsPage: pull transactions data to compute per-account balance and tx count
- CategoriesPage: pull transactions data to compute per-category totals

### Remove
- Nothing

## Implementation Plan
1. In AccountsPage: use useAllTransactions hook to compute balance and count per account, display in the account list items
2. In CategoriesPage: use useAllTransactions hook to compute total income and expense per category plus count, display in the category list items
3. In DashboardPage: add income/expense type filter to the transactions table filter bar
