import { useEffect, useState } from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { fetchWithAuth } from "../api";
import { theme } from "../theme";

const formatINR = (value) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

const PIE_COLORS = theme.colors.chart.pie;

export default function Expenses() {

  const [summary, setSummary]           = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categories, setCategories]     = useState([]);
  const [merchants, setMerchants]       = useState([]);
  const [loading, setLoading]           = useState(true);

  async function loadData() {

    try {

      setLoading(true);

      const [summaryRes, trendRes, categoryRes, merchantRes] =
        await Promise.all([
          fetchWithAuth("http://localhost:8000/dashboard/monthly-cashflow"),
          fetchWithAuth("http://localhost:8000/dashboard/monthly-expense-trend"),
          fetchWithAuth("http://localhost:8000/dashboard/category-breakdown"),
          fetchWithAuth("http://localhost:8000/dashboard/top-merchants"),
        ]);

      setSummary({
        avg_monthly_income:   summaryRes?.income   || 0,
        avg_monthly_expense:  summaryRes?.expenses || 0,
        avg_monthly_surplus:  summaryRes?.surplus  || 0,
        savings_rate_pct:
          summaryRes?.income > 0
            ? ((summaryRes.surplus / summaryRes.income) * 100).toFixed(1)
            : 0,
      });

      setMonthlyTrend(trendRes?.trend || []);
      setCategories(categoryRes?.categories || []);

      const merchantData      = merchantRes?.merchants || [];
      const totalMerchantSpend = merchantData.reduce((sum, m) => sum + (m.amount || 0), 0);

      setMerchants(
        merchantData.map((m) => ({
          ...m,
          percentage:
            totalMerchantSpend > 0
              ? ((m.amount / totalMerchantSpend) * 100).toFixed(1)
              : 0,
        }))
      );

    } catch (err) {

      console.error("Expense dashboard error", err);

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div
        style={{
          padding:    "24px",
          color:      theme.colors.textSecondary,
          fontFamily: theme.typography.body.fontFamily,
          fontSize:   theme.typography.body.fontSize,
        }}
      >
        Loading...
      </div>
    );
  }

  return (

    <div
      style={{
        padding:    "24px",
        background: theme.colors.background,
        minHeight:  "100vh",
      }}
    >

      {/* HEADER */}

      <div style={{ marginBottom: "24px" }}>

        <h1
          style={{
            margin:        0,
            fontFamily:    theme.typography.heading.fontFamily,
            fontWeight:    theme.typography.heading.fontWeight,
            fontSize:      theme.typography.heading.fontSize,
            letterSpacing: theme.typography.heading.letterSpacing,
            color:         theme.colors.textPrimary,
          }}
        >
          Cash Flow Analytics
        </h1>

        <p
          style={{
            margin:     "4px 0 0",
            fontFamily: theme.typography.body.fontFamily,
            fontSize:   theme.typography.body.fontSize,
            color:      theme.colors.textSecondary,
          }}
        >
          Income and Spending behaviour with cashflow trends
        </p>

      </div>

      {/* SUMMARY CARDS */}

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 "16px",
          marginBottom:        "16px",
        }}
      >

        {/* INCOME */}
        <div style={card}>
          <div style={cardLabel}>Average Monthly Income</div>
          <div style={{ ...cardValue, color: theme.colors.positive }}>
            {formatINR(summary?.avg_monthly_income)}
          </div>
        </div>

        {/* EXPENSE */}
        <div style={card}>
          <div style={cardLabel}>Average Monthly Expenses</div>
          <div style={{ ...cardValue, color: theme.colors.negative }}>
            {formatINR(summary?.avg_monthly_expense)}
          </div>
        </div>

        {/* SURPLUS */}
        <div style={card}>
          <div style={cardLabel}>Average Monthly Surplus</div>
          <div style={{ ...cardValue, color: theme.colors.textPrimary }}>
            {formatINR(summary?.avg_monthly_surplus)}
          </div>
          <div
            style={{
              marginTop:  "10px",
              fontFamily: theme.typography.body.fontFamily,
              fontSize:   "12px",
              color:      theme.colors.textSecondary,
            }}
          >
            Savings Rate:{" "}
            <span style={{ color: theme.colors.positive, fontWeight: 500 }}>
              {summary?.savings_rate_pct}%
            </span>
            {" · "}Target: 20%
          </div>
        </div>

      </div>

      {/* CHART ROW */}

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap:                 "16px",
          marginBottom:        "16px",
        }}
      >

        {/* MONTHLY TREND */}
        <div style={card}>

          <div style={cardLabel}>Monthly Expense Trend</div>

          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrend.map((item) => ({
                  ...item,
                  month: new Date(item.month + "-01").toLocaleString("en-IN", {
                    month: "short",
                    year:  "2-digit",
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
                    fill:       theme.colors.chart.axis,
                    fontSize:   11,
                    fontFamily: theme.typography.body.fontFamily,
                  }}
                />
                <YAxis
                  tickFormatter={(v) => "₹" + Math.round(v / 1000) + "k"}
                  tick={{
                    fill:       theme.colors.chart.axis,
                    fontSize:   11,
                    fontFamily: theme.typography.body.fontFamily,
                  }}
                />
                <Tooltip
                  formatter={(v) => formatINR(v)}
                  contentStyle={{
                    background:   theme.colors.chart.tooltipBg,
                    border:       `1px solid ${theme.colors.border}`,
                    borderRadius: theme.layout.cardRadius,
                    color:        theme.colors.textPrimary,
                    fontFamily:   theme.typography.body.fontFamily,
                    fontSize:     "12px",
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill={theme.colors.chart.secondary}
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* CATEGORY PIE */}
        <div style={card}>

          <div style={cardLabel}>Spending by Category</div>

          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="amount"
                  nameKey="category"
                  outerRadius={95}
                  innerRadius={48}
                  paddingAngle={2}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatINR(v)}
                  contentStyle={{
                    background:   theme.colors.chart.tooltipBg,
                    border:       `1px solid ${theme.colors.border}`,
                    borderRadius: theme.layout.cardRadius,
                    color:        theme.colors.textPrimary,
                    fontFamily:   theme.typography.body.fontFamily,
                    fontSize:     "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize:   "12px",
                    color:      theme.colors.textSecondary,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {/* TOP MERCHANTS TABLE */}

      <div style={card}>

        <div style={cardLabel}>Top Merchants</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>

            <thead
              style={{
                background:   theme.table.headerBackground,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
            >
              <tr>
                {["Rank", "Merchant", "Amount", "Share"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign:     i >= 2 ? "right" : "left",
                      padding:       `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                      fontFamily:    theme.table.headerFontFamily,
                      fontSize:      theme.table.headerFontSize,
                      fontWeight:    theme.table.headerFontWeight,
                      letterSpacing: theme.table.headerLetterSpacing,
                      textTransform: theme.table.headerTextTransform,
                      color:         theme.table.headerColor,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {merchants.map((m, index) => (
                <tr
                  key={m.merchant}
                  style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.table.rowHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >

                  {/* Rank */}
                  <td
                    style={{
                      ...cellStyle,
                      fontFamily: theme.table.dateFontFamily,
                      color:      theme.colors.textMuted,
                    }}
                  >
                    #{index + 1}
                  </td>

                  {/* Merchant */}
                  <td
                    style={{
                      ...cellStyle,
                      fontWeight: theme.table.merchantFontWeight,
                      color:      theme.table.merchantColor,
                    }}
                  >
                    {m.merchant}
                  </td>

                  {/* Amount */}
                  <td
                    style={{
                      ...cellStyle,
                      textAlign:  "right",
                      fontFamily: theme.table.amountFontFamily,
                      fontWeight: theme.table.amountFontWeight,
                      fontSize:   theme.table.amountFontSize,
                      color:      theme.table.amountColorExpense,
                    }}
                  >
                    {formatINR(m.amount)}
                  </td>

                  {/* Share */}
                  <td
                    style={{
                      ...cellStyle,
                      textAlign:  "right",
                      fontFamily: theme.table.dateFontFamily,
                      color:      theme.colors.textSecondary,
                    }}
                  >
                    {m.percentage}%
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}

// ── Shared style constants ────────────────────────────────────────────────────

const card = {
  background:   theme.colors.card,
  border:       `1px solid ${theme.colors.border}`,
  borderRadius: theme.layout.cardRadius,
  padding:      "20px",
  marginBottom: 0,
};

const cardLabel = {
  fontFamily:    theme.table.headerFontFamily,
  fontSize:      theme.table.headerFontSize,
  fontWeight:    theme.table.headerFontWeight,
  letterSpacing: theme.table.headerLetterSpacing,
  textTransform: theme.table.headerTextTransform,
  color:         theme.table.headerColor,
  marginBottom:  "14px",
};

const cardValue = {
  fontFamily: theme.table.amountFontFamily,
  fontWeight: theme.table.amountFontWeight,
  fontSize:   "22px",
};

const cellStyle = {
  padding:    `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
  color:      theme.table.cellColor,
  fontFamily: theme.table.cellFontFamily,
  fontSize:   theme.table.cellFontSize,
  lineHeight: theme.table.cellLineHeight,
};