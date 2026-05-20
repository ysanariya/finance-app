import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./services/api";
import { theme } from "./theme";

const c = theme.colors;

export default function NetWorthChart() {
  const [data, setData] = useState([]);

  // ── API call unchanged ──────────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchWithAuth(
          "http://localhost:8000/dashboard/trend"
        );
        setData(
          result.map((item) => ({
            date:      item.date,
            net_worth: item.net_worth,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const isPositive =
    data.length > 1 &&
    data[data.length - 1].net_worth >= data[0].net_worth;

  const lineColor = isPositive ? c.positive : c.negative;

  return (
    <div
      style={{
        background: c.card,
        border: `0.5px solid ${c.border}`,
        borderRadius: theme.layout.cardRadius,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: c.textMuted,
          letterSpacing: "0.1em",
          marginBottom: "12px",
        }}
      >
        NET WORTH TREND
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid
            stroke={c.chart.grid}
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const d = new Date(value);
              return d.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit",
              });
            }}
            tick={{ fill: c.chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
            tick={{ fill: c.chart.axis, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: c.card,
              border: `0.5px solid ${c.border}`,
              borderRadius: "6px",
              fontSize: "11px",
              color: c.textPrimary,
            }}
            labelStyle={{ color: c.textMuted, marginBottom: "2px" }}
            formatter={(value) => {
              const lakh = value / 100000;
              return [`₹${lakh.toFixed(2)}L`, "Net Worth"];
            }}
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString("en-IN")
            }
          />

          <Line
            type="monotone"
            dataKey="net_worth"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 2.5, fill: lineColor, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
