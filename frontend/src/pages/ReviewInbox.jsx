import { useEffect, useState } from "react";
import { fetchWithAuth } from "../services/api";
import { theme } from "../theme/theme";
import ScreenPeriodControl from "../components/filters/ScreenPeriodControl";
import { useScreenDateRange } from "../hooks/useScreenDateRange";

const formatINR = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ReviewInbox() {
  const dateRange = useScreenDateRange(
    "reviewInbox",
    "current_financial_year",
  );

  const [transactions, setTransactions]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [page, setPage]                   = useState(1);
  const [total, setTotal]                 = useState(0);
  const [kpis, setKpis]                   = useState(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleForm, setRuleForm]           = useState(null);
  const [editing, setEditing]             = useState({});

  const limit      = 50;
  const totalPages = Math.ceil(total / limit);

  // ── Data loading ─────────────────────────────────────────────────────────────

  async function loadData() {
    try {
      setLoading(true);

      const params = dateRange.queryParams;

      const query = params.toString();

      const res = await fetchWithAuth(
        `http://localhost:8000/transactions/review?page=${page}&limit=${limit}${query ? `&${query}` : ""}`
      );

      setTransactions(res?.transactions || []);
      setTotal(res?.total || 0);
      setKpis(res?.kpis   || null);
    } catch (err) {
      console.error("Review Inbox error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [dateRange.start, dateRange.end, page]);
  useEffect(() => { setPage(1); }, [dateRange.start, dateRange.end]);

  // ── Rule helpers ──────────────────────────────────────────────────────────────

  function openRuleModal(tx) {
    const merchant = editing?.[tx.id]?.merchant         ?? tx.merchant         ?? "";
    const category = editing?.[tx.id]?.category         ?? tx.category         ?? "";
    const type     = editing?.[tx.id]?.transaction_type ?? tx.transaction_type ?? "";

    setRuleForm({
      pattern:          merchant,
      merchant:         merchant,
      match_type:       "contains",
      category:         category,
      transaction_type: type,
      priority:         100,
    });

    setShowRuleModal(true);
  }

  async function createRule() {
    try {
      const token = localStorage.getItem("token");

      // 1. Create the rule
      const ruleRes = await fetch("http://localhost:8000/rules", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...ruleForm,
          transaction_type:
            ruleForm.transaction_type === "" ? null : ruleForm.transaction_type,
        }),
      });

      const ruleData = await ruleRes.json();

      if (!ruleRes.ok) {
        alert(ruleData.detail || "Failed to create rule");
        return;
      }

      // 2. Immediately reclassify all transactions using the new rule
      await fetch("http://localhost:8000/rules/reclassify", {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowRuleModal(false);
      loadData();
      alert("Rule created and transactions reclassified");
    } catch (err) {
      console.error("Rule creation failed", err);
      alert("Failed to create rule");
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ color: theme.colors.textSecondary, padding: "24px", fontFamily: theme.typography.body.fontFamily }}>
        Loading review queue...
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        padding:    "24px",
        background: theme.colors.background,
        color:      theme.colors.textPrimary,
        minHeight:  "100vh",
      }}
    >

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              margin:        0,
              color:         theme.colors.textPrimary,
              fontFamily:    theme.typography.heading.fontFamily,
              fontSize:      theme.typography.heading.fontSize,
              fontWeight:    theme.typography.heading.fontWeight,
              letterSpacing: theme.typography.heading.letterSpacing,
            }}
          >
            Review Inbox
          </h1>
          <div
            style={{
              marginTop:  "6px",
              color:      theme.colors.textSecondary,
              fontFamily: theme.typography.body.fontFamily,
              fontSize:   theme.typography.body.fontSize,
            }}
          >
            Transactions requiring review or classification
          </div>
          <div
            style={{
              marginTop: "6px",
              color: theme.colors.textMuted,
              fontFamily: theme.typography.caption.fontFamily,
              fontSize: theme.typography.caption.fontSize,
            }}
          >
            Reviewing: {dateRange.label}
          </div>
        </div>

        <ScreenPeriodControl range={dateRange} />
      </div>

      {/* KPI ROW */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 "18px",
          marginBottom:        "24px",
        }}
      >
        <div style={kpiCard}>
          <div style={kpiLabel}>Transactions Need Review</div>
          <div style={kpiValue}>{kpis?.needs_review_count || 0}</div>
        </div>

        <div style={kpiCard}>
          <div style={kpiLabel}>Uncategorized Spend</div>
          <div style={{ ...kpiValue, color: theme.colors.negative }}>
            {formatINR(kpis?.uncategorized_spend || 0)}
          </div>
        </div>

        <div style={kpiCard}>
          <div style={kpiLabel}>New Since Last Upload</div>
          <div style={kpiValue}>{kpis?.new_since_upload || 0}</div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div
        style={{
          background:   theme.colors.card,
          border:       `1px solid ${theme.colors.border}`,
          borderRadius: theme.table.outerRadius,
          overflow:     "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead>
            <tr
              style={{
                background:   theme.table.headerBackground,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              {["Date", "Description", "Merchant", "Category", "Type", "Amount", "Source", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    color:         theme.table.headerColor,
                    fontFamily:    theme.table.headerFontFamily,
                    fontSize:      theme.table.headerFontSize,
                    fontWeight:    theme.table.headerFontWeight,
                    letterSpacing: theme.table.headerLetterSpacing,
                    textTransform: theme.table.headerTextTransform,
                    padding:       `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                    textAlign:     h === "Amount" ? "right" : "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                style={{ borderBottom: `1px solid ${theme.colors.border}`, transition: "background 0.12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = theme.table.rowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >

                {/* DATE */}
                <td style={{ ...cellStyle, fontFamily: theme.table.dateFontFamily, fontSize: theme.table.dateFontSize, color: theme.table.dateColor }}>
                  {tx.date}
                </td>

                {/* DESCRIPTION */}
                <td
                  style={{
                    ...cellStyle,
                    color:        theme.table.descriptionColor,
                    fontFamily:   theme.table.descriptionFontFamily,
                    fontSize:     theme.table.descriptionFontSize,
                    maxWidth:     theme.table.descriptionMaxWidth,
                    overflow:     "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {tx.description}
                </td>

                {/* MERCHANT */}
                <td style={{ ...cellStyle, color: theme.table.merchantColor, fontWeight: theme.table.merchantFontWeight }}>
                  {tx.merchant || "—"}
                </td>

                {/* CATEGORY */}
                <td style={cellStyle}>
                  <span
                    style={{
                      display:      "inline-block",
                      padding:      `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
                      borderRadius: "999px",
                      background:   tx.category === "Unclassified" ? theme.colors.negativeDim : theme.colors.neutralDim,
                      color:        tx.category === "Unclassified" ? theme.colors.negative    : theme.colors.neutral,
                      fontFamily:   theme.table.badgeFontFamily,
                      fontSize:     theme.table.badgeFontSize,
                      fontWeight:   theme.table.badgeFontWeight,
                    }}
                  >
                    {tx.category || "Unclassified"}
                  </span>
                </td>

                {/* TYPE */}
                <td
                  style={{
                    ...cellStyle,
                    color:
                      tx.transaction_type === "income"  ? theme.colors.positive :
                      tx.transaction_type === "expense" ? theme.colors.negative :
                      theme.colors.textSecondary,
                    fontWeight:    "500",
                    textTransform: "capitalize",
                  }}
                >
                  {tx.transaction_type || "—"}
                </td>

                {/* AMOUNT */}
                <td
                  style={{
                    ...cellStyle,
                    textAlign:  "right",
                    fontFamily: theme.table.amountFontFamily,
                    fontSize:   theme.table.amountFontSize,
                    fontWeight: theme.table.amountFontWeight,
                    color:      tx.amount < 0 ? theme.table.amountColorExpense : theme.table.amountColorIncome,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatINR(Math.abs(tx.amount))}
                </td>

                {/* SOURCE */}
                <td style={cellStyle}>
                  <span
                    style={{
                      display:      "inline-block",
                      padding:      `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
                      borderRadius: "999px",
                      background:   tx.classification_source === "infer" ? theme.colors.neutralDim      : theme.colors.badge.mutedBg,
                      color:        tx.classification_source === "infer" ? theme.colors.neutral         : theme.colors.badge.mutedText,
                      fontFamily:   theme.table.badgeFontFamily,
                      fontSize:     theme.table.badgeFontSize,
                      fontWeight:   theme.table.badgeFontWeight,
                    }}
                  >
                    {tx.classification_source || "unknown"}
                  </span>
                </td>

                {/* ACTIONS */}
                <td style={cellStyle}>
                  <button
                    onClick={() => openRuleModal(tx)}
                    style={actionBtn}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background   = theme.table.actionBtnHoverBg;
                      e.currentTarget.style.color        = theme.table.actionBtnHoverColor;
                      e.currentTarget.style.borderColor  = theme.table.actionBtnHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background   = theme.table.actionBtnBackground;
                      e.currentTarget.style.color        = theme.table.actionBtnColor;
                      e.currentTarget.style.borderColor  = theme.table.actionBtnBorder;
                    }}
                  >
                    + Rule
                  </button>
                </td>

              </tr>
            ))}
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
        <div style={{ color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily, fontSize: "12px" }}>
          Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            style={{ ...paginationBtn, opacity: page === 1 ? 0.35 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
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
            style={{ ...paginationBtn, opacity: page >= totalPages ? 0.35 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* CREATE RULE MODAL */}
      {showRuleModal && ruleForm && (
        <div
          style={{
            position:       "fixed",
            inset:          0,
            background:     "rgba(0,0,0,0.75)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            zIndex:         999,
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

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <input
                placeholder="Pattern (text to match in description)"
                value={ruleForm.pattern}
                onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                style={inputStyle}
              />

              <input
                placeholder="Merchant name"
                value={ruleForm.merchant}
                onChange={(e) => setRuleForm({ ...ruleForm, merchant: e.target.value })}
                style={inputStyle}
              />

              <input
                placeholder="Category"
                value={ruleForm.category}
                onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                style={inputStyle}
              />

              <select
                value={ruleForm.transaction_type}
                onChange={(e) => setRuleForm({ ...ruleForm, transaction_type: e.target.value })}
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
                onChange={(e) => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })}
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

const cellStyle = {
  padding:    `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
  color:      theme.table.cellColor,
  fontFamily: theme.table.cellFontFamily,
  fontSize:   theme.table.cellFontSize,
  lineHeight: theme.table.cellLineHeight,
};

const actionBtn = {
  background:   theme.table.actionBtnBackground,
  color:        theme.table.actionBtnColor,
  border:       `1px solid ${theme.table.actionBtnBorder}`,
  padding:      "3px 10px",
  borderRadius: theme.table.actionBtnRadius,
  cursor:       "pointer",
  fontFamily:   theme.table.badgeFontFamily,
  fontSize:     theme.table.actionBtnFontSize,
  transition:   "all 0.15s ease",
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

const inputStyle = {
  background:  theme.colors.cardAlt,
  border:      `1px solid ${theme.colors.border}`,
  color:       theme.colors.textPrimary,
  padding:     "12px",
  borderRadius: "10px",
  fontFamily:  theme.typography.body.fontFamily,
  fontSize:    "14px",
  outline:     "none",
  width:       "100%",
  boxSizing:   "border-box",
};

const kpiCard = {
  background:   theme.colors.card,
  border:       `1px solid ${theme.colors.border}`,
  borderRadius: theme.layout.cardRadius,
  padding:      "20px",
};

const kpiLabel = {
  color:      theme.colors.textSecondary,
  fontFamily: theme.typography.body.fontFamily,
  fontSize:   "13px",
};

const kpiValue = {
  marginTop:  "10px",
  color:      theme.colors.textPrimary,
  fontFamily: theme.typography.heading.fontFamily,
  fontSize:   "30px",
  fontWeight: 700,
};
