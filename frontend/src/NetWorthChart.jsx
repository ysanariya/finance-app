import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
} from "recharts";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";

export default function NetWorthChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchWithAuth(
          "http://localhost:8000/dashboard/trend"
        );

        const formatted = result.map((item) => ({
          date: item.date,
          net_worth: item.net_worth,
        }));

        setData(formatted);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  const isPositive =
    data.length > 1 &&
    data[data.length - 1].net_worth >= data[0].net_worth;

  return (
    <div
      style={{
        background: theme.colors.card,
        borderRadius: theme.layout.radius,
        border: `1px solid ${theme.colors.border}`,
        padding: "20px",
      }}
    >
      <div
        style={{
          color: theme.colors.textMuted,
          fontSize: "13px",
          marginBottom: "10px",
        }}
      >
        NET WORTH TREND
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          {/* Grid */}
          <CartesianGrid
            stroke={theme.colors.chart.grid}
            strokeDasharray="3 3"
          />

          {/* X Axis */}
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const d = new Date(value);
              return d.toLocaleDateString("en-IN", {
                month: "short",
                year: "2-digit",
              });
            }}
            tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
          />

          {/* Y Axis */}
          <YAxis
            tickFormatter={(value) =>
              `₹${(value / 100000).toFixed(1)}L`
            }
            tick={{ fill: theme.colors.chart.axis, fontSize: 12 }}
          />

          {/* Tooltip */}
          <Tooltip
            contentStyle={{
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{
              color: theme.colors.textMuted,
            }}
            formatter={(value) => {
              const lakh = value / 100000;
              return [`₹${lakh.toFixed(2)}L`, "Net Worth"];
            }}
            labelFormatter={(value) =>
              new Date(value).toLocaleDateString("en-IN")
            }
          />

          {/* Area (subtle fill) */}
          <Area
            type="monotone"
            dataKey="net_worth"
            stroke="none"
            fill={theme.colors.chart.area}
          />

          {/* Line */}
          <Line
            type="monotone"
            dataKey="net_worth"
            stroke={
              isPositive
                ? theme.colors.positive
                : theme.colors.negative
            }
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
			connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}