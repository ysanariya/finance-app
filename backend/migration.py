# scripts/migrate_rules.py

import sqlite3
from pathlib import Path

FINANCE_DB = "finance.db"
RULES_DB = "rules.db"

Path("data").mkdir(exist_ok=True)

finance_conn = sqlite3.connect(FINANCE_DB)
rules_conn = sqlite3.connect(RULES_DB)

finance_cur = finance_conn.cursor()
rules_cur = rules_conn.cursor()

rules_cur.execute("""
CREATE TABLE IF NOT EXISTS transaction_rules (
    id INTEGER PRIMARY KEY,
    pattern TEXT NOT NULL,
    match_type TEXT NOT NULL,
    merchant TEXT,
    transaction_type TEXT,
    category TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME
)
""")

rows = finance_cur.execute("""
SELECT
    id,
    pattern,
    match_type,
    merchant,
    transaction_type,
    category,
    priority,
    is_active,
    created_at
FROM transaction_rules
""").fetchall()

rules_cur.executemany("""
INSERT INTO transaction_rules (
    id,
    pattern,
    match_type,
    merchant,
    transaction_type,
    category,
    priority,
    is_active,
    created_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", rows)

rules_conn.commit()

print(f"Migrated {len(rows)} rules")

finance_conn.close()
rules_conn.close()