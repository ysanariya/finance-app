import { useEffect, useState } from "react";
import {
  Pencil,
  RefreshCw,
  Plus,
  CheckCircle,
  Circle,
  X,
} from "lucide-react";

import { theme } from "../theme.js";

const formatINR = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Rules() {

  const [rules, setRules]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editingRule, setEditingRule]   = useState(null);
  const [editForm, setEditForm]         = useState({});
  const [reclassifyResults, setReclassifyResults] = useState(null); // null = closed
  const [reclassifying, setReclassifying]         = useState(false);

  const token = localStorage.getItem("token");

  async function fetchRules() {
    try {
      const response = await fetch("http://localhost:8000/rules", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (Array.isArray(data))            setRules(data);
      else if (Array.isArray(data.rules)) setRules(data.rules);
      else                                setRules([]);
    } catch (error) {
      console.error(error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }

  async function reclassifyTransactions() {
    try {
      setReclassifying(true);
      const response = await fetch("http://localhost:8000/rules/reclassify", {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Show results modal with the returned list
      setReclassifyResults(data);
    } catch (error) {
      console.error(error);
      alert("Reclassification failed");
    } finally {
      setReclassifying(false);
    }
  }

  async function saveRuleChanges() {
    try {
      if (editingRule.id) {
        // Edit existing
        const response = await fetch(
          `http://localhost:8000/rules/${editingRule.id}`,
          {
            method:  "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify(editForm),
          }
        );
        if (!response.ok) { alert("Failed to update rule"); return; }
      } else {
        // Create new
        const response = await fetch("http://localhost:8000/rules", {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        });
        const data = await response.json();
        if (!response.ok) { alert(data.detail || "Failed to create rule"); return; }
      }
      await fetchRules();
      setEditingRule(null);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => { fetchRules(); }, []);

  function getTypeColor(type) {
    switch (type?.toLowerCase()) {
      case "income":     return theme.colors.positive;
      case "expense":    return theme.colors.negative;
      case "transfer":   return theme.colors.neutral;
      case "investment": return theme.colors.badge.neutralText;
      case "infer":      return theme.colors.textMuted;
      default:           return theme.colors.textMuted;
    }
  }

  if (loading) {
    return (
      <div style={{ color: theme.colors.textPrimary, padding: "32px", fontFamily: theme.typography.body.fontFamily }}>
        Loading rules...
      </div>
    );
  }

  return (
    <div
      style={{
        padding:    "24px",
        color:      theme.colors.textPrimary,
        background: theme.colors.background,
        minHeight:  "100vh",
      }}
    >

      {/* HEADER */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            margin:        0,
            fontFamily:    theme.typography.heading.fontFamily,
            fontWeight:    theme.typography.heading.fontWeight,
            fontSize:      theme.typography.heading.fontSize,
            letterSpacing: theme.typography.heading.letterSpacing,
            color:         theme.colors.textPrimary,
          }}
        >
          Rules
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontFamily: theme.typography.body.fontFamily, fontSize: theme.typography.body.fontSize }}>
          Manage transaction classification rules
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>

        <button
          onClick={reclassifyTransactions}
          disabled={reclassifying}
          style={{
            background:  "transparent",
            border:      `1px solid ${theme.colors.border}`,
            color:       reclassifying ? theme.colors.textMuted : theme.colors.textPrimary,
            borderRadius: theme.layout.cardRadius,
            padding:     "10px 16px",
            cursor:      reclassifying ? "not-allowed" : "pointer",
            display:     "flex",
            alignItems:  "center",
            gap:         "8px",
            fontFamily:  theme.typography.body.fontFamily,
            fontSize:    theme.typography.body.fontSize,
            opacity:     reclassifying ? 0.6 : 1,
            transition:  "opacity 0.15s",
          }}
        >
          <RefreshCw size={16} style={{ animation: reclassifying ? "spin 1s linear infinite" : "none" }} />
          {reclassifying ? "Reclassifying…" : "Reclassify"}
        </button>

        <button
          onClick={() => {
            setEditingRule({ id: null });
            setEditForm({
              pattern:          "",
              match_type:       "contains",
              merchant:         "",
              category:         "",
              transaction_type: "infer",
              priority:         50,
              is_active:        true,
            });
          }}
          style={{
            background:   theme.colors.positive,
            border:       "none",
            color:        theme.colors.background,
            borderRadius: theme.layout.cardRadius,
            padding:      "10px 16px",
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            gap:          "8px",
            fontFamily:   theme.typography.body.fontFamily,
            fontSize:     theme.typography.body.fontSize,
            fontWeight:   "600",
          }}
        >
          <Plus size={16} />
          New Rule
        </button>

      </div>

      {/* RULES TABLE */}
      <div
        style={{
          background:   theme.colors.card,
          border:       `1px solid ${theme.colors.border}`,
          borderRadius: theme.layout.cardRadius,
          overflow:     "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>

          <thead style={{ background: theme.table.headerBackground }}>
            <tr>
              {["Pattern", "Match", "Merchant", "Category", "Type", "Priority", "Status", "Actions"].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign:     "left",
                    padding:       `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                    color:         theme.table.headerColor,
                    fontFamily:    theme.table.headerFontFamily,
                    fontSize:      theme.table.headerFontSize,
                    fontWeight:    theme.table.headerFontWeight,
                    letterSpacing: theme.table.headerLetterSpacing,
                    textTransform: theme.table.headerTextTransform,
                    borderBottom:  `1px solid ${theme.colors.border}`,
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>

                <td style={{ ...cellStyle, fontWeight: "500" }}>{rule.pattern}</td>

                <td style={{ ...cellStyle, color: theme.colors.textSecondary }}>{rule.match_type}</td>

                <td style={{ ...cellStyle, fontWeight: theme.table.merchantFontWeight, color: theme.table.merchantColor }}>
                  {rule.merchant || "—"}
                </td>

                <td style={cellStyle}>
                  <span style={badgeStyle}>{rule.category || "Uncategorized"}</span>
                </td>

                <td style={cellStyle}>
                  <span
                    style={{
                      background:    `${getTypeColor(rule.transaction_type)}20`,
                      color:         getTypeColor(rule.transaction_type),
                      padding:       `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
                      borderRadius:  theme.table.badgeRadius,
                      fontFamily:    theme.table.badgeFontFamily,
                      fontSize:      theme.table.badgeFontSize,
                      fontWeight:    theme.table.badgeFontWeight,
                      textTransform: "capitalize",
                      display:       "inline-block",
                    }}
                  >
                    {rule.transaction_type || "infer"}
                  </span>
                </td>

                <td style={{ ...cellStyle, fontFamily: theme.table.dateFontFamily, color: theme.colors.textSecondary }}>
                  {rule.priority}
                </td>

                <td style={cellStyle}>
                  <div
                    style={{
                      display:    "flex",
                      alignItems: "center",
                      gap:        "8px",
                      color:      rule.is_active ? theme.colors.positive : theme.colors.textSecondary,
                      fontFamily: theme.table.cellFontFamily,
                      fontSize:   theme.table.cellFontSize,
                    }}
                  >
                    {rule.is_active ? <CheckCircle size={15} /> : <Circle size={15} />}
                    <span>{rule.is_active ? "Active" : "Disabled"}</span>
                  </div>
                </td>

                <td style={cellStyle}>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setEditForm({
                        pattern:          rule.pattern         || "",
                        match_type:       rule.match_type      || "contains",
                        merchant:         rule.merchant        || "",
                        category:         rule.category        || "",
                        transaction_type: rule.transaction_type || "infer",
                        priority:         rule.priority        ?? 50,
                        is_active:        rule.is_active,
                      });
                    }}
                    style={{
                      background:      theme.table.actionBtnBackground,
                      border:          `1px solid ${theme.table.actionBtnBorder}`,
                      color:           theme.colors.textSecondary,
                      borderRadius:    theme.layout.cardRadius,
                      width:           "34px",
                      height:          "34px",
                      cursor:          "pointer",
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* EDIT / NEW RULE MODAL */}
      {editingRule && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, width: "460px" }}>

            <h2 style={modalHeading}>
              {editingRule.id ? "Edit Rule" : "New Rule"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              <input
                value={editForm.pattern}
                onChange={(e) => setEditForm({ ...editForm, pattern: e.target.value })}
                placeholder="Pattern (text to match in description)"
                style={inputStyle}
              />

              <select
                value={editForm.match_type}
                onChange={(e) => setEditForm({ ...editForm, match_type: e.target.value })}
                style={inputStyle}
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact</option>
              </select>

              <input
                value={editForm.merchant}
                onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                placeholder="Merchant name"
                style={inputStyle}
              />

              <input
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                placeholder="Category"
                style={inputStyle}
              />

              <select
                value={editForm.transaction_type}
                onChange={(e) => setEditForm({ ...editForm, transaction_type: e.target.value })}
                style={inputStyle}
              >
                <option value="infer">Infer from bank statement</option>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
                <option value="investment">Investment</option>
              </select>

              <input
                type="number"
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                placeholder="Priority"
                style={inputStyle}
              />

              {editingRule.id && (
                <label
                  style={{
                    display:    "flex",
                    alignItems: "center",
                    gap:        "10px",
                    cursor:     "pointer",
                    color:      theme.colors.textSecondary,
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize:   theme.typography.body.fontSize,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  />
                  Active
                </label>
              )}

              <button
                onClick={saveRuleChanges}
                style={{
                  background:   theme.colors.positive,
                  color:        theme.colors.background,
                  border:       "none",
                  padding:      "14px",
                  borderRadius: "12px",
                  fontFamily:   theme.typography.body.fontFamily,
                  fontWeight:   "600",
                  fontSize:     theme.typography.body.fontSize,
                  cursor:       "pointer",
                  marginTop:    "8px",
                }}
              >
                {editingRule.id ? "Save Changes" : "Save Rule"}
              </button>

              <button
                onClick={() => setEditingRule(null)}
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

      {/* RECLASSIFICATION RESULTS MODAL */}
      {reclassifyResults && (
        <div style={overlayStyle}>
          <div
            style={{
              ...modalStyle,
              width:     "860px",
              maxWidth:  "95vw",
              maxHeight: "85vh",
              display:   "flex",
              flexDirection: "column",
            }}
          >

            {/* Modal header */}
            <div
              style={{
                display:        "flex",
                justifyContent: "space-between",
                alignItems:     "center",
                marginBottom:   "20px",
                flexShrink:     0,
              }}
            >
              <div>
                <h2 style={{ ...modalHeading, margin: 0 }}>Reclassification Complete</h2>
                <p
                  style={{
                    margin:     "6px 0 0",
                    color:      theme.colors.textSecondary,
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize:   theme.typography.body.fontSize,
                  }}
                >
                  {reclassifyResults.updated} transaction{reclassifyResults.updated !== 1 ? "s" : ""} matched a rule
                </p>
              </div>
              <button
                onClick={() => setReclassifyResults(null)}
                style={{
                  background:   "transparent",
                  border:       `1px solid ${theme.colors.border}`,
                  color:        theme.colors.textSecondary,
                  borderRadius: "8px",
                  width:        "36px",
                  height:       "36px",
                  cursor:       "pointer",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  flexShrink:   0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Results table */}
            {reclassifyResults.reclassified?.length > 0 ? (
              <div style={{ overflowY: "auto", flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>

                  <thead
                    style={{
                      position:   "sticky",
                      top:        0,
                      background: theme.table.headerBackground,
                      zIndex:     1,
                    }}
                  >
                    <tr>
                      {["Date", "Description", "Amount", "Rule Matched", "Category", "Merchant"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign:     h === "Amount" ? "right" : "left",
                            padding:       `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                            color:         theme.table.headerColor,
                            fontFamily:    theme.table.headerFontFamily,
                            fontSize:      theme.table.headerFontSize,
                            fontWeight:    theme.table.headerFontWeight,
                            letterSpacing: theme.table.headerLetterSpacing,
                            textTransform: theme.table.headerTextTransform,
                            borderBottom:  `1px solid ${theme.colors.border}`,
                            whiteSpace:    "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {reclassifyResults.reclassified.map((tx, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                      >

                        {/* Date */}
                        <td style={{ ...cellStyle, fontFamily: theme.table.dateFontFamily, color: theme.table.dateColor, whiteSpace: "nowrap" }}>
                          {tx.date}
                        </td>

                        {/* Description */}
                        <td
                          style={{
                            ...cellStyle,
                            color:        theme.table.descriptionColor,
                            fontSize:     theme.table.descriptionFontSize,
                            maxWidth:     "280px",
                            overflow:     "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace:   "nowrap",
                          }}
                        >
                          {tx.description}
                        </td>

                        {/* Amount */}
                        <td
                          style={{
                            ...cellStyle,
                            textAlign:  "right",
                            fontFamily: theme.table.amountFontFamily,
                            fontWeight: theme.table.amountFontWeight,
                            color:      tx.amount < 0 ? theme.table.amountColorExpense : theme.table.amountColorIncome,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatINR(Math.abs(tx.amount))}
                        </td>

                        {/* Rule matched */}
                        <td style={{ ...cellStyle, color: theme.colors.textSecondary, fontFamily: theme.table.dateFontFamily, fontSize: "12px" }}>
                          {tx.matched_rule}
                        </td>

                        {/* Category — show old → new if changed */}
                        <td style={cellStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            {tx.old_category && tx.old_category !== tx.new_category && (
                              <span
                                style={{
                                  ...smallBadge,
                                  background: theme.colors.negativeDim,
                                  color:      theme.colors.textMuted,
                                  textDecoration: "line-through",
                                }}
                              >
                                {tx.old_category}
                              </span>
                            )}
                            <span style={{ ...smallBadge, background: theme.colors.neutralDim, color: theme.colors.neutral }}>
                              {tx.new_category || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Merchant — show old → new if changed */}
                        <td style={{ ...cellStyle, color: theme.table.merchantColor, fontWeight: theme.table.merchantFontWeight }}>
                          {tx.new_merchant || "—"}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            ) : (
              <div
                style={{
                  padding:    "48px",
                  textAlign:  "center",
                  color:      theme.colors.textMuted,
                  fontFamily: theme.typography.body.fontFamily,
                  fontSize:   theme.typography.body.fontSize,
                }}
              >
                No transactions matched any rule.
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
              <button
                onClick={() => setReclassifyResults(null)}
                style={{
                  background:   theme.colors.positive,
                  color:        theme.colors.background,
                  border:       "none",
                  padding:      "12px 24px",
                  borderRadius: "10px",
                  fontFamily:   theme.typography.body.fontFamily,
                  fontWeight:   "600",
                  fontSize:     theme.typography.body.fontSize,
                  cursor:       "pointer",
                }}
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const overlayStyle = {
  position:       "fixed",
  inset:          0,
  background:     "rgba(0,0,0,0.75)",
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  zIndex:         999,
};

const modalStyle = {
  background:   theme.colors.card,
  border:       `1px solid ${theme.colors.border}`,
  borderRadius: "18px",
  padding:      "28px",
};

const modalHeading = {
  marginTop:    0,
  marginBottom: "24px",
  fontFamily:   theme.typography.subheading.fontFamily,
  fontWeight:   theme.typography.subheading.fontWeight,
  fontSize:     "20px",
  color:        theme.colors.textPrimary,
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
  boxSizing:    "border-box",
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

const smallBadge = {
  display:      "inline-block",
  padding:      "2px 7px",
  borderRadius: "999px",
  fontFamily:   theme.table.badgeFontFamily,
  fontSize:     "11px",
  fontWeight:   "500",
};