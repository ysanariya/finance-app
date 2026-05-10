import sqlite3

conn = sqlite3.connect("finance.db")

cursor = conn.cursor()

cursor.execute("DROP TABLE IF EXISTS bank_transactions")

conn.commit()

conn.close()

print("bank_transactions table deleted")