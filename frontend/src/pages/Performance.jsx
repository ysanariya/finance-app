import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

import { theme } from "@/theme/theme.js";

import {
  getBudgetDeviation,
  getBudgetCategoryTrend,
} from "@/services/budgetAPI";

import { formatINR }
from "@/utils/formatters";


export default function Performance() {

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState(null);

  const [selectedPeriod, setSelectedPeriod] =
    useState("current_month");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [trendData, setTrendData] =
    useState([]);

  const [drawerLoading, setDrawerLoading] =
    useState(false);

  //////////////////////////////////////////////////
  // DATE RANGE
  //////////////////////////////////////////////////

  function buildDateRange() {

    const now = new Date();

    if (
      selectedPeriod
      === "current_month"
    ) {

      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      );

      return {

        startDate:
          start.toISOString().split("T")[0],

        endDate:
          end.toISOString().split("T")[0],

        budgetType:
          "monthly",
      };
    }

    if (
      selectedPeriod
      === "previous_month"
    ) {

      const start = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      );

      return {

        startDate:
          start.toISOString().split("T")[0],

        endDate:
          end.toISOString().split("T")[0],

        budgetType:
          "monthly",
      };
    }

    return {

      startDate:
        `${now.getFullYear()}-01-01`,

      endDate:
        `${now.getFullYear()}-12-31`,

      budgetType:
        "annual",
    };
  }

  //////////////////////////////////////////////////
  // FETCH
  //////////////////////////////////////////////////

  useEffect(() => {

    async function load() {

      try {

        setLoading(true);

        const range =
          buildDateRange();

        const res =
          await getBudgetDeviation({

            startDate:
              range.startDate,

            endDate:
              range.endDate,

            budgetType:
              range.budgetType,
          });

        setData(res);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);
      }
    }

    load();

  }, [selectedPeriod]);

  useEffect(() => {

  async function loadTrend() {

    if (!selectedCategory) {

      setTrendData([]);
      return;
    }

    try {

      setDrawerLoading(true);

      const range =
        buildDateRange();

      const res =
        await getBudgetCategoryTrend({

          category:
            selectedCategory,

          startDate:
            range.startDate,

          endDate:
            range.endDate,
        });

      setTrendData(
        res.trend || []
      );

    } catch (err) {

      console.error(err);

    } finally {

      setDrawerLoading(false);
    }
  }

  loadTrend();

}, [selectedCategory, selectedPeriod]);

  //////////////////////////////////////////////////
  // DERIVED
  //////////////////////////////////////////////////

  const categories =
    useMemo(() => {

      if (!data?.categories)
        return [];

      return [...data.categories]

      .sort(
        (a, b) =>
          b.deviation_pct
          - a.deviation_pct
      );

    }, [data]);

  const summary =
    data?.summary;

  //////////////////////////////////////////////////
  // TOOLTIP
  //////////////////////////////////////////////////

  function CustomTooltip({

    active,
    payload,
  }) {

    if (
      !active
      || !payload?.length
    ) {

      return null;
    }

    const item =
      payload[0].payload;

    return (

      <div
        style={{

          background:
            theme.colors.chart.tooltipBg,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            "10px",

          padding:
            "12px",

          minWidth:
            "220px",
        }}
      >

        <div
          style={{

            color:
              theme.colors.textPrimary,

            marginBottom:
              "8px",

            ...theme.typography.subheading,
          }}
        >

          {item.category}

        </div>

        <div
          style={{

            color:
              theme.colors.textSecondary,

            ...theme.typography.body,
          }}
        >

          Budget:
          {" "}
          {formatINR(
            item.budget_amount
          )}

        </div>

        <div
          style={{

            color:
              theme.colors.textSecondary,

            ...theme.typography.body,
          }}
        >

          Actual:
          {" "}
          {formatINR(
            item.actual_spent
          )}

        </div>

        <div
          style={{

            marginTop:
              "8px",

            color:

              item.deviation_amount > 0

              ? theme.colors.negative

              : theme.colors.positive,

            ...theme.typography.amount,
          }}
        >

          {item.deviation_pct}%

        </div>

      </div>
    );
  }

  //////////////////////////////////////////////////
  // LOADING
  //////////////////////////////////////////////////

  if (loading) {

    return (

      <div
        style={{

          padding:
            "24px",

          color:
            theme.colors.textPrimary,
        }}
      >

        Loading performance...

      </div>
    );
  }

  //////////////////////////////////////////////////
  // EMPTY
  //////////////////////////////////////////////////

  if (
    !categories.length
  ) {

    return (

      <div
        style={{

          padding:
            "32px",

          color:
            theme.colors.textSecondary,
        }}
      >

        No budget data found.

      </div>
    );
  }

  //////////////////////////////////////////////////
  // PAGE
  //////////////////////////////////////////////////

  return (

    <div
      style={{

        padding:
          "24px",

        display:
          "flex",

        flexDirection:
          "column",

        gap:
          "24px",
      }}
    >


      <div>

        <h1
          style={{

            color:
              theme.colors.textPrimary,

            marginBottom:
              "8px",

            ...theme.typography.heading,
          }}
        >

          Budget Performance

        </h1>

        <div
          style={{

            color:
              theme.colors.textSecondary,

            ...theme.typography.body,
          }}
        >

          Monitor spending efficiency,
          budget drift,
          and category overruns.

        </div>

      </div>


      <div
        style={{

          display:
            "flex",

          gap:
            "10px",

          flexWrap:
            "wrap",
        }}
      >

        {[
          {
            key:
              "current_month",

            label:
              "Current Month",
          },

          {
            key:
              "previous_month",

            label:
              "Previous Month",
          },

          {
            key:
              "year",

            label:
              "Current Year",
          },

        ].map((item) => (

          <button

            key={item.key}

            onClick={() =>
              setSelectedPeriod(
                item.key
              )
            }

            style={{

              padding:
                "8px 14px",

              borderRadius:
                "10px",

              border:
                `1px solid ${theme.colors.border}`,

              background:

                selectedPeriod
                === item.key

                ? theme.colors.neutralDim

                : theme.colors.card,

              color:

                selectedPeriod
                === item.key

                ? theme.colors.neutral

                : theme.colors.textSecondary,

              cursor:
                "pointer",

              ...theme.typography.body,
            }}
          >

            {item.label}

          </button>
        ))}
      </div>

      <div
        style={{

          display:
            "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

          gap:
            "16px",
        }}
      >

        {[
          {
            label:
              "Total Budget",

            value:
              formatINR(
                summary.total_budget
              ),

            color:
              theme.colors.textPrimary,
          },

          {
            label:
              "Actual Spend",

            value:
              formatINR(
                summary.total_actual
              ),

            color:

              summary.total_actual
              >
              summary.total_budget

              ? theme.colors.negative

              : theme.colors.positive,
          },

          {
            label:
              "Over Budget",

            value:
              `${summary.over_budget_count}`,

            color:
              theme.colors.negative,
          },

          {
            label:
              "Net Deviation",

            value:
              formatINR(
                summary.total_deviation
              ),

            color:

              summary.total_deviation > 0

              ? theme.colors.negative

              : theme.colors.positive,
          },

        ].map((card) => (

          <div

            key={card.label}

            style={{

              background:
                theme.colors.card,

              border:
                `1px solid ${theme.colors.border}`,

              borderRadius:
                "14px",

              padding:
                "18px",
            }}
          >

            <div
              style={{

                color:
                  theme.colors.textSecondary,

                marginBottom:
                  "10px",

                ...theme.typography.caption,
              }}
            >

              {card.label}

            </div>

            <div
              style={{

                color:
                  card.color,

                ...theme.typography.heading,
              }}
            >

              {card.value}

            </div>

          </div>
        ))}
      </div>

      <div
        style={{

          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            "14px",

          padding:
            "18px",

          height:
            "650px",
        }}
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart
            data={categories}
            layout="vertical"
            margin={{
              top: 10,
              right: 20,
              left: 20,
              bottom: 10,
            }}
          >

            <CartesianGrid
              stroke={
                theme.colors.chart.grid
              }
              horizontal={false}
            />

            <XAxis
              type="number"
              domain={[-100, 100]}
              stroke={
                theme.colors.chart.axis
              }
            />

            <YAxis
              dataKey="category"
              type="category"
              width={120}
              stroke={
                theme.colors.chart.axis
              }
            />

            <Tooltip
              content={<CustomTooltip />}
            />

            <ReferenceLine
              x={0}
              stroke={
                theme.colors.border
              }
            />

            <Bar

              dataKey="deviation_pct"

              radius={[0, 4, 4, 0]}

              onClick={(data) => {

                setSelectedCategory(
                    data.category
                );
                }}

              fill={
                theme.colors.chart.barPrimary
              }

             shape={(props) => {

                const {

                    x,
                    y,
                    width,
                    height,
                    payload,

                } = props;

                const isNegative =
                    width < 0;

                return (

                    <rect

                    x={
                        isNegative
                        ? x + width
                        : x
                    }

                    y={y}

                    width={Math.abs(width)}

                    height={height}

                    rx={4}

                    fill={

                        payload.deviation_pct > 0

                        ? theme.colors.negative

                        : theme.colors.positive
                    }

                    opacity={

                        selectedCategory
                        &&
                        selectedCategory
                        !== payload.category

                        ? 0.25

                        : 1
                    }
                    />
                );
                }}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>


    {selectedCategory && (

    <div
        style={{

        position: "fixed",

        top: 0,
        right: 0,

        width: "480px",

        height: "100vh",

        background:
            theme.colors.card,

        borderLeft:
            `1px solid ${theme.colors.border}`,

        padding: "24px",

        overflowY: "auto",

        zIndex: 999,

        boxShadow:
            "-10px 0 40px rgba(0,0,0,0.45)",
        }}
    >

        <div
        style={{

            display: "flex",

            justifyContent:
            "space-between",

            alignItems:
            "center",

            marginBottom:
            "24px",
        }}
        >

        <div>

            <div
            style={{

                color:
                theme.colors.textPrimary,

                marginBottom:
                "6px",

                ...theme.typography.heading,
            }}
            >

            {selectedCategory}

            </div>

            <div
            style={{

                color:
                theme.colors.textSecondary,

                ...theme.typography.body,
            }}
            >

            Category performance analysis

            </div>

        </div>

        <button

            onClick={() =>
            setSelectedCategory(null)
            }

            style={{

            background:
                "transparent",

            border:
                "none",

            cursor:
                "pointer",

            color:
                theme.colors.textSecondary,

            fontSize:
                "22px",
            }}
        >

            ×

        </button>

        </div>


        {(() => {

        const categoryData =
            categories.find(
            (c) =>
                c.category
                === selectedCategory
            );

        if (!categoryData)
            return null;

        return (

            <div
            style={{

                display:
                "grid",

                gridTemplateColumns:
                "1fr 1fr",

                gap:
                "12px",

                marginBottom:
                "24px",
            }}
            >

            {[
                {
                label:
                    "Budget",

                value:
                    formatINR(
                    categoryData.budget_amount
                    ),

                color:
                    theme.colors.textPrimary,
                },

                {
                label:
                    "Actual",

                value:
                    formatINR(
                    categoryData.actual_spent
                    ),

                color:

                    categoryData.deviation_amount > 0

                    ? theme.colors.negative

                    : theme.colors.positive,
                },

                {
                label:
                    "Deviation",

                value:
                    `${categoryData.deviation_pct}%`,

                color:

                    categoryData.deviation_amount > 0

                    ? theme.colors.negative

                    : theme.colors.positive,
                },

                {
                label:
                    "Projection",

                value:
                    formatINR(
                    categoryData.projected_month_end
                    ),

                color:
                    theme.colors.neutral,
                },

            ].map((item) => (

                <div

                key={item.label}

                style={{

                    background:
                    theme.colors.cardAlt,

                    border:
                    `1px solid ${theme.colors.border}`,

                    borderRadius:
                    "12px",

                    padding:
                    "14px",
                }}
                >

                <div
                    style={{

                    color:
                        theme.colors.textSecondary,

                    marginBottom:
                        "6px",

                    ...theme.typography.caption,
                    }}
                >

                    {item.label}

                </div>

                <div
                    style={{

                    color:
                        item.color,

                    ...theme.typography.subheading,
                    }}
                >

                    {item.value}

                </div>

                </div>
            ))}
            </div>
        );
        })()}

        <div
        style={{

            background:
            theme.colors.cardAlt,

            border:
            `1px solid ${theme.colors.border}`,

            borderRadius:
            "14px",

            padding:
            "18px",

            marginBottom:
            "24px",
        }}
        >

        <div
            style={{

            color:
                theme.colors.textPrimary,

            marginBottom:
                "16px",

            ...theme.typography.subheading,
            }}
        >

            Spending Trend

        </div>

        <div
            style={{
            height: "260px",
            }}
        >

            <ResponsiveContainer
            width="100%"
            height="100%"
            >

            <BarChart
                data={trendData}
            >

                <CartesianGrid
                stroke={
                    theme.colors.chart.grid
                }
                vertical={false}
                />

                <XAxis
                dataKey="month"
                stroke={
                    theme.colors.chart.axis
                }
                />

                <YAxis
                stroke={
                    theme.colors.chart.axis
                }
                />

                <Tooltip
                contentStyle={{
                    background:
                    theme.colors.chart.tooltipBg,

                    border:
                    `1px solid ${theme.colors.border}`,

                    borderRadius:
                    "10px",

                    color:
                    theme.colors.textPrimary,
                }}
                />

                <Bar

                dataKey="amount"

                radius={[4,4,0,0]}

                fill={
                    theme.colors.chart.barPrimary
                }
                />

            </BarChart>

            </ResponsiveContainer>

        </div>

        </div>

            <div
            style={{

                background:
                theme.colors.cardAlt,

                border:
                `1px solid ${theme.colors.border}`,

                borderRadius:
                "14px",

                overflow:
                "hidden",
            }}
            >

            <div
                style={{

                padding:
                    "16px",

                borderBottom:
                    `1px solid ${theme.colors.border}`,

                color:
                    theme.colors.textPrimary,

                ...theme.typography.subheading,
                }}
            >

                Monthly Breakdown

            </div>

            <table
                style={{

                width:
                    "100%",

                borderCollapse:
                    "collapse",
                }}
            >

                <thead>

                <tr>

                    {[
                    "Month",
                    "Spend",
                    ].map((head) => (

                    <th

                        key={head}

                        style={{

                        textAlign:
                            "left",

                        padding:
                            "12px 16px",

                        color:
                            theme.colors.textSecondary,

                        borderBottom:
                            `1px solid ${theme.colors.border}`,

                        ...theme.typography.caption,
                        }}
                    >

                        {head}

                    </th>
                    ))}
                </tr>

                </thead>

                <tbody>

                {trendData.map((row) => (

                    <tr
                    key={row.month}
                    >

                    <td
                        style={{

                        padding:
                            "14px 16px",

                        color:
                            theme.colors.textPrimary,

                        borderBottom:
                            `1px solid ${theme.colors.border}`,

                        ...theme.typography.body,
                        }}
                    >

                        {row.month}

                    </td>

                    <td
                        style={{

                        padding:
                            "14px 16px",

                        color:
                            theme.colors.textPrimary,

                        borderBottom:
                            `1px solid ${theme.colors.border}`,

                        ...theme.typography.amount,
                        }}
                    >

                        {formatINR(
                        row.amount
                        )}

                    </td>

                    </tr>
                ))}

                </tbody>

            </table>

            </div>

        </div>
        )}



    </div>
  );
}