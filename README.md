# Ledger

A household-first personal finance system built on double-entry accounting.

Most budgeting apps answer:

> "Where did my money go?"

Ledger is designed to answer:

> "What actually happened to my money?"

---

## Why I Built This

After trying several personal finance tools, I kept running into the same problems:

* Balances were stored directly and drifted over time
* Transfers showed up as expenses
* Joint finances were difficult to model
* Investments, loans and credit cards felt like second-class citizens
* Historical data became difficult to trust

Rather than building another budgeting application, Ledger aims to model financial reality as accurately as possible.

Every balance should be explainable.

Every report should be reproducible.

Every transaction should have a traceable accounting impact.

---

## Core Principles

### 1. Imported Data Is Sacred

Bank statements are source-of-truth data.

Imported transactions are never rewritten or manipulated.

Instead:

```text
Bank Statement
      ↓
Imported Transaction
      ↓
Classification
      ↓
Ledger Posting
```

This allows the accounting engine to evolve without losing the original financial record.

---

### 2. Accounts Do Not Store Balances

Balances are derived.

```text
Current Balance
    =
Snapshot Balance
    +
Ledger Activity Since Snapshot
```

This eliminates balance drift and keeps calculations auditable.

---

### 3. Every Transaction Must Balance

Ledger uses double-entry accounting.

Example:

Salary Credit

```text
Debit   HDFC Salary Account     ₹100,000
Credit  Salary Income           ₹100,000
```

Example:

Swiggy Order

```text
Debit   Food Expense            ₹250
Credit  HDFC Salary Account     ₹250
```

Every transaction must balance to zero.

Always.

---

### 4. Households Come First

Most finance apps are designed around a single user.

Ledger is designed around households.

```text
Household
│
├── Yash
│   ├── HDFC Salary Account
│   ├── SBI Loan
│   └── HDFC Securities
│
└── Divya
    ├── Savings Account
    └── Zerodha
```

This enables:

* Shared finances
* Individual finances
* Joint ownership
* Household reporting
* Future equity calculations

---

### 5. Transfers Are Not Spending

Moving money between accounts should not inflate expenses.

Examples:

```text
HDFC Savings → SBI Savings
HDFC Savings → Credit Card Payment
HDFC Savings → Cash Wallet
Personal Account → Joint Account
```

These change liquidity.

They do not change net worth.

They do not affect spending reports.

They do not consume budget allocations.

---

### 6. Investments Are Assets, Not Expenses

Buying equity is not spending.

Example:

```text
Buy Infosys Shares
```

Accounting impact:

```text
Investment Asset    +₹100,000
Cash                -₹100,000
```

However:

```text
Brokerage
STT
GST
Exchange Charges
```

are real expenses and are tracked separately.

This distinction is critical for accurate investment reporting.

---

## Architecture

Current architecture:

```text
User
│
└── Household
    │
    ├── Person
    │
    ├── Account
    │
    └── ImportedTransaction
```

Planned architecture:

```text
ImportedTransaction
          │
          ▼
    Posting Engine
          │
          ▼
      Transaction
          │
          ▼
      LedgerEntry
          │
          ▼
       Snapshots
          │
          ▼
   Reporting Layer
```

---

## Technology

### Backend

* FastAPI
* SQLAlchemy
* SQLite
* Alembic

### Frontend

* React
* TypeScript
* Vite

---

## Current Status

### Completed

* Authentication
* Household architecture
* Person model
* Account model
* Account ownership
* Rules engine
* Imported transaction framework
* Database migrations

### In Progress

* Generic bank statement parser
* Transaction import pipeline

### Planned

* Posting engine
* Double-entry ledger
* Transfer engine
* Net worth engine
* Budget engine
* Investment accounting
* Household equity reporting

---

## Long-Term Goal

The goal is not to build another budgeting application.

The goal is to build a financial system that can reconstruct an individual's or household's financial reality from first principles, while remaining understandable, auditable and trustworthy.
