# 💰 Finance App

A personal finance tracking system built with **FastAPI + React**, focused on giving clear visibility into net worth, cashflow, and financial health.

This is not a budgeting app.
It is a **system to understand how money moves and compounds over time**.

---

## 🚀 Features

### Core

* Track **Assets & Liabilities** with time-based snapshots
* Compute **Net Worth over time**
* Record **Income events**
* Define **Fixed Expenses (recurring rules)**
* Generate **Cashflow (income - expenses)**

---

### Dashboard

* 📈 Net Worth Trend (event-based)
* 📊 Cashflow Trend (monthly)
* 🧮 Asset Allocation (donut chart)
* 📉 Surplus tracking

---

### Architecture Highlights

* Clean separation via **FastAPI routers**
* Async DB access with **SQLAlchemy**
* Rule-based modeling for recurring expenses
* Derived metrics (no redundant storage)

---

## 🛠️ Tech Stack

### Backend

* FastAPI
* SQLAlchemy (async)
* SQLite
* JWT Authentication

### Frontend

* React (Vite)
* Recharts (charts)
* Custom theme system

---

## ⚙️ Setup

### 1. Clone repo

```bash
git clone https://github.com/ysanariya/finance-app.git
cd finance-app
```

---

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Create `.env`:

```env
SECRET_KEY=your_secret_key_here
```

Run server:

```bash
uvicorn main:app --reload
```

---

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

---

### 4. Access app

```
Frontend: http://localhost:5173
Backend:  http://localhost:8000
```

---

## 🔐 Authentication

* JWT-based login system
* Token stored in local storage
* Protected routes via Bearer token

---

## 📊 Key Concepts

### Event vs Rule Modeling

* **Income** → event-based
* **Fixed Expenses** → rule-based
* **Cashflow** → computed dynamically

This avoids data duplication and keeps the system flexible.

---

### Net Worth Calculation

```
Net Worth = Total Assets - Total Liabilities
```

Latest values per asset/liability are derived using subqueries.

---

## ⚠️ Known Limitations

* No transaction ingestion yet (manual inputs only)
* No refresh tokens (session expires after ~30 min)
* Some frontend values still being wired dynamically
* Performance not optimized for large datasets yet

---

## 🔜 Roadmap

### Phase 2 (next focus)

* Transaction model
* Bank statement ingestion (HDFC)
* Auto categorization engine

### Phase 3

* Full cashflow engine (fixed + variable)
* Financial health scoring
* Insights layer

---

## 🧠 Why this project?

Most finance apps:

* hide logic
* oversimplify data
* focus on UI over understanding

This project focuses on:

```
clarity > convenience
structure > clutter
insight > dashboards
```

---

## 📌 Author

Built for personal use and learning.
Contributions and feedback welcome.

---
