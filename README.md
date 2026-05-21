# Finance App

A personal finance operating system built using **FastAPI + React**, designed for deep visibility into cashflow, budgeting, spending behavior, and long-term financial trajectory.

The system prioritizes:

* structured financial modeling
* auditability
* historical tracking
* extensible financial analytics

instead of shallow dashboard metrics.


# Core Philosophy

Most finance apps optimize for:

* visual polish
* oversimplified summaries
* hidden calculations
* manual categorization chaos

This project optimizes for:

```text
clarity > convenience
financial modeling > spreadsheets
historical traceability > mutable state
system architecture > feature bloat
```


# Current Capabilities

## Authentication

* JWT-based authentication
* Protected API routes
* Automatic invalid-token logout flow


# Transactions Engine

## Features

* Transaction ingestion
* Merchant tracking
* Categorization pipeline
* Rule-based classification architecture
* Category normalization
* Historical transaction persistence

## Architecture

Transactions act as the system's canonical financial event layer.

Everything derives from transactions:

* budgets
* spending analytics
* category trends
* future scoring systems


# Budgeting System

## Features

* Monthly budgeting
* Annual budgeting
* Date-window budgeting
* Budget version history
* Conflict-aware budget updates
* Immutable budget tracking architecture

## Budget Architecture

Budgets are modeled as:

```text
financial policies
```

—not mutable spreadsheet rows.

Updating a budget:

* archives previous version (`is_deleted = True`)
* inserts new active version
* preserves historical budget evolution

This enables:

* historical budget trend analysis
* future projections
* budget drift analytics
* auditability


## Budget Validation Rules

* Categories are sourced from classified transaction categories
* Free-text categories are disallowed
* Only one active budgeting strategy per category
* Budget conflicts trigger confirmation workflows


# Dashboard

## Current Widgets

* Net Worth Trend
* Cashflow Trend
* Asset Allocation
* KPI Summary Cards
* Category Rankings
* Spending Trends
* Budget Viewer


# Financial Modeling Concepts

## Event-Sourced Thinking

The system distinguishes between:

| Type           | Modeling Strategy |
| -------------- | ----------------- |
| Transactions   | Event-based       |
| Budgets        | Versioned policy  |
| Fixed expenses | Rule-based        |
| Net worth      | Derived state     |

This minimizes redundant storage and enables historical reconstruction.


# Tech Stack

## Backend

* FastAPI
* SQLAlchemy Async ORM
* SQLite
* JWT Authentication
* Pydantic


## Frontend

* React (Vite)
* Recharts
* Context API
* Custom theme architecture
* Modular component system


# Frontend Architecture

```text
src/
├── components/
│   ├── cards/
│   ├── charts/
│   ├── filters/
│   ├── forms/
│   └── tables/
│
├── pages/
├── services/
├── utils/
├── context/
└── theme/
```


# Backend Architecture

```text
backend/
├── routers/
├── models/
├── schemas/
├── services/
└── auth/
```


# Setup

# 1. Clone Repository

```bash
git clone https://github.com/ysanariya/finance-app.git
cd finance-app
```

---

# 2. Backend Setup

```bash
cd backend

python -m venv venv

source venv/bin/activate
# OR
venv\Scripts\activate

pip install -r requirements.txt
```

Create `.env`

```env
SECRET_KEY=your_secret_key_here
```

Run backend:

```bash
uvicorn main:app --reload
```


# 3. Frontend Setup

```bash
cd ../frontend

npm install

npm run dev
```


# 4. Access Application

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8000
```


# Current System Design Decisions

## Why immutable budget history?

Because overwriting financial policies destroys analytical history.

The system instead tracks:

```text
budget evolution over time
```

which enables future:

* forecasting
* behavior analysis
* trend reconstruction


## Why categories come from transactions?

Transactions are the canonical source of financial truth.

Allowing arbitrary budgeting categories creates:

* taxonomy drift
* duplicate semantics
* broken analytics


# Current Limitations

* SQLite still used for local persistence
* No bank API integrations yet (or ever coz RBI, lol)
* No refresh token rotation
* No recurring transaction inference yet
* No forecasting engine yet
* No automated anomaly detection yet


# Planned Roadmap

## Phase 2

### Financial Intelligence Layer

* Budget adherence scoring
* Spending anomaly detection
* Burn-rate prediction
* Monthly trajectory engine
* Savings optimization


## Phase 3

### Wealth Operating System

* Goal planning
* FIRE projections (maybe, maybe not)
* Portfolio integration (with CSV or PDF uploads - no APIs)
* Tax analytics
* Financial simulations


# Design Principles

```text
No fake metrics
No decorative dashboards
No hidden calculations
No black-box finance logic
```

The goal is a transparent financial system that can evolve into a complete personal finance intelligence platform.

---
---
---
---
---

# Author

Built as a long-term systems architecture project focused on financial clarity, behavioral analytics, and compounding visibility. Completely vibe-coded with my distinguished colleagues:

* señor ChatGPT (master of confident overengineering, philosophical tangents, and “technically correct” solutions that somehow create three new problems)
* monsieur Claude (calm architect of elegant abstractions, suspiciously reasonable explanations, and dangerously persuasive refactor suggestions)
* Gemini bhai™ (provider of cosmic confusion, unsolicited enlightenment, and answers that feel spiritually correct but operationally risky)
