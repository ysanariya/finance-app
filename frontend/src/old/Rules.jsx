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
        return "#34d399";

      case "expense":
        return "#f87171";

      case "transfer":
        return "#60a5fa";

      case "infer":
        return "#fbbf24";

      default:
        return "#a1a1aa";
    }
  }

  if (loading) {

    return (
      <div
        style={{
          color: theme.colors.textPrimary,
          padding: "32px"
        }}
      >
        Loading rules...
      </div>
    );
  }

const inputStyle = {

  background: theme.colors.card,

  border: "1px solid theme.colors.border",

  color: theme.colors.textPrimary,

  padding: "12px",

  borderRadius: "10px",

  fontSize: "14px",

  outline: "none",
};


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
        padding: "32px",
        color: theme.colors.textPrimary,
        background: theme.colors.background,
        minHeight: "100vh"
      }}
    >

      <div
        style={{
          marginBottom: "28px"
        }}
      >
        <h1
          style={{
            fontSize: "40px",
            fontWeight: "700",
            marginBottom: "6px"
          }}
        >
          Rules
        </h1>

        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: "15px"
          }}
        >
          Manage transaction classification rules
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px"
        }}
      >

        <button
          onClick={reclassifyTransactions}
          style={{
            background: "#e2dada",
            border: "1px solid theme.colors.border",
            color: theme.colors.textPrimary,
            borderRadius: "12px",
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px"
          }}
        >
          <RefreshCw size={16} />
          Reclassify
        </button>

        <button
          style={{
            background: "#10b981",
            border: "none",
            color: theme.colors.textPrimary,
            borderRadius: "12px",
            padding: "10px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600"
          }}
        >
          <Plus size={16} />
          New Rule
        </button>

      </div>

      <div
        style={{
          background: theme.colors.card,
          border: "1px solid theme.colors.border",
          borderRadius: "24px",
          overflow: "hidden"
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
        >

          <thead
            style={{
              background: "#111111"
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
                "Actions"
              ].map((header) => (

                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    padding: "18px 20px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: theme.colors.textSecondary,
                    borderBottom: "1px solid #1f1f1f",
                    letterSpacing: "0.04em"
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
                  borderBottom: "1px solid #161616"
                }}
              >

                <td
                  style={{
                    padding: "18px 20px",
                    fontWeight: "500"
                  }}
                >
                  {rule.pattern}
                </td>

                <td
                  style={{
                    padding: "18px 20px",
                    color: "#a1a1aa"
                  }}
                >
                  {rule.match_type}
                </td>

                <td
                  style={{
                    padding: "18px 20px"
                  }}
                >
                  {rule.merchant || "-"}
                </td>

                <td
                  style={{
                    padding: "18px 20px"
                  }}
                >
                  <span
                    style={{
                      background: theme.colors.badge.neutralBg,
                      color: theme.colors.badge.neutralText,
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px"
                    }}
                  >
                    {rule.category || "Uncategorized"}
                  </span>
                </td>

                <td
                  style={{
                    padding: "18px 20px"
                  }}
                >
                  <span
                    style={{
                      background: `${getTypeColor(rule.transaction_type)}20`,
                      color: getTypeColor(rule.transaction_type),
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "600",
                      textTransform: "capitalize"
                    }}
                  >
                    {rule.transaction_type || "infer"}
                  </span>
                </td>

                <td
                  style={{
                    padding: "18px 20px",
                    color: "#d4d4d8"
                  }}
                >
                  {rule.priority}
                </td>

                <td
                  style={{
                    padding: "18px 20px"
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: rule.is_active
                        ? "#34d399"
                        : theme.colors.textSecondary
                    }}
                  >

                    {rule.is_active
                      ? <CheckCircle size={16} />
                      : <Circle size={16} />
                    }

                    <span
                      style={{
                        fontSize: "13px"
                      }}
                    >
                      {rule.is_active
                        ? "Active"
                        : "Disabled"
                      }
                    </span>

                  </div>

                </td>

                <td
                  style={{
                    padding: "18px 20px"
                  }}
                >

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
                            is_active: rule.is_active
                            });

                        }}
                        style={{
                            background: theme.colors.cardAlt,
                            border: "1px solid theme.colors.border",
                            color: theme.colors.textPrimary,
                            borderRadius: "10px",
                            width: "36px",
                            height: "36px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        >
                        <Pencil size={16} />
                    </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


            {
  editingRule && (

    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}
    >

      <div
        style={{
          background: theme.colors.surface,
          border: "1px solid theme.colors.border",
          borderRadius: "24px",
          padding: "32px",
          width: "520px"
        }}
      >

        <h2
          style={{
            fontSize: "24px",
            marginBottom: "24px"
          }}
        >
          Edit Rule
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >

          <input
            value={editForm.pattern}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                pattern: e.target.value
              })
            }
            placeholder="Pattern"
            style={inputStyle}
          />

          <input
            value={editForm.merchant}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                merchant: e.target.value
              })
            }
            placeholder="Merchant"
            style={inputStyle}
          />

          <input
            value={editForm.category}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                category: e.target.value
              })
            }
            placeholder="Category"
            style={inputStyle}
          />

          <select
            value={editForm.transaction_type}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                transaction_type: e.target.value
              })
            }
            style={inputStyle}
          >
            <option value="infer">Infer</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>

          <input
            type="number"
            value={editForm.priority}
            onChange={(e) =>
              setEditForm({
                ...editForm,
                priority: Number(e.target.value)
              })
            }
            placeholder="Priority"
            style={inputStyle}
          />

        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "28px"
          }}
        >

          <button
            onClick={() => setEditingRule(null)}
            style={{
              background: theme.colors.card,
              border: "1px solid theme.colors.border",
              color: theme.colors.textPrimary,
              padding: "10px 18px",
              borderRadius: "12px",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>

          <button
            onClick={saveRuleChanges}
            style={{
              background: "#10b981",
              border: "none",
              color: theme.colors.textPrimary,
              padding: "10px 18px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Save Changes
          </button>

        </div>

      </div>

    </div>
  )
}
    </div>
  );
}