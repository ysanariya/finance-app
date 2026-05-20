import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./services/api";
import { theme } from "./theme";

const c = theme.colors;

const LEGEND = [
  { key: "income",         color: c.positive, label: "Income" },
  { key: "fixed_expenses", color: c.negative, label: "Expenses" },
  { key: "surplus",        color: c.neutral,  label: "Surplus" },
];

export default function CashflowChart() {
  const [data, setData] = useState([]);

  // ── API call unchanged ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth(
        "http://localhost:8000/dashboard/cashflow-trend?start_year=2026&start_month=1&end_year=2026&end_month=6"
      );
      setData(res);
    }
    load();
  }, []);

  const formatLakh = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div
      style={{
        background: c.card,
        border: `0.5px solid ${c.border}`,
        borderRadius: theme.layout.cardRadius,
        padding: "14px 16px",
      }}
    >
      {/* Title + legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "9px", color: c.textMuted, letterSpacing: "0.1em" }}>
          CASHFLOW TREND
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {LEGEND.map((l) => (
            <div
              key={l.key}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "1.5px",
                  background: l.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "9px", color: c.textMuted }}>
                {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/*
        ComposedChart lets us mix Bar + Line in one chart.
        Previous code had a nested duplicate BarChart which broke rendering.
      */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            stroke={c.chart.grid}
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fill: c.chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            tick={{ fill: c.chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />

          <Tooltip
            formatter={(value) => formatLakh(value)}
            contentStyle={{
              backgroundColor: c.card,
              border: `0.5px solid ${c.border}`,
              borderRadius: "6px",
              fontSize: "11px",
              color: c.textPrimary,
            }}
            labelStyle={{ color: c.textMuted, marginBottom: "2px" }}
          />

          {/* Income bars */}
          <Bar
            dataKey="income"
            fill={c.positive}
            fillOpacity={0.25}
            radius={[3, 3, 0, 0]}
            barSize={18}
          />

          {/* Expense bars */}
          <Bar
            dataKey="fixed_expenses"
            fill={c.negative}
            fillOpacity={0.25}
            radius={[3, 3, 0, 0]}
            barSize={18}
          />

          {/* Surplus line overlay */}
          <Line
            type="monotone"
            dataKey="surplus"
            stroke={c.neutral}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
