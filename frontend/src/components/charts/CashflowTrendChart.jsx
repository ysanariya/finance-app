import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { theme } from "@/theme/theme.js";

const formatINR = (value) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const card = {
  background: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.layout.cardRadius,
  padding: "20px",
  marginBottom: 0,
};

const cardLabel = {
  fontFamily: theme.table.headerFontFamily,
  fontSize: theme.table.headerFontSize,
  fontWeight: theme.table.headerFontWeight,
  letterSpacing: theme.table.headerLetterSpacing,
  textTransform: theme.table.headerTextTransform,
  color: theme.table.headerColor,
  marginBottom: "14px",
};

const periodStyle = {
  color: theme.colors.textMuted,
  fontFamily: theme.typography.caption.fontFamily,
  fontSize: theme.typography.caption.fontSize,
  marginBottom: "12px",
  marginTop: "-8px",
};

export default function CashflowTrendChart({
  combinedCashflowTrend,
  periodLabel,
}) {
  return (
    <div style={{ ...card, gridColumn: "span 2" }}>
      <div style={cardLabel}>Cashflow Trend</div>
      <div style={periodStyle}>{periodLabel}</div>

      <div style={{ height: 340 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={combinedCashflowTrend.map((item) => ({
              ...item,
              month: new Date(item.month + "-01").toLocaleString("en-IN", {
                month: "short",
                year: "2-digit",
              }),
            }))}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.colors.chart.grid}
            />

            <XAxis
              dataKey="month"
              tick={{
                fill: theme.colors.chart.axis,
                fontSize: 11,
                fontFamily: theme.typography.body.fontFamily,
              }}
            />

            <YAxis
              tickFormatter={(v) => "₹" + Math.round(v / 1000) + "k"}
              tick={{
                fill: theme.colors.chart.axis,
                fontSize: 11,
                fontFamily: theme.typography.body.fontFamily,
              }}
            />

            <Tooltip
              formatter={(value, name) => [
                formatINR(value),
                name === "income"
                  ? "Income"
                  : name === "expense"
                    ? "Expense"
                    : "Surplus",
              ]}
              contentStyle={{
                background: theme.colors.chart.tooltipBg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.layout.cardRadius,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.body.fontFamily,
                fontSize: "12px",
              }}
              labelStyle={{
                color: theme.colors.textPrimary,
                marginBottom: 6,
                fontWeight: 600,
              }}
            />

            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontFamily: theme.typography.body.fontFamily,
                color: theme.colors.textSecondary,
                paddingTop: 8,
              }}
            />

            {/* INCOME */}
            <Bar
              dataKey="income"
              name="income"
              fill={theme.colors.chart.primary}
              radius={[4, 4, 0, 0]}
              barSize={24}
            />

            {/* EXPENSE */}
            <Bar
              dataKey="expense"
              name="expense"
              fill={theme.colors.chart.secondary}
              radius={[4, 4, 0, 0]}
              barSize={24}
            />

            {/* SURPLUS */}
            <Line
              type="monotone"
              dataKey="surplus"
              name="surplus"
              stroke={theme.colors.chart.dotties}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={{
                r: 4,
                fill: theme.colors.chart.tertiary,
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: theme.colors.chart.dotties,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
