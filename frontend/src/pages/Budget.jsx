import { useEffect, useState } from "react";
import { theme } from "../theme/theme";
import { formatINR } from "../utils/formatters";
import BudgetSankeyChart from "../components/charts/BudgetSankeyChart";

export default function Budget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tbb, setTbb] = useState(0.0);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [newTemplateAmount, setNewTemplateAmount] = useState("");
  
  // Collapse/Expand state for category groups
  const [collapsedGroups, setCollapsedGroups] = useState({});
  
  // Inline edit state
  const [editingCategory, setEditingCategory] = useState(null); // category name
  const [editValue, setEditValue] = useState("");

  // Modals / forms state
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [mapCategory, setMapCategory] = useState("");
  const [mapGroupId, setMapGroupId] = useState("");

  async function loadTemplates() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/budget/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateTemplate() {
    if (!newTemplateCategory.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/budget/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: newTemplateCategory, default_amount: parseFloat(newTemplateAmount) || 0 })
      });
      if (res.ok) {
        setNewTemplateCategory("");
        setNewTemplateAmount("");
        await loadTemplates();
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateTemplate(id, amount) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/budget/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, default_amount: parseFloat(amount) || 0 })
      });
      if (res.ok) {
        await loadTemplates();
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteTemplate(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/budget/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await loadTemplates();
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadSheet(y = year, m = month) {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/budget/envelope/sheet?year=${y}&month=${m}`,
        { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTbb(data.to_be_budgeted || 0.0);
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSheet(year, month);
  }, [year, month]);

  // Stepper handlers
  function handlePrevMonth() {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  }

  function handleNextMonth() {
    if (month === 12) {
      setYear(y => y + 1);
      setMonth(1);
    } else {
      setMonth(m => m + 1);
    }
  }

  // Assign budget envelope value
  async function handleAssignBudget(category, amount) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/budget/envelope/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          year,
          month,
          amount: parseFloat(amount) || 0.0
        })
      });
      if (res.ok) {
        setEditingCategory(null);
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Create Group
  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/budget/envelope/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newGroupName })
      });
      if (res.ok) {
        setNewGroupName("");
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Map Category to Group
  async function handleMapCategory() {
    if (!mapCategory || !mapGroupId) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/budget/envelope/groups/mapping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: mapCategory,
          group_id: Number(mapGroupId)
        })
      });
      if (res.ok) {
        setMapCategory("");
        setMapGroupId("");
        await loadSheet(year, month);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Collapse toggle
  const toggleGroupCollapse = (id) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Month Display Helper
  const monthName = new Date(year, month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" });

  // Prep data for Sankey chart
  const sankeyBudgets = [];
  let totalIncome = 0;
  
  groups.forEach(g => {
    g.categories.forEach(c => {
      if (c.budgeted > 0) {
        sankeyBudgets.push({
          category: c.category,
          amount: c.budgeted,
          budget_type: "monthly"
        });
      }
    });
  });

  // Fetch total income for this specific month for the flow chart
  // Or fallback to budgeted total + TBB
  const totalSpentOrBudgeted = groups.reduce((sum, g) => sum + g.categories.reduce((s, c) => s + c.budgeted, 0), 0);
  totalIncome = totalSpentOrBudgeted + Math.max(tbb, 0);

  // Styles
  const styles = {
    page: {
      padding: "32px",
      background: theme.colors.background,
      minHeight: "100vh",
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.body.fontFamily
    },
    subtitle: {
      ...theme.typography.body,
      fontSize: "16px",
      color: theme.colors.textSecondary,
      margin: "4px 0 0"
    },
    title: {
      ...theme.typography.heading,
      fontSize: "36px",
      margin: 0
    },
    stepper: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "8px",
      padding: "6px 12px"
    },
    stepperBtn: {
      background: "transparent",
      border: "none",
      color: theme.colors.neutral,
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "18px"
    },
    stepperLabel: {
      fontSize: "15px",
      fontWeight: 600,
      color: theme.colors.textPrimary,
      minWidth: "120px",
      textAlign: "center"
    },
    tbbBar: {
      background: tbb < 0 ? theme.colors.negativeDim : theme.colors.positiveDim,
      border: `1px solid ${tbb < 0 ? theme.colors.negative : theme.colors.positive}`,
      borderRadius: "10px",
      padding: "20px",
      textAlign: "center",
      marginBottom: "24px"
    },
    tbbValue: {
      fontSize: "32px",
      fontWeight: "700",
      fontFamily: theme.typography.mono.fontFamily,
      color: tbb < 0 ? theme.colors.negative : theme.colors.positive
    },
    tbbLabel: {
      fontSize: "12px",
      color: theme.colors.textSecondary,
      marginTop: "4px"
    },
    sheetCard: {
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.layout.cardRadius,
      padding: "20px",
      marginBottom: "24px"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "13px"
    },
    th: {
      padding: "10px 14px",
      textAlign: "left",
      color: theme.colors.textSecondary,
      fontWeight: 600,
      borderBottom: `2px solid ${theme.colors.border}`,
      textTransform: "uppercase",
      fontSize: "11px"
    },
    groupRow: {
      background: theme.colors.cardAlt,
      borderBottom: `1px solid ${theme.colors.border}`,
      cursor: "pointer"
    },
    groupCell: {
      padding: "12px 14px",
      fontWeight: 600,
      color: theme.colors.textPrimary
    },
    catCell: {
      padding: "10px 14px",
      borderBottom: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary
    },
    monoCell: {
      fontFamily: theme.typography.mono.fontFamily,
      textAlign: "right"
    },
    input: {
      background: theme.colors.cardAlt,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary,
      padding: "4px 8px",
      borderRadius: "4px",
      width: "90px",
      textAlign: "right"
    },
    ghostButton: {
      background: theme.colors.cardAlt,
      color: theme.colors.textPrimary,
      border: `1px solid ${theme.colors.border}`,
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 500
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    },
    modalContent: {
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "12px",
      padding: "24px",
      width: "500px",
      maxHeight: "80vh",
      overflowY: "auto"
    }
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Envelope Budget Sheet</h1>
          <p style={styles.subtitle}>Allocate actual income to envelope categories with rollover tracking</p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button style={styles.ghostButton} onClick={() => setShowTemplateModal(true)}>
            Global Budget Config
          </button>
          <button style={styles.ghostButton} onClick={() => setShowManageGroups(true)}>
          </button>

          <div style={styles.stepper}>
            <button style={styles.stepperBtn} onClick={handlePrevMonth}>&lt;</button>
            <div style={styles.stepperLabel}>{monthName}</div>
            <button style={styles.stepperBtn} onClick={handleNextMonth}>&gt;</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: theme.colors.textSecondary }}>Loading budget sheet...</div>
      ) : (
        <>
          {/* TO BE BUDGETED BAR */}
          <div style={styles.tbbBar}>
            <div style={styles.tbbValue}>{formatINR(tbb)}</div>
            <div style={styles.tbbLabel}>
              {tbb < 0 ? "Overallocated! Reduce budgeted assignments." : "Available to Budget (To Be Budgeted)"}
            </div>
          </div>

          {/* SPREADSHEET TABLE */}
          <div style={styles.sheetCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Budgeted</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Activity</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => {
                  const isCollapsed = collapsedGroups[group.id];
                  
                  // Compute Group Totals
                  const grpBudgeted = group.categories.reduce((sum, c) => sum + c.budgeted, 0);
                  const grpActivity = group.categories.reduce((sum, c) => sum + c.activity, 0);
                  const grpBalance = group.categories.reduce((sum, c) => sum + c.balance, 0);

                  return (
                    <span key={group.id} style={{ display: "contents" }}>
                      {/* GROUP HEADER ROW */}
                      <tr style={styles.groupRow} onClick={() => toggleGroupCollapse(group.id)}>
                        <td style={styles.groupCell}>
                          <span style={{ marginRight: "8px", fontSize: "10px" }}>{isCollapsed ? "▶" : "▼"}</span>
                          {group.name}
                        </td>
                        <td style={{ ...styles.groupCell, ...styles.monoCell }}>{formatINR(grpBudgeted)}</td>
                        <td style={{ ...styles.groupCell, ...styles.monoCell }}>{formatINR(grpActivity)}</td>
                        <td style={{ ...styles.groupCell, ...styles.monoCell, color: grpBalance < 0 ? theme.colors.negative : theme.colors.positive }}>
                          {formatINR(grpBalance)}
                        </td>
                      </tr>

                      {/* CATEGORIES INNER ROWS */}
                      {!isCollapsed && group.categories.map(cat => {
                        const isEditing = editingCategory === cat.category;
                        return (
                          <tr key={cat.category}>
                            <td style={{ ...styles.catCell, paddingLeft: "32px" }}>{cat.category}</td>
                            
                            {/* Budgeted assignment input */}
                            <td
                              style={{ ...styles.catCell, ...styles.monoCell }}
                              onDoubleClick={() => {
                                setEditingCategory(cat.category);
                                setEditValue(cat.budgeted.toString());
                              }}
                            >
                              {isEditing ? (
                                <input
                                  style={styles.input}
                                  type="number"
                                  autoFocus
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={() => handleAssignBudget(cat.category, editValue)}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") handleAssignBudget(cat.category, editValue);
                                    if (e.key === "Escape") setEditingCategory(null);
                                  }}
                                />
                              ) : (
                                <span style={{ cursor: "pointer", borderBottom: `1px dashed ${theme.colors.border}` }}>
                                  {formatINR(cat.budgeted)}
                                </span>
                              )}
                            </td>

                            <td style={{ ...styles.catCell, ...styles.monoCell, color: theme.colors.textSecondary }}>
                              {formatINR(cat.activity)}
                            </td>

                            <td style={{ ...styles.catCell, ...styles.monoCell, fontWeight: 600, color: cat.balance < 0 ? theme.colors.negative : theme.colors.positive }}>
                              {formatINR(cat.balance)}
                            </td>
                          </tr>
                        );
                      })}
                    </span>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FLOW CHART */}
          {sankeyBudgets.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <BudgetSankeyChart budgets={sankeyBudgets} monthlyIncome={totalIncome} />
            </div>
          )}
        </>
      )}

      {/* GLOBAL BUDGET TEMPLATES MODAL */}
      {showTemplateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Global Budget Templates</h2>
            {/* Existing Templates */}
            <div style={{ marginBottom: "16px" }}>
              {templates.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span style={{ minWidth: "120px" }}>{t.category}</span>
                  <input
                    style={styles.input}
                    type="number"
                    value={t.default_amount}
                    onChange={e => handleUpdateTemplate(t.id, e.target.value)}
                  />
                  <button style={styles.dangerButton} onClick={() => handleDeleteTemplate(t.id)}>Delete</button>
                </div>
              ))}
            </div>
            {/* Add New Template */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
              <input
                style={styles.input}
                placeholder="Category"
                value={newTemplateCategory}
                onChange={e => setNewTemplateCategory(e.target.value)}
              />
              <input
                style={styles.input}
                placeholder="Default Amount"
                type="number"
                value={newTemplateAmount}
                onChange={e => setNewTemplateAmount(e.target.value)}
              />
              <button style={styles.button} onClick={handleCreateTemplate}>Add</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button style={styles.ghostButton} onClick={() => setShowTemplateModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE GROUPS & CATEGORIES MODAL */}
      {showManageGroups && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Groups & Mappings</h2>
              <button style={styles.ghostButton} onClick={() => setShowManageGroups(false)}>Close</button>
            </div>

            {/* Create Category Group */}
            <div style={{ borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: "16px", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", margin: "0 0 10px 0" }}>Create New Category Group</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  style={{ ...styles.input, textAlign: "left", flex: 1 }}
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="e.g. Living Expenses"
                />
                <button
                  style={{ ...styles.ghostButton, background: theme.colors.neutral, color: "#fff", border: "none" }}
                  onClick={handleCreateGroup}
                >
                  Create
                </button>
              </div>
            </div>

            {/* Map Category to Group */}
            <div>
              <h3 style={{ fontSize: "14px", margin: "0 0 10px 0" }}>Assign Category to Group</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: theme.colors.textSecondary }}>Select Category</label>
                  <select
                    style={{ ...styles.input, textAlign: "left", width: "100%" }}
                    value={mapCategory}
                    onChange={e => setMapCategory(e.target.value)}
                  >
                    <option value="">-- Choose Category --</option>
                    {groups.flatMap(g => g.categories.map(c => c.category)).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "11px", color: theme.colors.textSecondary }}>Select Target Group</label>
                  <select
                    style={{ ...styles.input, textAlign: "left", width: "100%" }}
                    value={mapGroupId}
                    onChange={e => setMapGroupId(e.target.value)}
                  >
                    <option value="">-- Choose Group --</option>
                    {groups.filter(g => g.id !== 0).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  style={{ ...styles.ghostButton, background: theme.colors.neutral, color: "#fff", border: "none", marginTop: "8px" }}
                  onClick={handleMapCategory}
                >
                  Save Mapping
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}