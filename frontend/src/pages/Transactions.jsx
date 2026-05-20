import { useEffect, useState } from "react";

import { fetchWithAuth } from "../api.js";
import { theme } from "../theme";

export default function Transactions() {

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [showRuleModal, setShowRuleModal] =
    useState(false);

  const [ruleForm, setRuleForm] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const limit = 50;

  // FILTERS

  const [monthFilter, setMonthFilter] =
    useState("");

  const [merchantFilter, setMerchantFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [amountFilter, setAmountFilter] =
    useState("");

  const [searchFilter, setSearchFilter] =
    useState("");

  const totalPages =
    Math.ceil(total / limit);

  const [summary, setSummary] =
    useState(null);

useEffect(() => {

    fetchTransactions();

    fetchSummary();

  }, [
    page,
    monthFilter,
    merchantFilter,
    categoryFilter,
    typeFilter,
    amountFilter,
    searchFilter,
]);

async function fetchSummary() {

    try {

      const data =
        await fetchWithAuth(
          "http://localhost:8000/transactions/summary"
        );

      setSummary(data);

    } catch (err) {

      console.error(
        "Summary fetch failed",
        err
      );
    }
  }


  async function fetchTransactions() {

    try {

      setLoading(true);

      const params =
        new URLSearchParams();

      params.append("page", page);
      params.append("limit", limit);

      if (monthFilter)    params.append("month", monthFilter);
      if (merchantFilter) params.append("merchant", merchantFilter);
      if (categoryFilter) params.append("category", categoryFilter);
      if (typeFilter)     params.append("transaction_type", typeFilter);
      if (amountFilter)   params.append("amount_type", amountFilter);
      if (searchFilter)   params.append("search", searchFilter);

      const data =
        await fetchWithAuth(
          `http://127.0.0.1:8000/transactions?${params.toString()}`
        );

      setTransactions(data.transactions || []);
      setTotal(data.total || 0);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  }

  async function handleUpload() {

    if (!selectedFile) {
      alert("Select a file first");
      return;
    }

    try {

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://127.0.0.1:8000/transactions/upload",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await response.json();

      setUploadMessage(
        `Parsed ${data.parsed} | Inserted ${data.inserted} | Duplicates ${data.duplicates}`
      );

      fetchTransactions();

    } catch (err) {

      console.error(err);
      setUploadMessage("Upload failed");
    }
  }

  function openRuleModal(tx) {

    let merchantGuess = "";

    const description = tx.description.toUpperCase();

    if (description.includes("BLINKIT"))       merchantGuess = "Blinkit";
    else if (description.includes("ZOMATO"))   merchantGuess = "Zomato";
    else if (description.includes("STARBUCKS")) merchantGuess = "Starbucks";
    else if (description.includes("INDIGO"))   merchantGuess = "Indigo";

    setRuleForm({
      pattern:          merchantGuess,
      merchant:         merchantGuess,
      match_type:       "contains",
      category:         "",
      transaction_type: "",
      priority:         50,
    });

    setShowRuleModal(true);
  }

  async function createRule() {

    try {

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://127.0.0.1:8000/rules",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...ruleForm,
            transaction_type:
              ruleForm.transaction_type === ""
                ? null
                : ruleForm.transaction_type,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Failed to create rule");
        return;
      }

      await fetch(
        "http://127.0.0.1:8000/rules/reclassify",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setShowRuleModal(false);
      fetchTransactions();
      alert("Rule created and transactions reclassified");

    } catch (err) {

      console.error(err);
      alert("Failed to create rule");
    }
  }

  function formatCurrency(value) {

    return (
      "₹" +
      Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  return (

    <div
      style={{
        padding: "24px",
        background: theme.colors.background,
        color: theme.colors.textPrimary,
        minHeight: "100vh",
      }}
    >

      {/* HEADER */}

      <div style={{ marginBottom: "24px" }}>

        <h1
          style={{
            margin: 0,
            fontFamily:    theme.typography.heading.fontFamily,
            fontWeight:    theme.typography.heading.fontWeight,
            fontSize:      theme.typography.heading.fontSize,
            letterSpacing: theme.typography.heading.letterSpacing,
            color:         theme.colors.textPrimary,
          }}
        >
          Transactions
        </h1>

        <p
          style={{
            margin: "4px 0 0",
            color:      theme.colors.textSecondary,
            fontFamily: theme.typography.body.fontFamily,
            fontSize:   theme.typography.body.fontSize,
          }}
        >
          Upload, classify and review financial activity
        </p>

      </div>

      {/* UPLOAD */}

      <div
        style={{
          background:    theme.colors.card,
          border:        `1px solid ${theme.colors.border}`,
          borderRadius:  theme.layout.cardRadius,
          padding:       "20px",
          marginBottom:  "16px",
        }}
      >

        <div
          style={{
            fontFamily:   theme.typography.subheading.fontFamily,
            fontWeight:   theme.typography.subheading.fontWeight,
            fontSize:     "15px",
            color:        theme.colors.textPrimary,
            marginBottom: "14px",
          }}
        >
          Upload Bank Statement
        </div>

        <div
          style={{
            display:    "flex",
            gap:        "12px",
            alignItems: "center",
          }}
        >

          <input
            type="file"
            accept=".txt"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{
              color:      theme.colors.textSecondary,
              fontFamily: theme.typography.body.fontFamily,
              fontSize:   "13px",
            }}
          />

          <button
            onClick={handleUpload}
            style={{
              background:   theme.colors.positive,
              color:        theme.colors.background,
              border:       "none",
              padding:      "10px 18px",
              borderRadius: theme.layout.cardRadius,
              fontFamily:   theme.typography.body.fontFamily,
              fontWeight:   600,
              fontSize:     "13px",
              cursor:       "pointer",
              whiteSpace:   "nowrap",
            }}
          >
            Upload Statement
          </button>

        </div>

        {uploadMessage && (
          <div
            style={{
              marginTop:  "12px",
              color:      theme.colors.textSecondary,
              fontFamily: theme.typography.body.fontFamily,
              fontSize:   "13px",
            }}
          >
            {uploadMessage}
          </div>
        )}

      </div>

      {/* KPI CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(5, 1fr)",

          gap: "18px",

          marginBottom: "28px",
        }}
      >

        {/* TOTAL TRANSACTIONS */}
        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              theme.layout.cardRadius,

            padding: "20px",
          }}
        >

          <div
            style={{
              color:
                theme.colors.textSecondary,

              fontSize: "13px",

              fontFamily:
                theme.typography.body.fontFamily,
            }}
          >
            Total Transactions
          </div>

          <div
            style={{
              marginTop: "10px",

              color:
                theme.colors.textPrimary,

              fontSize: "30px",

              fontWeight: 700,

              fontFamily:
                theme.typography.heading.fontFamily,
            }}
          >
            {summary?.total_transactions || 0}
          </div>

          <div
            style={{
              marginTop: "8px",

              color:
                summary?.net_flow >= 0
                  ? theme.colors.positive
                  : theme.colors.negative,

              fontSize: "13px",

              fontFamily:
                theme.typography.body.fontFamily,
            }}
          >
            {summary?.net_flow >= 0 ? "↑" : "↓"}{" "}
            {formatCurrency(summary?.net_flow || 0)}
          </div>

        </div>

        {/* INCOME */}
        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              theme.layout.cardRadius,

            padding: "20px",
          }}
        >

          <div
            style={{
              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            Lifetime Income
          </div>

          <div
            style={{
              marginTop: "10px",

              color:
                theme.colors.positive,

              fontSize: "30px",

              fontWeight: 700,
            }}
          >
            {formatCurrency(summary?.income_total || 0)}
          </div>

          <div
            style={{
              marginTop: "8px",

              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            {summary?.income_count || 0} transactions
          </div>

        </div>

        {/* EXPENSE */}
        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              theme.layout.cardRadius,

            padding: "20px",
          }}
        >

          <div
            style={{
              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            Lifetime Expenses
          </div>

          <div
            style={{
              marginTop: "10px",

              color:
                theme.colors.negative,

              fontSize: "30px",

              fontWeight: 700,
            }}
          >
            {formatCurrency(summary?.expense_total || 0)}
          </div>

          <div
            style={{
              marginTop: "8px",

              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            {summary?.expense_count || 0} transactions
          </div>

        </div>

        {/* CLASSIFIED */}
        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              theme.layout.cardRadius,

            padding: "20px",
          }}
        >

          <div
            style={{
              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            Classified
          </div>

          <div
            style={{
              marginTop: "10px",

              color:
                theme.colors.textPrimary,

              fontSize: "30px",

              fontWeight: 700,
            }}
          >
            {formatCurrency(summary?.classified_total || 0)}
          </div>

          <div
            style={{
              marginTop: "8px",

              color:
                theme.colors.textSecondary,

              fontSize: "13px",
            }}
          >
            {summary?.classified_pct || 0}% of{" "}
            {summary?.total_transactions || 0} transactions
          </div>

        </div>

          {/* NEEDS REVIEW */}
            <div
              style={{
                background:
                  theme.colors.card,

                border:
                  `1px solid ${theme.colors.border}`,

                borderRadius:
                  theme.layout.cardRadius,

                padding: "20px",
              }}
            >

              <div
                style={{
                  color:
                    theme.colors.textSecondary,

                  fontSize: "13px",
                }}
              >
                Needs Review
              </div>

              <div
                style={{
                  marginTop: "10px",

                  color:
                    theme.colors.warning,

                  fontSize: "30px",

                  fontWeight: 700,
                }}
              >
                {formatCurrency(summary?.review_total || 0)}
              </div>

              <div
                style={{
                  marginTop: "8px",

                  color:
                    theme.colors.textSecondary,

                  fontSize: "13px",
                }}
              >
                {summary?.review_pct || 0}% of{" "}
                {summary?.total_transactions || 0} transactions
              </div>

            </div>

          </div>


      {/* FILTERS */}

      <div
        style={{
          background:    theme.colors.card,
          border:        `1px solid ${theme.colors.border}`,
          borderRadius:  theme.layout.cardRadius,
          padding:       "14px 16px",
          display:       "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap:           "10px",
          marginBottom:  "16px",
        }}
      >

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={filterStyle}
        />

        <input
          placeholder="Merchant"
          value={merchantFilter}
          onChange={(e) => setMerchantFilter(e.target.value)}
          style={filterStyle}
        />

        <input
          placeholder="Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={filterStyle}
        />

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={filterStyle}
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
          <option value="investment">Investment</option>
        </select>

        <select
          value={amountFilter}
          onChange={(e) => setAmountFilter(e.target.value)}
          style={filterStyle}
        >
          <option value="">All Amounts</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
          <option value="zero">Zero</option>
        </select>

        <input
          placeholder="Search"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={filterStyle}
        />

      </div>

      {/* TABLE */}

      <div
        style={{
          background:   theme.table.background,
          border:       `1px solid ${theme.colors.border}`,
          borderRadius: theme.table.outerRadius,
          overflow:     "hidden",
        }}
      >

        <table
          style={{
            width:           "100%",
            borderCollapse:  "collapse",
          }}
        >

          <thead
            style={{
              background:   theme.table.headerBackground,
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >

            <tr>

              {["Date", "Description", "Merchant", "Category", "Type", "Amount"].map(
                (header) => (

                  <th
                    key={header}
                    style={{
                      color:          theme.table.headerColor,
                      fontFamily:     theme.table.headerFontFamily,
                      fontSize:       theme.table.headerFontSize,
                      fontWeight:     theme.table.headerFontWeight,
                      letterSpacing:  theme.table.headerLetterSpacing,
                      textTransform:  theme.table.headerTextTransform,
                      padding:        `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                      textAlign:      header === "Amount" ? "right" : "left",
                    }}
                  >
                    {header}
                  </th>

                )
              )}

            </tr>

          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding:    "32px 20px",
                    color:      theme.table.emptyColor,
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize:   theme.table.emptyFontSize,
                  }}
                >
                  Loading...
                </td>
              </tr>

            ) : (

              transactions.map((tx) => {

                const isUnclassified = !tx.category;

                return (

                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.border}`,
                      background:   isUnclassified
                        ? "rgba(224,185,74,0.04)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.table.rowHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isUnclassified
                        ? "rgba(224,185,74,0.04)"
                        : "transparent";
                    }}
                  >

                    {/* Date */}
                    <td
                      style={{
                        ...cellStyle,
                        fontFamily: theme.table.dateFontFamily,
                        fontSize:   theme.table.dateFontSize,
                        color:      theme.table.dateColor,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(tx.recorded_at).toLocaleDateString()}
                    </td>

                    {/* Description */}
                    <td
                      style={{
                        ...cellStyle,
                        color:        theme.table.descriptionColor,
                        fontSize:     theme.table.descriptionFontSize,
                        fontFamily:   theme.table.descriptionFontFamily,
                        maxWidth:     theme.table.descriptionMaxWidth,
                        overflow:     "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace:   "nowrap",
                      }}
                    >
                      {tx.description}
                    </td>

                    {/* Merchant */}
                    <td
                      style={{
                        ...cellStyle,
                        color:      theme.table.merchantColor,
                        fontWeight: theme.table.merchantFontWeight,
                      }}
                    >
                      {tx.merchant || (
                        <span style={{ color: theme.colors.textMuted }}>—</span>
                      )}
                    </td>

                    {/* Category */}
                    <td style={cellStyle}>

                      {tx.category ? (

                        <span style={badgeStyle}>
                          {tx.category}
                        </span>

                      ) : (

                        <div
                          style={{
                            display:       "flex",
                            flexDirection: "column",
                            alignItems:    "flex-start",
                            gap:           "6px",
                          }}
                        >

                          <span
                            style={{
                              background:   "rgba(224,185,74,0.12)",
                              color:        "#E0B94A",
                              padding:      `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
                              borderRadius: theme.table.badgeRadius,
                              fontFamily:   theme.table.badgeFontFamily,
                              fontSize:     theme.table.badgeFontSize,
                              fontWeight:   theme.table.badgeFontWeight,
                              display:      "inline-block",
                            }}
                          >
                            Unclassified
                          </span>

                          <button
                            onClick={() => openRuleModal(tx)}
                            style={{
                              background:   theme.table.actionBtnBackground,
                              color:        theme.table.actionBtnColor,
                              border:       `1px solid ${theme.table.actionBtnBorder}`,
                              padding:      "3px 10px",
                              borderRadius: theme.table.actionBtnRadius,
                              cursor:       "pointer",
                              fontFamily:   theme.table.badgeFontFamily,
                              fontSize:     theme.table.actionBtnFontSize,
                            }}
                          >
                            + Rule
                          </button>

                        </div>

                      )}

                    </td>

                    {/* Type */}
                    <td
                      style={{
                        ...cellStyle,
                        color:
                          tx.transaction_type === "income"
                            ? theme.colors.positive
                            : tx.transaction_type === "expense"
                            ? theme.colors.negative
                            : theme.colors.textSecondary,
                        fontWeight:    "500",
                        textTransform: "capitalize",
                      }}
                    >
                      {tx.transaction_type || "—"}
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        ...cellStyle,
                        textAlign:  "right",
                        color:      tx.amount > 0
                          ? theme.table.amountColorIncome
                          : theme.table.amountColorExpense,
                        fontWeight: theme.table.amountFontWeight,
                        fontSize:   theme.table.amountFontSize,
                        fontFamily: theme.table.amountFontFamily,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatCurrency(Math.abs(tx.amount))}
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}

      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          marginTop:      "16px",
        }}
      >

        <div
          style={{
            color:      theme.colors.textMuted,
            fontFamily: theme.typography.body.fontFamily,
            fontSize:   "12px",
          }}
        >
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{
              ...paginationBtn,
              opacity: page === 1 ? 0.35 : 1,
              cursor:  page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ← Previous
          </button>

          <div
            style={{
              padding:      "8px 14px",
              background:   theme.colors.card,
              border:       `1px solid ${theme.colors.border}`,
              borderRadius: theme.layout.cardRadius,
              fontFamily:   theme.table.dateFontFamily,
              fontSize:     "12px",
              color:        theme.colors.textSecondary,
            }}
          >
            {page} / {totalPages}
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              ...paginationBtn,
              opacity: page >= totalPages ? 0.35 : 1,
              cursor:  page >= totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next →
          </button>

        </div>

      </div>

      {/* CREATE RULE MODAL */}

      {showRuleModal && ruleForm && (

        <div
          style={{
            position:        "fixed",
            inset:           0,
            background:      "rgba(0,0,0,0.75)",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            zIndex:          999,
          }}
        >

          <div
            style={{
              width:        "460px",
              background:   theme.colors.card,
              border:       `1px solid ${theme.colors.border}`,
              borderRadius: "18px",
              padding:      "28px",
            }}
          >

            <h2
              style={{
                marginTop:    0,
                marginBottom: "24px",
                fontFamily:   theme.typography.subheading.fontFamily,
                fontWeight:   theme.typography.subheading.fontWeight,
                fontSize:     "20px",
                color:        theme.colors.textPrimary,
              }}
            >
              Create Rule
            </h2>

            <div
              style={{
                display:       "flex",
                flexDirection: "column",
                gap:           "14px",
              }}
            >

              <input
                placeholder="Pattern"
                value={ruleForm.pattern}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, pattern: e.target.value })
                }
                style={inputStyle}
              />

              <input
                placeholder="Merchant"
                value={ruleForm.merchant}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, merchant: e.target.value })
                }
                style={inputStyle}
              />

              <input
                placeholder="Category"
                value={ruleForm.category}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, category: e.target.value })
                }
                style={inputStyle}
              />

              <select
                value={ruleForm.transaction_type}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, transaction_type: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">Infer from bank statement</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
                <option value="investment">Investment</option>
              </select>

              <input
                type="number"
                placeholder="Priority"
                value={ruleForm.priority}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, priority: Number(e.target.value) })
                }
                style={inputStyle}
              />

              <button
                onClick={createRule}
                style={{
                  background:   theme.colors.positive,
                  color:        theme.colors.background,
                  border:       "none",
                  padding:      "14px",
                  borderRadius: "12px",
                  fontFamily:   theme.typography.body.fontFamily,
                  fontWeight:   600,
                  fontSize:     theme.typography.body.fontSize,
                  cursor:       "pointer",
                  marginTop:    "8px",
                }}
              >
                Save Rule
              </button>

              <button
                onClick={() => setShowRuleModal(false)}
                style={{
                  background:   "transparent",
                  color:        theme.colors.textSecondary,
                  border:       `1px solid ${theme.colors.border}`,
                  padding:      "14px",
                  borderRadius: "12px",
                  fontFamily:   theme.typography.body.fontFamily,
                  fontSize:     theme.typography.body.fontSize,
                  cursor:       "pointer",
                }}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const filterStyle = {
  background:   theme.colors.cardAlt,
  border:       `1px solid ${theme.colors.border}`,
  color:        theme.colors.textPrimary,
  padding:      "9px 12px",
  borderRadius: theme.layout.cardRadius,
  fontFamily:   theme.typography.body.fontFamily,
  fontSize:     "13px",
  outline:      "none",
  width:        "100%",
};

const inputStyle = {
  background:   theme.colors.cardAlt,
  border:       `1px solid ${theme.colors.border}`,
  color:        theme.colors.textPrimary,
  padding:      "12px",
  borderRadius: "10px",
  fontFamily:   theme.typography.body.fontFamily,
  fontSize:     "14px",
  outline:      "none",
  width:        "100%",
};

const paginationBtn = {
  background:   theme.colors.card,
  border:       `1px solid ${theme.colors.border}`,
  color:        theme.colors.textSecondary,
  padding:      "8px 16px",
  borderRadius: theme.layout.cardRadius,
  fontFamily:   theme.typography.body.fontFamily,
  fontSize:     "13px",
};

const cellStyle = {
  padding:    `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
  color:      theme.table.cellColor,
  fontFamily: theme.table.cellFontFamily,
  fontSize:   theme.table.cellFontSize,
  lineHeight: theme.table.cellLineHeight,
};

const badgeStyle = {
  background:   theme.colors.badge.neutralBg,
  color:        theme.colors.badge.neutralText,
  borderRadius: theme.table.badgeRadius,
  padding:      `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
  fontFamily:   theme.table.badgeFontFamily,
  fontSize:     theme.table.badgeFontSize,
  fontWeight:   theme.table.badgeFontWeight,
  display:      "inline-block",
};