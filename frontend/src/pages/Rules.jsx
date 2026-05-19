import { useEffect, useState } from "react";
import {
  Pencil,
  RefreshCw,
  Plus,
  CheckCircle,
  Circle
} from "lucide-react";

import { theme } from "../theme.js";

export default function Rules() {

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({});

  const token = localStorage.getItem("token");

  async function fetchRules() {

    try {

      const response = await fetch(
        "http://localhost:8000/rules",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (Array.isArray(data)) {
        setRules(data);
      } else if (Array.isArray(data.rules)) {
        setRules(data.rules);
      } else {
        setRules([]);
      }

    } catch (error) {

      console.error(error);
      setRules([]);

    } finally {

      setLoading(false);
    }
  }

  async function reclassifyTransactions() {

    try {

      await fetch(
        "http://localhost:8000/rules/reclassify",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Transactions reclassified");

    } catch (error) {

      console.error(error);
    }
  }

  useEffect(() => {

    fetchRules();

  }, []);

  function getTypeColor(type) {

    switch (type?.toLowerCase()) {

      case "income":
        return theme.colors.positive;

      case "expense":
        return theme.colors.negative;

      case "transfer":
        return theme.colors.neutral;

      case "infer":
        return theme.colors.badge.neutralText;

      default:
        return theme.colors.textMuted;
    }
  }

  if (loading) {

    return (
      <div
        style={{
          color: theme.colors.textPrimary,
          padding: "32px",
          fontFamily: theme.typography.body.fontFamily,
        }}
      >
        Loading rules...
      </div>
    );
  }

  async function saveRuleChanges() {

    try {

      const response = await fetch(
        `http://localhost:8000/rules/${editingRule.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(editForm)
        }
      );

      if (!response.ok) {
        alert("Failed to update rule");
        return;
      }

      await fetchRules();

      setEditingRule(null);

    } catch (error) {

      console.error(error);
    }
  }

  return (

    <div
      style={{
        padding: "24px",
        color: theme.colors.textPrimary,
        background: theme.colors.background,
        minHeight: "100vh",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontFamily: theme.typography.heading.fontFamily,
            fontWeight: theme.typography.heading.fontWeight,
            fontSize: theme.typography.heading.fontSize,
            letterSpacing: theme.typography.heading.letterSpacing,
            color: theme.colors.textPrimary,
          }}
        >
          Rules
        </h1>

        <p
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.typography.body.fontFamily,
            fontSize: theme.typography.body.fontSize,
          }}
        >
          Manage transaction classification rules
        </p>

      </div>

      {/* ACTION BUTTONS */}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >

        <button
          onClick={reclassifyTransactions}
          style={{
            background: "transparent",
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
            borderRadius: theme.layout.cardRadius,
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: theme.typography.body.fontFamily,
            fontSize: theme.typography.body.fontSize,
          }}
        >
          <RefreshCw size={16} />
          Reclassify
        </button>

        <button
          onClick={() => {
            setEditingRule({ id: null });
            setEditForm({
              pattern: "",
              match_type: "contains",
              merchant: "",
              category: "",
              transaction_type: "infer",
              priority: 50,
              is_active: true,
            });
          }}
          style={{
            background: theme.colors.positive,
            border: "none",
            color: theme.colors.background,
            borderRadius: theme.layout.cardRadius,
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: theme.typography.body.fontFamily,
            fontSize: theme.typography.body.fontSize,
            fontWeight: "600",
          }}
        >
          <Plus size={16} />
          New Rule
        </button>

      </div>

      {/* TABLE */}

      <div
        style={{
          background: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.layout.cardRadius,
          overflow: "hidden",
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >

          <thead
            style={{
              background: theme.table.headerBackground,
            }}
          >

            <tr>

              {[
                "Pattern",
                "Match",
                "Merchant",
                "Category",
                "Type",
                "Priority",
                "Status",
                "Actions",
              ].map((header) => (

                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                    fontFamily: theme.table.headerFontFamily,
                    fontSize: theme.table.headerFontSize,
                    fontWeight: theme.table.headerFontWeight,
                    letterSpacing: theme.table.headerLetterSpacing,
                    textTransform: theme.table.headerTextTransform,
                    color: theme.table.headerColor,
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {header}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {rules.map((rule) => (

              <tr
                key={rule.id}
                style={{
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >

                {/* Pattern */}
                <td style={{ ...cellStyle, fontWeight: "500" }}>
                  {rule.pattern}
                </td>

                {/* Match */}
                <td style={{ ...cellStyle, color: theme.colors.textSecondary }}>
                  {rule.match_type}
                </td>

                {/* Merchant */}
                <td style={{ ...cellStyle, fontWeight: theme.table.merchantFontWeight, color: theme.table.merchantColor }}>
                  {rule.merchant || "-"}
                </td>

                {/* Category */}
                <td style={cellStyle}>
                  <span style={badgeStyle}>
                    {rule.category || "Uncategorized"}
                  </span>
                </td>

                {/* Type */}
                <td style={cellStyle}>
                  <span
                    style={{
                      background: `${getTypeColor(rule.transaction_type)}20`,
                      color: getTypeColor(rule.transaction_type),
                      padding: `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
                      borderRadius: theme.table.badgeRadius,
                      fontFamily: theme.table.badgeFontFamily,
                      fontSize: theme.table.badgeFontSize,
                      fontWeight: theme.table.badgeFontWeight,
                      textTransform: "capitalize",
                      display: "inline-block",
                    }}
                  >
                    {rule.transaction_type || "infer"}
                  </span>
                </td>

                {/* Priority */}
                <td
                  style={{
                    ...cellStyle,
                    fontFamily: theme.table.dateFontFamily,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {rule.priority}
                </td>

                {/* Status */}
                <td style={cellStyle}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: rule.is_active
                        ? theme.colors.positive
                        : theme.colors.textSecondary,
                      fontFamily: theme.table.cellFontFamily,
                      fontSize: theme.table.cellFontSize,
                    }}
                  >
                    {rule.is_active
                      ? <CheckCircle size={15} />
                      : <Circle size={15} />
                    }
                    <span>
                      {rule.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td style={cellStyle}>
                  <button
                    onClick={() => {
                      setEditingRule(rule);
                      setEditForm({
                        pattern: rule.pattern || "",
                        match_type: rule.match_type || "contains",
                        merchant: rule.merchant || "",
                        category: rule.category || "",
                        transaction_type: rule.transaction_type || "infer",
                        priority: rule.priority || 50,
                        is_active: rule.is_active,
                      });
                    }}
                    style={{
                      background: theme.table.actionBtnBackground,
                      border: `1px solid ${theme.table.actionBtnBorder}`,
                      color: theme.colors.textSecondary,
                      borderRadius: theme.layout.cardRadius,
                      width: "34px",
                      height: "34px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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

        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >

          <div
            style={{
              width: "460px",
              background: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "18px",
              padding: "28px",
            }}
          >

            <h2
              style={{
                marginTop: 0,
                marginBottom: "24px",
                fontFamily: theme.typography.subheading.fontFamily,
                fontWeight: theme.typography.subheading.fontWeight,
                fontSize: "20px",
                color: theme.colors.textPrimary,
              }}
            >
              {editingRule.id ? "Edit Rule" : "New Rule"}
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >

              <input
                value={editForm.pattern}
                onChange={(e) =>
                  setEditForm({ ...editForm, pattern: e.target.value })
                }
                placeholder="Pattern"
                style={inputStyle}
              />

              <input
                value={editForm.merchant}
                onChange={(e) =>
                  setEditForm({ ...editForm, merchant: e.target.value })
                }
                placeholder="Merchant"
                style={inputStyle}
              />

              <input
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                placeholder="Category"
                style={inputStyle}
              />

              <select
                value={editForm.transaction_type}
                onChange={(e) =>
                  setEditForm({ ...editForm, transaction_type: e.target.value })
                }
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
                onChange={(e) =>
                  setEditForm({ ...editForm, priority: Number(e.target.value) })
                }
                placeholder="Priority"
                style={inputStyle}
              />

              <button
                onClick={saveRuleChanges}
                style={{
                  background: theme.colors.positive,
                  color: theme.colors.background,
                  border: "none",
                  padding: "14px",
                  borderRadius: "12px",
                  fontFamily: theme.typography.body.fontFamily,
                  fontWeight: "600",
                  fontSize: theme.typography.body.fontSize,
                  cursor: "pointer",
                  marginTop: "8px",
                }}
              >
                {editingRule.id ? "Save Changes" : "Save Rule"}
              </button>

              <button
                onClick={() => setEditingRule(null)}
                style={{
                  background: "transparent",
                  color: theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`,
                  padding: "14px",
                  borderRadius: "12px",
                  fontFamily: theme.typography.body.fontFamily,
                  fontSize: theme.typography.body.fontSize,
                  cursor: "pointer",
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

// ── Shared style constants (mirrors Transactions.jsx) ────────────────────────

const inputStyle = {
  background: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  color: theme.colors.textPrimary,
  padding: "12px",
  borderRadius: "10px",
  fontFamily: theme.typography.body.fontFamily,
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

const cellStyle = {
  padding: `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
  color: theme.table.cellColor,
  fontFamily: theme.table.cellFontFamily,
  fontSize: theme.table.cellFontSize,
  lineHeight: theme.table.cellLineHeight,
};

const badgeStyle = {
  background: theme.colors.badge.neutralBg,
  color: theme.colors.badge.neutralText,
  borderRadius: theme.table.badgeRadius,
  padding: `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,
  fontFamily: theme.table.badgeFontFamily,
  fontSize: theme.table.badgeFontSize,
  fontWeight: theme.table.badgeFontWeight,
  display: "inline-block",
};