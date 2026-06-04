import { useEffect, useState } from "react";
import {
  Pencil,
  RefreshCw,
  Plus,
  CheckCircle,
  Circle,
  X,
  Activity,
  Shield,
  ArrowRight,
} from "lucide-react";

import { theme } from "../theme/theme";

import RulesStats from "../components/cards/RulesStat";
import RuleEngineHealthCard from "../components/cards/RuleEngineHealthCard";

const formatINR = (value) =>
  "₹" +
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [reclassifyResults, setReclassifyResults] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);

  const [reclassifying, setReclassifying] = useState(false);

  const token = localStorage.getItem("token");

  async function fetchRules() {
    try {
      const response = await fetch(
        "http://localhost:8000/rules",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
      setReclassifying(true);

      const response = await fetch(
        "http://localhost:8000/rules/reclassify",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      setReclassifyResults(data);

      if (data?.reclassified?.length) {
        setAuditTrail(
          data.reclassified.slice(0, 8)
        );
      }
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
        const response = await fetch(
          `http://localhost:8000/rules/${editingRule.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(editForm),
          }
        );

        if (!response.ok) {
          alert("Failed to update rule");
          return;
        }
      } else {
        const response = await fetch(
          "http://localhost:8000/rules",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(editForm),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(
            data.detail ||
              "Failed to create rule"
          );
          return;
        }
      }

      await fetchRules();
      setEditingRule(null);
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

      case "investment":
        return theme.colors.badge
          .neutralText;

      default:
        return theme.colors.textMuted;
    }
  }

  const activeRules = rules.filter(
    (r) => r.is_active
  ).length;

  const disabledRules =
    rules.length - activeRules;

  if (loading) {
    return (
      <div
        style={{
          color:
            theme.colors.textPrimary,
          padding: "32px",
        }}
      >
        Loading rules...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "28px",
        background:
          theme.colors.background,
        color:
          theme.colors.textPrimary,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily:
                  theme.typography.heading
                    .fontFamily,
                fontSize:
                  theme.typography.heading
                    .fontSize,
                fontWeight:
                  theme.typography.heading
                    .fontWeight,
              }}
            >
              Rules Engine
            </h1>

            <p
              style={{
                marginTop: "8px",
                color:
                  theme.colors
                    .textSecondary,
              }}
            >
              Transaction
              classification,
              merchant mapping and
              automatic
              categorisation.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              onClick={
                reclassifyTransactions
              }
              disabled={
                reclassifying
              }
              style={{
                background:
                  theme.glass
                    .background,
                backdropFilter:
                  `blur(${theme.glass.blur})`,
                border: `1px solid ${theme.glass.border}`,
                color:
                  theme.colors
                    .textPrimary,
                padding:
                  "10px 16px",
                borderRadius:
                  "12px",
                display: "flex",
                alignItems:
                  "center",
                gap: "8px",
                cursor:
                  "pointer",
              }}
            >
              <RefreshCw
                size={16}
                style={{
                  animation:
                    reclassifying
                      ? "spin 1s linear infinite"
                      : "none",
                }}
              />

              {reclassifying
                ? "Processing..."
                : "Reclassify"}
            </button>

            <button
              onClick={() => {
                setEditingRule({
                  id: null,
                });

                setEditForm({
                  pattern: "",
                  match_type:
                    "contains",
                  merchant: "",
                  category: "",
                  transaction_type:
                    "infer",
                  priority: 50,
                  is_active: true,
                });
              }}
              style={{
                background:
                  theme.colors
                    .positive,
                border: "none",
                color:
                  theme.colors
                    .background,
                padding:
                  "10px 18px",
                borderRadius:
                  "12px",
                fontWeight: 600,
                display: "flex",
                alignItems:
                  "center",
                gap: "8px",
                cursor:
                  "pointer",
              }}
            >
              <Plus size={16} />
              New Rule
            </button>
          </div>
        </div>
      </div>

      {/* KPI ROW */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <RulesStats
          rules={rules}
        />

        <RuleEngineHealthCard
          rules={rules}
        />
      </div>

      {/* AUDIT + OVERVIEW */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "1fr 340px",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            background:
              theme.glass
                .background,
            backdropFilter:
              `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
            borderRadius:
              "18px",
            overflow: "hidden",
            boxShadow:
              theme.glass.shadow,
          }}
        >
          <div
            style={{
              padding: "18px",
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "10px",
              }}
            >
              <Shield
                size={16}
              />

              <span>
                Rules Engine
                Overview
              </span>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3,1fr)",
            }}
          >
            <OverviewItem
              label="Active"
              value={activeRules}
              color={
                theme.colors
                  .positive
              }
            />

            <OverviewItem
              label="Disabled"
              value={disabledRules}
              color={
                theme.colors
                  .negative
              }
            />

            <OverviewItem
              label="Priority"
              value={
                rules.length
                  ? Math.max(
                      ...rules.map(
                        (r) =>
                          r.priority
                      )
                    )
                  : 0
              }
              color={
                theme.colors
                  .neutral
              }
            />
          </div>
        </div>

        <div
          style={{
            background:
              theme.glass
                .background,
            backdropFilter:
              `blur(${theme.glass.blur})`,
            border: `1px solid ${theme.glass.border}`,
            borderRadius:
              "18px",
            overflow: "hidden",
            boxShadow:
              theme.glass.shadow,
          }}
        >
          <div
            style={{
              padding: "18px",
              borderBottom: `1px solid ${theme.colors.border}`,
              display: "flex",
              alignItems:
                "center",
              gap: "10px",
            }}
          >
            <Activity
              size={16}
            />
            Recent Audit
          </div>

          <div>
            {auditTrail.length ===
            0 ? (
              <div
                style={{
                  padding:
                    "20px",
                  color:
                    theme.colors
                      .textSecondary,
                }}
              >
                Run a
                reclassification
                to generate
                audit history.
              </div>
            ) : (
              auditTrail.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    style={{
                      padding:
                        "14px 18px",
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        color:
                          theme
                            .colors
                            .textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      {item.new_merchant ||
                        "Unknown"}
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "6px",
                        marginTop:
                          "4px",
                        color:
                          theme
                            .colors
                            .textSecondary,
                        fontSize:
                          "12px",
                      }}
                    >
                      <span>
                        {item.old_category ||
                          "Uncategorised"}
                      </span>

                      <ArrowRight
                        size={
                          12
                        }
                      />

                      <span
                        style={{
                          color:
                            theme
                              .colors
                              .positive,
                        }}
                      >
                        {item.new_category}
                      </span>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* TABLE CARD */}

      <div
        style={{
          background:
            theme.glass
              .background,
          backdropFilter:
            `blur(${theme.glass.blur})`,
          border: `1px solid ${theme.glass.border}`,
          borderRadius:
            "18px",
          overflow: "hidden",
          boxShadow:
            theme.glass.shadow,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
          }}
        >
          <thead
            style={{
              background:
                theme.table
                  .headerBackground,
            }}
          >
            <tr>
              {[
                "PRI",
                "RULE",
                "DESTINATION",
                "TYPE",
                "STATUS",
                "ACTION",
              ].map(
                (
                  header
                ) => (
                  <th
                    key={
                      header
                    }
                    style={{
                      textAlign:
                        "left",
                      padding:
                        "14px 18px",
                      color:
                        theme
                          .table
                          .headerColor,
                      fontSize:
                        "11px",
                      letterSpacing:
                        "0.08em",
                      borderBottom: `1px solid ${theme.colors.border}`,
                    }}
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {rules.map(
              (rule) => (
                <tr
                  key={
                    rule.id
                  }
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                  }}
                >
				                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <div
                    style={{
                      fontFamily:
                        theme
                          .typography
                          .mono
                          .fontFamily,
                      color:
                        rule.priority <=
                        10
                          ? theme
                              .rules
                              .priorityHigh
                          : rule.priority <=
                            50
                          ? theme
                              .rules
                              .priorityMedium
                          : theme
                              .rules
                              .priorityLow,
                      fontWeight: 600,
                    }}
                  >
                    {String(
                      rule.priority
                    ).padStart(
                      3,
                      "0"
                    )}
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color:
                        theme
                          .colors
                          .textPrimary,
                      marginBottom:
                        "4px",
                    }}
                  >
                    {rule.merchant ||
                      rule.pattern}
                  </div>

                  <div
                    style={{
                      fontSize:
                        "12px",
                      color:
                        theme
                          .colors
                          .textSecondary,
                      fontFamily:
                        theme
                          .typography
                          .mono
                          .fontFamily,
                    }}
                  >
                    {rule.match_type?.toUpperCase()}
                    :{" "}
                    {
                      rule.pattern
                    }
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        display:
                          "inline-block",
                        width:
                          "fit-content",
                        background:
                          theme
                            .colors
                            .badge
                            .neutralBg,
                        color:
                          theme
                            .colors
                            .badge
                            .neutralText,
                        padding:
                          "4px 10px",
                        borderRadius:
                          "999px",
                        fontSize:
                          "11px",
                      }}
                    >
                      {rule.category ||
                        "Uncategorised"}
                    </span>

                    <span
                      style={{
                        fontSize:
                          "12px",
                        color:
                          theme
                            .colors
                            .textSecondary,
                      }}
                    >
                      Merchant:
                      {" "}
                      {rule.merchant ||
                        "—"}
                    </span>
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <span
                    style={{
                      background:
                        `${getTypeColor(
                          rule.transaction_type
                        )}20`,
                      color:
                        getTypeColor(
                          rule.transaction_type
                        ),
                      padding:
                        "5px 10px",
                      borderRadius:
                        "999px",
                      fontSize:
                        "11px",
                      fontWeight: 600,
                      textTransform:
                        "capitalize",
                    }}
                  >
                    {rule.transaction_type ||
                      "infer"}
                  </span>
                </td>

                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "8px",
                    }}
                  >
                    {rule.is_active ? (
                      <CheckCircle
                        size={
                          14
                        }
                        color={
                          theme
                            .colors
                            .positive
                        }
                      />
                    ) : (
                      <Circle
                        size={
                          14
                        }
                        color={
                          theme
                            .colors
                            .textSecondary
                        }
                      />
                    )}

                    <span
                      style={{
                        color:
                          rule.is_active
                            ? theme
                                .colors
                                .positive
                            : theme
                                .colors
                                .textSecondary,
                      }}
                    >
                      {rule.is_active
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>
                </td>

                <td
                  style={{
                    padding:
                      "16px 18px",
                  }}
                >
                  <button
                    onClick={() => {
                      setEditingRule(
                        rule
                      );

                      setEditForm(
                        {
                          pattern:
                            rule.pattern ||
                            "",

                          match_type:
                            rule.match_type ||
                            "contains",

                          merchant:
                            rule.merchant ||
                            "",

                          category:
                            rule.category ||
                            "",

                          transaction_type:
                            rule.transaction_type ||
                            "infer",

                          priority:
                            rule.priority ??
                            50,

                          is_active:
                            rule.is_active,
                        }
                      );
                    }}
                    style={{
                      background:
                        theme
                          .colors
                          .cardAlt,
                      border: `1px solid ${theme.colors.border}`,
                      width:
                        "36px",
                      height:
                        "36px",
                      borderRadius:
                        "10px",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      cursor:
                        "pointer",
                      color:
                        theme
                          .colors
                          .textPrimary,
                    }}
                  >
                    <Pencil
                      size={
                        14
                      }
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT RULE MODAL */}

      {editingRule && (
        <div
          style={
            overlayStyle
          }
        >
          <div
            style={{
              ...modalStyle,
              width:
                "520px",
            }}
          >
            <h2
              style={
                modalHeading
              }
            >
              {editingRule.id
                ? "Edit Rule"
                : "Create Rule"}
            </h2>

            <div
              style={{
                display:
                  "grid",
                gap: "14px",
              }}
            >
              <input
                value={
                  editForm.pattern
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      pattern:
                        e
                          .target
                          .value,
                    }
                  )
                }
                placeholder="Pattern"
                style={
                  inputStyle
                }
              />

              <select
                value={
                  editForm.match_type
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      match_type:
                        e
                          .target
                          .value,
                    }
                  )
                }
                style={
                  inputStyle
                }
              >
                <option value="contains">
                  Contains
                </option>

                <option value="exact">
                  Exact
                </option>
              </select>

              <input
                value={
                  editForm.merchant
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      merchant:
                        e
                          .target
                          .value,
                    }
                  )
                }
                placeholder="Merchant"
                style={
                  inputStyle
                }
              />

              <input
                value={
                  editForm.category
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      category:
                        e
                          .target
                          .value,
                    }
                  )
                }
                placeholder="Category"
                style={
                  inputStyle
                }
              />

              <select
                value={
                  editForm.transaction_type
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      transaction_type:
                        e
                          .target
                          .value,
                    }
                  )
                }
                style={
                  inputStyle
                }
              >
                <option value="infer">
                  Infer
                </option>

                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

                <option value="transfer">
                  Transfer
                </option>

                <option value="investment">
                  Investment
                </option>
              </select>

              <input
                type="number"
                value={
                  editForm.priority
                }
                onChange={(
                  e
                ) =>
                  setEditForm(
                    {
                      ...editForm,
                      priority:
                        Number(
                          e
                            .target
                            .value
                        ),
                    }
                  )
                }
                placeholder="Priority"
                style={
                  inputStyle
                }
              />
			                {editingRule.id && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color:
                      theme.colors
                        .textSecondary,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      editForm.is_active
                    }
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        is_active:
                          e.target.checked,
                      })
                    }
                  />
                  Active Rule
                </label>
              )}

              <button
                onClick={
                  saveRuleChanges
                }
                style={{
                  background:
                    theme.colors
                      .positive,
                  border: "none",
                  color:
                    theme.colors
                      .background,
                  padding: "14px",
                  borderRadius:
                    "12px",
                  fontWeight: 600,
                  cursor:
                    "pointer",
                }}
              >
                {editingRule.id
                  ? "Save Changes"
                  : "Create Rule"}
              </button>

              <button
                onClick={() =>
                  setEditingRule(
                    null
                  )
                }
                style={{
                  background:
                    "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  color:
                    theme.colors
                      .textSecondary,
                  padding: "14px",
                  borderRadius:
                    "12px",
                  cursor:
                    "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECLASSIFICATION MODAL */}

      {reclassifyResults && (
        <div
          style={
            overlayStyle
          }
        >
          <div
            style={{
              ...modalStyle,
              width:
                "1000px",
              maxWidth:
                "95vw",
              maxHeight:
                "85vh",
              overflow:
                "hidden",
              display:
                "flex",
              flexDirection:
                "column",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom:
                  "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    ...modalHeading,
                    marginBottom:
                      "4px",
                  }}
                >
                  Reclassification
                  Complete
                </h2>

                <div
                  style={{
                    color:
                      theme.colors
                        .textSecondary,
                  }}
                >
                  {
                    reclassifyResults.updated
                  }{" "}
                  transactions
                  updated
                </div>
              </div>

              <button
                onClick={() =>
                  setReclassifyResults(
                    null
                  )
                }
                style={{
                  background:
                    "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  width:
                    "36px",
                  height:
                    "36px",
                  borderRadius:
                    "10px",
                  color:
                    theme.colors
                      .textSecondary,
                  cursor:
                    "pointer",
                }}
              >
                <X
                  size={16}
                />
              </button>
            </div>

            <div
              style={{
                overflowY:
                  "auto",
                flex: 1,
              }}
            >
              <table
                style={{
                  width:
                    "100%",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Date",
                      "Description",
                      "Amount",
                      "Rule",
                      "Category",
                      "Merchant",
                    ].map(
                      (
                        h
                      ) => (
                        <th
                          key={
                            h
                          }
                          style={{
                            textAlign:
                              "left",
                            padding:
                              "12px",
                            color:
                              theme
                                .table
                                .headerColor,
                            borderBottom: `1px solid ${theme.colors.border}`,
                            fontSize:
                              "11px",
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {reclassifyResults.reclassified?.map(
                    (
                      tx,
                      idx
                    ) => (
                      <tr
                        key={
                          idx
                        }
                        style={{
                          borderBottom: `1px solid ${theme.colors.border}`,
                        }}
                      >
                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            tx.date
                          }
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            tx.description
                          }
                        </td>

                        <td
                          style={{
                            ...cellStyle,
                            fontFamily:
                              theme
                                .typography
                                .mono
                                .fontFamily,
                          }}
                        >
                          {formatINR(
                            Math.abs(
                              tx.amount
                            )
                          )}
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            tx.matched_rule
                          }
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            tx.new_category
                          }
                        </td>

                        <td
                          style={
                            cellStyle
                          }
                        >
                          {
                            tx.new_merchant
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/* ---------------------------
   OVERVIEW ITEM
---------------------------- */

function OverviewItem({
  label,
  value,
  color,
}) {
  return (
    <div
      style={{
        padding:
          "24px",
        borderRight:
          `1px solid ${theme.colors.border}`,
      }}
    >
      <div
        style={{
          fontSize:
            "11px",
          letterSpacing:
            "0.08em",
          color:
            theme.colors
              .textSecondary,
          marginBottom:
            "8px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize:
            "28px",
          fontWeight:
            700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------------------
   SHARED STYLES
---------------------------- */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background:
    "rgba(0,0,0,0.82)",
  display: "flex",
  alignItems:
    "center",
  justifyContent:
    "center",
  zIndex: 9999,
};

const modalStyle = {
  background:
    theme.glass
      .background,
  backdropFilter:
    `blur(${theme.glass.blur})`,
  border: `1px solid ${theme.glass.border}`,
  borderRadius:
    "20px",
  boxShadow:
    theme.glass.shadow,
  padding: "28px",
};

const modalHeading = {
  margin: 0,
  color:
    theme.colors
      .textPrimary,
  fontSize:
    "22px",
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  background:
    theme.colors
      .cardAlt,
  border: `1px solid ${theme.colors.border}`,
  color:
    theme.colors
      .textPrimary,
  borderRadius:
    "12px",
  padding:
    "12px 14px",
  fontSize:
    "14px",
  outline: "none",
  boxSizing:
    "border-box",
};

const cellStyle = {
  padding: "12px",
  color:
    theme.colors
      .textPrimary,
  fontSize:
    "13px",
};