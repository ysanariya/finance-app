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

import { fetchWithAuth } from "../services/api";

import { theme } from "../theme";

const formatINR = (value) => {
  return (
    "\u20B9" +
    Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )
  );
};

const PIE_COLORS =
  theme.colors.chart.pie;

export default function Expenses() {

  const [summary, setSummary] =
    useState(null);

  const [monthlyTrend, setMonthlyTrend] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [merchants, setMerchants] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function loadData() {

    try {

      setLoading(true);

      const [
        summaryRes,
        trendRes,
        categoryRes,
        merchantRes,
      ] = await Promise.all([

        fetchWithAuth(
          "http://localhost:8000/dashboard/monthly-cashflow"
        ),

        fetchWithAuth(
          "http://localhost:8000/dashboard/monthly-expense-trend"
        ),

        fetchWithAuth(
          "http://localhost:8000/dashboard/category-breakdown"
        ),

        fetchWithAuth(
          "http://localhost:8000/dashboard/top-merchants"
        ),
      ]);

      setSummary({

        avg_monthly_income:
          summaryRes?.income || 0,

        avg_monthly_expense:
          summaryRes?.expenses || 0,

        avg_monthly_surplus:
          summaryRes?.surplus || 0,

        savings_rate_pct:
          summaryRes?.income > 0

            ? (
                (summaryRes.surplus /
                  summaryRes.income) *
                100
              ).toFixed(1)

            : 0,
      });

      setMonthlyTrend(
        trendRes?.trend || []
      );

      setCategories(
        categoryRes?.categories || []
      );

      const merchantData =
        merchantRes?.merchants || [];

      const totalMerchantSpend =
        merchantData.reduce(

          (sum, m) =>
            sum + (m.amount || 0),

          0
        );

      setMerchants(

        merchantData.map((m) => ({

          ...m,

          percentage:
            totalMerchantSpend > 0

              ? (
                  (m.amount /
                    totalMerchantSpend) *
                  100
                ).toFixed(1)

              : 0,
        }))
      );

    } catch (err) {

      console.error(
        "Expense dashboard error",
        err
      );

    } finally {

      setLoading(false);
    }
  }

  useEffect(() => {

    loadData();

  }, []);

  if (loading) {

    return (

      <div
        style={{
          padding: "24px",

          color:
            theme.colors.textSecondary,
        }}
      >
        Loading...
      </div>
    );
  }

  return (

    <div
      style={{
        padding: "24px",

        background:
          theme.colors.background,

        minHeight: "100vh",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "20px",
        }}
      >

        <div
          style={{
            fontSize: "18px",

            fontWeight: 600,

            color:
              theme.colors.textPrimary,
          }}
        >
          Expense Analytics
        </div>

        <div
          style={{
            marginTop: "4px",

            fontSize: "13px",

            color:
              theme.colors.textSecondary,
          }}
        >
          Spending behaviour and
          cashflow trends
        </div>

      </div>

      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(3, 1fr)",

          gap: "16px",

          marginBottom: "20px",
        }}
      >

        {/* INCOME */}

        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius: "18px",

            padding: "20px",
          }}
        >

          <div
            style={{
              fontSize: "12px",

              color:
                theme.colors.textSecondary,

              textTransform: "uppercase",

              marginBottom: "10px",

              letterSpacing: "0.08em",
            }}
          >
            Average Monthly Income
          </div>

          <div
            style={{
              fontSize: "22px",

              fontWeight: 600,

              color:
                theme.colors.positive,
            }}
          >
            {formatINR(
              summary?.avg_monthly_income
            )}
          </div>

        </div>

        {/* EXPENSE */}

        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius: "18px",

            padding: "20px",
          }}
        >

          <div
            style={{
              fontSize: "12px",

              color:
                theme.colors.textSecondary,

              textTransform: "uppercase",

              marginBottom: "10px",

              letterSpacing: "0.08em",
            }}
          >
            Average Monthly Expenses
          </div>

          <div
            style={{
              fontSize: "22px",

              fontWeight: 600,

              color:
                theme.colors.negative,
            }}
          >
            {formatINR(
              summary?.avg_monthly_expense
            )}
          </div>

        </div>

        {/* SURPLUS */}

        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius: "18px",

            padding: "20px",
          }}
        >

          <div
            style={{
              fontSize: "12px",

              color:
                theme.colors.textSecondary,

              textTransform: "uppercase",

              marginBottom: "10px",

              letterSpacing: "0.08em",
            }}
          >
            Average Monthly Surplus
          </div>

          <div
            style={{
              fontSize: "22px",

              fontWeight: 600,

              color:
                theme.colors.textPrimary,
            }}
          >
            {formatINR(
              summary?.avg_monthly_surplus
            )}
          </div>

          <div
            style={{
              marginTop: "8px",

              fontSize: "13px",

              color:
                theme.colors.textSecondary,
            }}
          >
            Savings Rate:{" "}

            <span
              style={{
                color:
                  theme.colors.positive,
              }}
            >
              {
                summary?.savings_rate_pct
              }%
            </span>

            {" · "}
            Target: 20%
          </div>

        </div>

      </div>

      {/* CHART ROW */}

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "1.2fr 1fr",

          gap: "16px",

          marginBottom: "20px",
        }}
      >

        {/* MONTHLY TREND */}

        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius: "18px",

            padding: "20px",
          }}
        >

          <div
            style={{
              fontSize: "12px",

              color:
                theme.colors.textSecondary,

              textTransform: "uppercase",

              marginBottom: "16px",

              letterSpacing: "0.08em",
            }}
          >
            Monthly Expense Trend
          </div>

          <div
            style={{
              height: 320,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={monthlyTrend.map(
                  (item) => ({

                    ...item,

                    month:
                      new Date(
                        item.month + "-01"
                      ).toLocaleString(
                        "en-IN",
                        {
                          month: "short",
                          year: "2-digit",
                        }
                      ),
                  })
                )}
              >

                <CartesianGrid
                  strokeDasharray="3 3"

                  stroke={
                    theme.colors.chart.grid
                  }
                />

                <XAxis
                  dataKey="month"

                  tick={{
                    fill:
                      theme.colors.chart.axis,

                    fontSize: 12,
                  }}
                />

                <YAxis
                  tickFormatter={(v) =>
                    "\u20B9" +
                    Math.round(
                      v / 1000
                    ) +
                    "k"
                  }

                  tick={{
                    fill:
                      theme.colors.chart.axis,

                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(v) =>
                    formatINR(v)
                  }

                  contentStyle={{
                    background:
                      theme.colors.chart.tooltipBg,

                    border:
                      `1px solid ${theme.colors.border}`,

                    borderRadius: "10px",

                    color:
                      theme.colors.textPrimary,
                  }}
                />

                <Bar
                  dataKey="amount"

                  fill={
                    theme.colors.chart.secondary
                  }

                  radius={[6, 6, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* CATEGORY PIE */}

        <div
          style={{
            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius: "18px",

            padding: "20px",
          }}
        >

          <div
            style={{
              fontSize: "12px",

              color:
                theme.colors.textSecondary,

              textTransform: "uppercase",

              marginBottom: "16px",

              letterSpacing: "0.08em",
            }}
          >
            Spending by Category
          </div>

          <div
            style={{
              height: 320,
            }}
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={categories}

                  dataKey="amount"

                  nameKey="category"

                  outerRadius={95}

                  innerRadius={48}

                  paddingAngle={2}
                >

                  {categories.map(
                    (entry, index) => (

                      <Cell
                        key={index}

                        fill={
                          PIE_COLORS[
                            index %
                              PIE_COLORS.length
                          ]
                        }
                      />
                    )
                  )}

                </Pie>

                <Tooltip
                  formatter={(v) =>
                    formatINR(v)
                  }

                  contentStyle={{
                    background:
                      theme.colors.chart.tooltipBg,

                    border:
                      `1px solid ${theme.colors.border}`,

                    borderRadius: "10px",
                  }}
                />

                <Legend
                  wrapperStyle={{
                    fontSize: "12px",

                    color:
                      theme.colors.textSecondary,
                  }}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

      </div>

      {/* MERCHANTS */}

      <div
        style={{
          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius: "18px",

          padding: "20px",
        }}
      >

        <div
          style={{
            fontSize: "12px",

            color:
              theme.colors.textSecondary,

            textTransform: "uppercase",

            marginBottom: "18px",

            letterSpacing: "0.08em",
          }}
        >
          Top Merchants
        </div>

        <div
  style={{
    background:
      theme.colors.card,

    border:
      `1px solid ${theme.colors.border}`,

    borderRadius: "18px",

    padding: "20px",
  }}
>

  <div
    style={{
      fontSize: "12px",

      color:
        theme.colors.textSecondary,

      textTransform: "uppercase",

      marginBottom: "18px",

      letterSpacing: "0.08em",
    }}
  >
    Top Merchants
  </div>

  <div
    style={{
      overflowX: "auto",
    }}
  >

    <table
      style={{
        width: "100%",

        borderCollapse:
          "collapse",
      }}
    >

      <thead>

        <tr
          style={{
            borderBottom:
              `1px solid ${theme.colors.border}`,
          }}
        >

          <th
            style={{
              textAlign: "left",

              paddingBottom: "12px",

              fontSize: "12px",

              fontWeight: 500,

              color:
                theme.colors.textSecondary,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.08em",
            }}
          >
            Rank
          </th>

          <th
            style={{
              textAlign: "left",

              paddingBottom: "12px",

              fontSize: "12px",

              fontWeight: 500,

              color:
                theme.colors.textSecondary,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.08em",
            }}
          >
            Merchant
          </th>

          <th
            style={{
              textAlign: "right",

              paddingBottom: "12px",

              fontSize: "12px",

              fontWeight: 500,

              color:
                theme.colors.textSecondary,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.08em",
            }}
          >
            Amount
          </th>

          <th
            style={{
              textAlign: "right",

              paddingBottom: "12px",

              fontSize: "12px",

              fontWeight: 500,

              color:
                theme.colors.textSecondary,

              textTransform:
                "uppercase",

              letterSpacing:
                "0.08em",
            }}
          >
            Share
          </th>

        </tr>

      </thead>

      <tbody>

        {merchants.map(
          (m, index) => (

            <tr
              key={m.merchant}
              style={{
                borderBottom:
                  `1px solid ${theme.colors.border}`,
              }}
            >

              <td
                style={{
                  padding:
                    "14px 0",

                  color:
                    theme.colors.textSecondary,

                  fontSize: "14px",
                }}
              >
                #{index + 1}
              </td>

              <td
                style={{
                  padding:
                    "14px 0",

                  color:
                    theme.colors.textPrimary,

                  fontSize: "14px",

                  fontWeight: 500,
                }}
              >
                {m.merchant}
              </td>

              <td
                style={{
                  padding:
                    "14px 0",

                  textAlign:
                    "right",

                  color:
                    theme.colors.negative,

                  fontSize: "14px",

                  fontWeight: 500,
                }}
              >
                {formatINR(
                  m.amount
                )}
              </td>

              <td
                style={{
                  padding:
                    "14px 0",

                  textAlign:
                    "right",

                  color:
                    theme.colors.textSecondary,

                  fontSize: "13px",
                }}
              >
                {m.percentage}%
              </td>

            </tr>
          )
        )}

      </tbody>

    </table>

  </div>

</div>

      </div>

    </div>
  );
}