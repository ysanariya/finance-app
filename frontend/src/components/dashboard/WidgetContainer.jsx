import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { theme } from "../../theme/theme.js";

const formatINR = (value) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export default function WidgetContainer({ widget, isEditing, onRemove }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWidgetData() {
      try {
        setLoading(true);
        setError(null);
        
        let queryParams = {};
        try {
          queryParams = JSON.parse(widget.query_config);
        } catch (e) {
          console.error("Invalid query_config JSON", e);
        }

        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/reports/query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            start_date: queryParams.start_date || null,
            end_date: queryParams.end_date || null,
            transaction_type: queryParams.transaction_type || "expense",
            categories: queryParams.categories || null,
            split_by: queryParams.split_by || null,
            sort_by: queryParams.sort_by || "amount",
            sort_order: queryParams.sort_order || "desc"
          })
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.reload();
          return;
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error("Widget fetch failed:", res.status, errText);
          throw new Error("Failed to load widget data");
        }

        const json = await res.json();
        console.log("Widget data loaded:", widget.title, json);
        setData(json.data || []);
      } catch (err) {
        console.error("Widget error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWidgetData();
  }, [widget.query_config]);

  // Visual Styling Mapping
  const cardStyle = {
    background: theme.colors.glassCard,
    backdropFilter: "blur(12px)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.layout.cardRadius,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    position: "relative",
    boxSizing: "border-box",
  };

  const titleStyle = {
    fontFamily: theme.typography.subheading.fontFamily,
    fontSize: theme.typography.subheading.fontSize,
    fontWeight: theme.typography.subheading.fontWeight,
    color: theme.colors.textPrimary,
    marginBottom: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  };

  const removeBtnStyle = {
    background: "transparent",
    border: "none",
    color: theme.colors.negative,
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600
  };

  const contentStyle = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px"
  };

  const renderContent = () => {
    if (loading) {
      return <div style={{ color: theme.colors.textSecondary }}>Loading...</div>;
    }
    if (error) {
      return <div style={{ color: theme.colors.negative }}>Error: {error}</div>;
    }
    if (!data || data.length === 0) {
      return <div style={{ color: theme.colors.textMuted }}>No transactions found</div>;
    }

    const type = widget.type;

    if (type === "summary_card") {
      const total = data.reduce((sum, item) => sum + (item.value || item.amount || 0), 0);
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", fontFamily: theme.typography.mono.fontFamily, color: theme.colors.positive }}>
            {formatINR(total)}
          </div>
          <div style={{ fontSize: "11px", color: theme.colors.textSecondary, marginTop: "6px" }}>
            Aggregate Sum
          </div>
        </div>
      );
    }

    if (type === "table") {
      return (
        <div style={{ width: "100%", maxHeight: "100%", overflowY: "auto", border: `1px solid ${theme.colors.border}`, borderRadius: "6px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: theme.table.headerBackground, borderBottom: `1px solid ${theme.table.border}` }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: theme.colors.textSecondary }}>Label</th>
                <th style={{ padding: "8px 12px", textAlign: "right", color: theme.colors.textSecondary }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${theme.table.border}`, background: idx % 2 === 0 ? "transparent" : theme.colors.cardAlt }}>
                  <td style={{ padding: "8px 12px", color: theme.colors.textPrimary }}>{item.label || item.description || "Unknown"}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", color: theme.colors.positive, fontFamily: theme.typography.mono.fontFamily }}>{formatINR(item.value || item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Chart Viz configs
    if (type === "bar") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.chart.grid} />
            <XAxis dataKey="label" tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <YAxis tickFormatter={(v) => Math.round(v / 1000) + "k"} tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <Tooltip
              formatter={(val) => [formatINR(val), "Amount"]}
              contentStyle={{ background: theme.colors.chart.tooltipBg, border: `1px solid ${theme.colors.border}`, borderRadius: "6px", color: "#fff", fontSize: "11px" }}
            />
            <Bar dataKey="value" fill={theme.colors.chart.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === "line") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.chart.grid} />
            <XAxis dataKey="label" tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <YAxis tickFormatter={(v) => Math.round(v / 1000) + "k"} tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <Tooltip
              formatter={(val) => [formatINR(val), "Amount"]}
              contentStyle={{ background: theme.colors.chart.tooltipBg, border: `1px solid ${theme.colors.border}`, borderRadius: "6px", color: "#fff", fontSize: "11px" }}
            />
            <Line type="monotone" dataKey="value" stroke={theme.colors.chart.tertiary} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === "area") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.chart.grid} />
            <XAxis dataKey="label" tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <YAxis tickFormatter={(v) => Math.round(v / 1000) + "k"} tick={{ fill: theme.colors.chart.axis, fontSize: 10 }} />
            <Tooltip
              formatter={(val) => [formatINR(val), "Amount"]}
              contentStyle={{ background: theme.colors.chart.tooltipBg, border: `1px solid ${theme.colors.border}`, borderRadius: "6px", color: "#fff", fontSize: "11px" }}
            />
            <Area type="monotone" dataKey="value" stroke={theme.colors.chart.primary} fill={theme.colors.chart.area} />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (type === "donut") {
      const COLORS = theme.colors.chart.pie;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => [formatINR(val), "Amount"]} />
            <Legend wrapperStyle={{ fontSize: "10px", marginTop: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return <div style={{ color: theme.colors.textSecondary }}>Unsupported Widget Type</div>;
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>
        <span>{widget.title}</span>
        {isEditing && (
          <button style={removeBtnStyle} onClick={onRemove}>
            Delete
          </button>
        )}
      </div>
      <div style={contentStyle}>
        {renderContent()}
      </div>
    </div>
  );
}
