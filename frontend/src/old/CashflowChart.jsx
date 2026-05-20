import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./services/api";
import { theme } from "./theme";

export default function CashflowChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth(
        "http://localhost:8000/dashboard/cashflow-trend?start_year=2026&start_month=1&end_year=2026&end_month=6"
      );

      setData(res);
    }

    load();
  }, []);

  const formatLakh = (val) =>
    `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div
      style={{
        background: "#141414",
        borderRadius: "16px",
        border: `1px solid ${theme.colors.border}`,
        padding: "16px",
      }}
    >
      {/* TITLE */}
      <div
        style={{
          fontSize: "12px",
          color: theme.colors.textMuted,
          marginBottom: "12px",
          letterSpacing: "0.06em",
        }}
      >
        CASHFLOW TREND
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid
            stroke={theme.colors.chart.grid}
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="month"
            tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
          />

          <YAxis
            tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
            tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
          />

          <Tooltip
            formatter={(value) => formatLakh(value)}
            contentStyle={{
              backgroundColor: "#181818",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />

          <ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid
      stroke={theme.colors.chart.grid}
      strokeDasharray="3 3"
    />

    <XAxis
      dataKey="month"
      tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
    />

    <YAxis
      tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
      tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
    />

    <Tooltip
      formatter={(value) => formatLakh(value)}
      contentStyle={{
        backgroundColor: "#181818",
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "8px",
        fontSize: "12px",
      }}
    />

    {/* Income */}
    <Bar
      dataKey="income"
      fill={theme.colors.positive}
      radius={[6, 6, 0, 0]}
      barSize={20}
    />

    {/* Expenses */}
    <Bar
      dataKey="fixed_expenses"
      fill={theme.colors.negative}
      radius={[6, 6, 0, 0]}
      barSize={20}
    />

    {/* Subtle surplus line */}
    <Line
      type="monotone"
      dataKey="surplus"
      stroke="#85B7EB" // 👈 softer blue from your palette
      strokeWidth={2}
      dot={false}
    />
  </BarChart>
</ResponsiveContainer>

          {/* Income */}
          <Bar
            dataKey="income"
            fill={theme.colors.positive}
            radius={[4, 4, 0, 0]}
          />

          {/* Expenses */}
          <Bar
            dataKey="fixed_expenses"
            fill={theme.colors.negative}
            radius={[4, 4, 0, 0]}
          />

          {/* Surplus line */}
          <Line
            type="monotone"
            dataKey="surplus"
            stroke={theme.colors.stocks}
            strokeWidth={2}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}