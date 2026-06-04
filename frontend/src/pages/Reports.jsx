import { useEffect, useState } from "react";
import { theme } from "../theme/theme";
import WidgetContainer from "../components/dashboard/WidgetContainer";

export default function Reports() {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Modals state
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [newDashName, setNewDashName] = useState("");
  
  // Widget Form State
  const [widgetForm, setWidgetForm] = useState({
    id: null,
    title: "",
    type: "bar", // bar, line, area, donut, summary_card, table
    data_source: "custom_query",
    layout_w: 6,
    query_config: {
      transaction_type: "expense", // expense, income, all
      categories: [],
      split_by: "category", // category, merchant, month, type
      sort_by: "amount",
      sort_order: "desc",
      date_range_type: "ytd", // ytd, current_month, last_30, last_6_months, static
      start_date: "",
      end_date: ""
    }
  });

  const [selectAllCats, setSelectAllCats] = useState(true);

  // Load Dashboards & Categories
  async function loadDashboards(selectId = null) {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/custom-dashboards", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboards(data);
        if (data.length > 0) {
          if (selectId) {
            const match = data.find(d => d.id === selectId);
            setSelectedDashboard(match || data[0]);
          } else {
            const def = data.find(d => d.is_default) || data[0];
            setSelectedDashboard(def);
          }
        } else {
          setSelectedDashboard(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/transactions/categories", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const cats = await res.json();
        setCategories(cats || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadDashboards();
    loadCategories();
  }, []);

  // Compute live date ranges
  function computeDates(rangeType, staticStart, staticEnd) {
    const now = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];
    
    if (rangeType === "current_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start_date: formatDate(start), end_date: formatDate(end) };
    }
    if (rangeType === "last_30") {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return { start_date: formatDate(start), end_date: formatDate(now) };
    }
    if (rangeType === "last_6_months") {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start_date: formatDate(start), end_date: formatDate(end) };
    }
    if (rangeType === "ytd") {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start_date: formatDate(start), end_date: formatDate(now) };
    }
    // Static fallback
    return { start_date: staticStart || "", end_date: staticEnd || "" };
  }

  // Dashboard CRUD handlers
  async function handleCreateDashboard() {
    if (!newDashName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/custom-dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDashName,
          is_default: dashboards.length === 0, // default if first
          widgets: []
        })
      });
      if (res.ok) {
        const r = await res.json();
        setNewDashName("");
        setShowDashboardModal(false);
        await loadDashboards(r.dashboard_id);
      } else {
        const errText = await res.text();
        console.error("Failed to create dashboard:", res.status, errText);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSaveDashboard() {
    if (!selectedDashboard) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8000/custom-dashboards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedDashboard.name,
          is_default: selectedDashboard.is_default,
          widgets: selectedDashboard.widgets.map(w => ({
            title: w.title,
            type: w.type,
            data_source: w.data_source,
            query_config: w.query_config,
            layout_x: w.layout_x,
            layout_y: w.layout_y,
            layout_w: w.layout_w,
            layout_h: w.layout_h
          }))
        })
      });
      if (res.ok) {
        setIsEditing(false);
        alert("Dashboard saved successfully!");
        await loadDashboards(selectedDashboard.id);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteDashboard() {
    if (!selectedDashboard) return;
    if (!confirm(`Are you sure you want to delete dashboard "${selectedDashboard.name}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/custom-dashboards/${selectedDashboard.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIsEditing(false);
        await loadDashboards();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Widget management
  function handleAddWidgetClick() {
    setWidgetForm({
      id: Math.random(), // temp id
      title: "",
      type: "bar",
      data_source: "custom_query",
      layout_w: 6,
      query_config: {
        transaction_type: "expense",
        categories: [],
        split_by: "category",
        sort_by: "amount",
        sort_order: "desc",
        date_range_type: "ytd",
        start_date: "",
        end_date: ""
      }
    });
    setSelectAllCats(true);
    setShowWidgetModal(true);
  }

  function handleSaveWidget() {
    if (!widgetForm.title.trim()) return;

    // Apply categories selection
    const activeCategories = selectAllCats ? [] : widgetForm.query_config.categories;

    // Precalculate live dates
    const resolvedDates = computeDates(
      widgetForm.query_config.date_range_type,
      widgetForm.query_config.start_date,
      widgetForm.query_config.end_date
    );

    const completeQueryConfig = {
      ...widgetForm.query_config,
      categories: activeCategories,
      start_date: resolvedDates.start_date,
      end_date: resolvedDates.end_date
    };

    const newWidget = {
      title: widgetForm.title,
      type: widgetForm.type,
      data_source: widgetForm.data_source,
      query_config: JSON.stringify(completeQueryConfig),
      layout_x: 0,
      layout_y: 0,
      layout_w: Number(widgetForm.layout_w),
      layout_h: 4
    };

    setSelectedDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));

    setShowWidgetModal(false);
  }

  function handleRemoveWidget(index) {
    setSelectedDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter((_, idx) => idx !== index)
    }));
  }

  function handleResizeWidget(index, amount) {
    setSelectedDashboard(prev => {
      const updated = [...prev.widgets];
      const w = updated[index];
      let newW = w.layout_w + amount;
      if (newW < 3) newW = 3;
      if (newW > 12) newW = 12;
      updated[index] = { ...w, layout_w: newW };
      return { ...prev, widgets: updated };
    });
  }

  // Styles
  const styles = {
    page: {
      padding: "32px",
      background: theme.colors.background,
      minHeight: "100vh",
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.body.fontFamily
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px"
    },
    title: {
      ...theme.typography.heading,
      fontSize: "36px",
      margin: 0
    },
    subtitle: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      margin: "4px 0 0"
    },
    controls: {
      display: "flex",
      gap: "12px",
      alignItems: "center"
    },
    select: {
      background: theme.colors.card,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary,
      padding: "8px 12px",
      borderRadius: "6px",
      cursor: "pointer"
    },
    button: {
      background: theme.colors.neutral,
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 600
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
    dangerButton: {
      background: theme.colors.negative,
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: 500
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(12, 1fr)",
      gap: "16px",
      alignItems: "start"
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
      width: "550px",
      maxHeight: "85vh",
      overflowY: "auto"
    },
    formGroup: {
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px"
    },
    label: {
      fontSize: "12px",
      fontWeight: 600,
      color: theme.colors.textSecondary
    },
    input: {
      background: theme.colors.cardAlt,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary,
      padding: "10px",
      borderRadius: "6px"
    }
  };

  return (
    <div style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Reports & Dashboards</h1>
          <p style={styles.subtitle}>Build custom visualization boards to monitor financial metrics</p>
        </div>
        <div style={styles.controls}>
          {dashboards.length > 0 && (
            <select
              style={styles.select}
              value={selectedDashboard?.id || ""}
              onChange={e => {
                const match = dashboards.find(d => d.id === Number(e.target.value));
                setSelectedDashboard(match);
                setIsEditing(false);
              }}
            >
              {dashboards.map(d => (
                <option key={d.id} value={d.id}>{d.name} {d.is_default ? "(Default)" : ""}</option>
              ))}
            </select>
          )}

          <button style={styles.ghostButton} onClick={() => setShowDashboardModal(true)}>
            + New Board
          </button>

          {selectedDashboard && (
            <>
              {isEditing ? (
                <>
                  <button style={styles.ghostButton} onClick={handleAddWidgetClick}>
                    + Add Widget
                  </button>
                  <button style={styles.button} onClick={handleSaveDashboard}>
                    Save Layout
                  </button>
                  <button style={styles.dangerButton} onClick={handleDeleteDashboard}>
                    Delete Board
                  </button>
                  <button style={styles.ghostButton} onClick={() => {
                    loadDashboards(selectedDashboard.id);
                    setIsEditing(false);
                  }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button style={styles.ghostButton} onClick={() => setIsEditing(true)}>
                  Edit Board Layout
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ color: theme.colors.textSecondary }}>Loading Dashboards...</div>
      ) : selectedDashboard ? (
        <div>
          {selectedDashboard.widgets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", background: theme.colors.card, border: `1px solid ${theme.colors.border}`, borderRadius: "10px" }}>
              <div style={{ color: theme.colors.textSecondary, marginBottom: "12px" }}>This dashboard has no widgets. Click "Edit Board Layout" and then "+ Add Widget" to build it!</div>
            </div>
          ) : (
            <div style={styles.grid}>
              {selectedDashboard.widgets.map((widget, idx) => (
                <div key={idx} style={{ gridColumn: `span ${widget.layout_w}`, minHeight: "260px" }}>
                  <WidgetContainer
                    widget={widget}
                    isEditing={isEditing}
                    onRemove={() => handleRemoveWidget(idx)}
                  />
                  {isEditing && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px", justifyContent: "flex-end" }}>
                      <button
                        style={{ ...styles.ghostButton, padding: "2px 6px", fontSize: "11px" }}
                        onClick={() => handleResizeWidget(idx, -1)}
                      >
                        Narrower
                      </button>
                      <button
                        style={{ ...styles.ghostButton, padding: "2px 6px", fontSize: "11px" }}
                        onClick={() => handleResizeWidget(idx, 1)}
                      >
                        Wider
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", background: theme.colors.card, border: `1px solid ${theme.colors.border}`, borderRadius: "10px" }}>
          <div style={{ color: theme.colors.textSecondary, marginBottom: "12px" }}>No dashboards created yet. Click "+ New Board" to create one.</div>
        </div>
      )}

      {/* DASHBOARD CREATOR MODAL */}
      {showDashboardModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Create Custom Dashboard</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Dashboard Name</label>
              <input
                style={styles.input}
                type="text"
                value={newDashName}
                onChange={e => setNewDashName(e.target.value)}
                placeholder="e.g. Monthly Budget Overview"
              />
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button style={styles.ghostButton} onClick={() => setShowDashboardModal(false)}>Cancel</button>
              <button style={styles.button} onClick={handleCreateDashboard}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET CREATOR CONFIGURATOR MODAL */}
      {showWidgetModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Add Custom Analytics Widget</h2>
            
            {/* Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Widget Title</label>
              <input
                style={styles.input}
                type="text"
                value={widgetForm.title}
                onChange={e => setWidgetForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Rent Spending Trend"
              />
            </div>

            {/* Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Visualization Type</label>
              <select
                style={styles.input}
                value={widgetForm.type}
                onChange={e => setWidgetForm(p => ({ ...p, type: e.target.value }))}
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="donut">Donut Chart</option>
                <option value="summary_card">KPI / Summary Card</option>
                <option value="table">Data Table</option>
              </select>
            </div>

            {/* Transaction Type */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Transaction Type</label>
              <select
                style={styles.input}
                value={widgetForm.query_config.transaction_type}
                onChange={e => setWidgetForm(p => ({
                  ...p,
                  query_config: { ...p.query_config, transaction_type: e.target.value }
                }))}
              >
                <option value="expense">Expenses Only</option>
                <option value="income">Income Only</option>
                <option value="all">All Transactions</option>
              </select>
            </div>

            {/* Split criteria */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Group / Split Data By</label>
              <select
                style={styles.input}
                value={widgetForm.query_config.split_by}
                onChange={e => setWidgetForm(p => ({
                  ...p,
                  query_config: { ...p.query_config, split_by: e.target.value }
                }))}
              >
                <option value="category">Category</option>
                <option value="merchant">Merchant / Payee</option>
                <option value="month">Month / Time Interval</option>
                <option value="type">Transaction Type</option>
              </select>
            </div>

            {/* Date Range Options */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Date Filter Range</label>
              <select
                style={styles.input}
                value={widgetForm.query_config.date_range_type}
                onChange={e => setWidgetForm(p => ({
                  ...p,
                  query_config: { ...p.query_config, date_range_type: e.target.value }
                }))}
              >
                <option value="ytd">Year To Date (YTD)</option>
                <option value="current_month">Current Month</option>
                <option value="last_30">Last 30 Days</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="static">Static Calendar Date Range</option>
              </select>
            </div>

            {widgetForm.query_config.date_range_type === "static" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={widgetForm.query_config.start_date}
                    onChange={e => setWidgetForm(p => ({
                      ...p,
                      query_config: { ...p.query_config, start_date: e.target.value }
                    }))}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={widgetForm.query_config.end_date}
                    onChange={e => setWidgetForm(p => ({
                      ...p,
                      query_config: { ...p.query_config, end_date: e.target.value }
                    }))}
                  />
                </div>
              </div>
            )}

            {/* Grid size width */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Widget Size Width</label>
              <select
                style={styles.input}
                value={widgetForm.layout_w}
                onChange={e => setWidgetForm(p => ({ ...p, layout_w: Number(e.target.value) }))}
              >
                <option value="4">One-Third Width (4 Columns)</option>
                <option value="6">Half Width (6 Columns)</option>
                <option value="8">Two-Thirds Width (8 Columns)</option>
                <option value="12">Full Width (12 Columns)</option>
              </select>
            </div>

            {/* Categories filter checklists */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Filter Categories</label>
              <div style={{ display: "flex", gap: "8px", margin: "4px 0 8px 0" }}>
                <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="checkbox"
                    checked={selectAllCats}
                    onChange={e => setSelectAllCats(e.target.checked)}
                  />
                  Select All Categories
                </label>
              </div>

              {!selectAllCats && (
                <div style={{ maxHeight: "120px", overflowY: "auto", border: `1px solid ${theme.colors.border}`, padding: "10px", borderRadius: "6px", background: theme.colors.cardAlt }}>
                  {categories.map(cat => (
                    <label key={cat} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", marginBottom: "4px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={widgetForm.query_config.categories.includes(cat)}
                        onChange={e => {
                          const isChecked = e.target.checked;
                          setWidgetForm(p => {
                            const cats = isChecked
                              ? [...p.query_config.categories, cat]
                              : p.query_config.categories.filter(c => c !== cat);
                            return { ...p, query_config: { ...p.query_config, categories: cats } };
                          });
                        }}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button style={styles.ghostButton} onClick={() => setShowWidgetModal(false)}>Cancel</button>
              <button style={styles.button} onClick={handleSaveWidget}>Add Widget</button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
