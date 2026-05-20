import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

export default function CategoryTrendChart({
  selectedCategory,
  categoryTrend,
  categories,
  onCategoryChange,
}) {
  const totalCategorySpend = categoryTrend.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  const avgCategorySpend =
    categoryTrend.length > 0 ? totalCategorySpend / categoryTrend.length : 0;

  const peakMonth = categoryTrend.reduce(
    (max, item) => ((item.amount || 0) > (max.amount || 0) ? item : max),
    { amount: 0, month: "-" },
  );

  const firstMonthAmount = categoryTrend[0]?.amount || 0;
  const lastMonthAmount = categoryTrend[categoryTrend.length - 1]?.amount || 0;

  const trendPercentage =
    firstMonthAmount > 0
      ? (
          ((lastMonthAmount - firstMonthAmount) / firstMonthAmount) *
          100
        ).toFixed(1)
      : 0;

  return (
    <div style={card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <div style={cardLabel}>{selectedCategory} Trend</div>

        <select
          value={selectedCategory}
          onChange={(e) => {
            onCategoryChange(e.target.value);
          }}
          style={{
            background: theme.colors.cardAlt,
            border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary,
            padding: "8px 12px",
            borderRadius: theme.layout.buttonRadius,
            fontFamily: theme.typography.body.fontFamily,
            fontSize: "13px",
          }}
        >
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.category}
            </option>
          ))}
        </select>
      </div>

      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={categoryTrend.map((item) => ({
              ...item,
              month: new Date(item.month + "-01").toLocaleString("en-IN", {
                month: "short",
                year: "2-digit",
              }),
            }))}
          >
            <defs>
              <linearGradient
                id="categoryFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={theme.colors.chart.secondary}
                  stopOpacity={0.35}
                />

                <stop
                  offset="95%"
                  stopColor={theme.colors.chart.secondary}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

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
              formatter={(v) => formatINR(v)}
              contentStyle={{
                background: theme.colors.chart.tooltipBg,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.layout.cardRadius,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.body.fontFamily,
                fontSize: "12px",
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke={theme.colors.chart.secondary}
              strokeWidth={2.5}
              fill="url(#categoryFill)"
            />
          </AreaChart>
        </ResponsiveContainer>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            alignItems: "center",
            fontFamily: theme.typography.body.fontFamily,
            fontSize: "14px",
            color: theme.colors.textSecondary,
            gap: "22px",
            marginTop: "15px",
          }}
        >
          <div>   </div>
          <div>
            <div className="metricLabel">Total Spend</div>

            <div className="metricValue expense">
              {formatINR(totalCategorySpend)}
            </div>
          </div>

          <div>
            <div className="metricLabel">Peak Month</div>

            <div className="metricValue">{peakMonth.month} </div>
          </div>

          <div>
            <div className="metricLabel">Avg / Month</div>

            <div className="metricValue">
              {formatINR(avgCategorySpend)}
            </div>
          </div>

          <div>
            <div className="metricLabel">Trend</div>

            <div
              className={
                trendPercentage >= 0 ? "positiveText" : "negativeText"
              }
            >
              {trendPercentage >= 0 ? "↑" : "↓"}{" "}
              {Math.abs(trendPercentage)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
