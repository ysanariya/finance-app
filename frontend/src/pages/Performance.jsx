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

import { formatINR } from "@/utils/formatters";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const styles = {

  pagePadding: "24px",

  cardRadius: "14px",

  buttonRadius: "10px",

  shadow:
    "0 10px 40px rgba(0,0,0,0.35)",
};

export default function Performance() {

  const currentYear =
    new Date().getFullYear();

  const currentMonth =
    new Date().getMonth();

  const [loading, setLoading] =
    useState(true);

  const [data, setData] =
    useState(null);

  const [selectedYear, setSelectedYear] =
    useState(currentYear);

  const [selectedMonth, setSelectedMonth] =
    useState(null);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [trendData, setTrendData] =
    useState([]);

  //////////////////////////////////////////////////
  // YEAR OPTIONS
  //////////////////////////////////////////////////

  const years = [];

  for (
    let year = 2024;
    year <= currentYear;
    year++
  ) {
    years.push(year);
  }

  //////////////////////////////////////////////////
  // ACTIVE MONTHS
  //////////////////////////////////////////////////

  const activeMonths =
    selectedYear === currentYear

      ? MONTHS.slice(
          0,
          currentMonth + 1
        )

      : MONTHS;

  //////////////////////////////////////////////////
  // DATE RANGE
  //////////////////////////////////////////////////

  function buildDateRange() {

    //////////////////////////////////////////////////
    // MONTH VIEW
    //////////////////////////////////////////////////

    if (selectedMonth !== null) {

      const start = new Date(
        selectedYear,
        selectedMonth,
        1
      );

      const end = new Date(
        selectedYear,
        selectedMonth + 1,
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

    //////////////////////////////////////////////////
    // YEAR VIEW
    //////////////////////////////////////////////////

    return {

      startDate:
        `${selectedYear}-01-01`,

      endDate:

        selectedYear === currentYear

          ? new Date()
              .toISOString()
              .split("T")[0]

          : `${selectedYear}-12-31`,

      budgetType:
        "annual",
    };
  }

  //////////////////////////////////////////////////
  // FETCH PERFORMANCE
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

  }, [selectedYear, selectedMonth]);

  //////////////////////////////////////////////////
  // FETCH TREND
  //////////////////////////////////////////////////

  useEffect(() => {

    async function loadTrend() {

      if (!selectedCategory) {

        setTrendData([]);
        return;
      }

      try {

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
      }
    }

    loadTrend();

  }, [
    selectedCategory,
    selectedYear,
    selectedMonth,
  ]);

  //////////////////////////////////////////////////
  // CATEGORY DATA
  //////////////////////////////////////////////////

  const categories =
    useMemo(() => {

      if (!data?.categories)
        return [];

      return data.categories

        .map((item) => ({

          ...item,

          chartDeviation:

            Math.max(

              Math.min(
                item.deviation_pct,
                250
              ),

              -100
            ),
        }))

        .sort((a, b) => {

          if (
            a.deviation_pct > 0
            &&
            b.deviation_pct <= 0
          ) return -1;

          if (
            b.deviation_pct > 0
            &&
            a.deviation_pct <= 0
          ) return 1;

          return (
            Math.abs(b.deviation_pct)
            -
            Math.abs(a.deviation_pct)
          );
        });

    }, [data]);

  const maxDeviation = Math.max(

    ...categories.map((c) =>
      Math.abs(c.chartDeviation)
    ),
    100
  );

  //////////////////////////////////////////////////
  // TOOLTIP
  //////////////////////////////////////////////////

  function CustomTooltip({
    active,
    payload,
  }) {

    if (
      !active
      ||
      !payload
      ||
      !payload.length
    ) {
      return null;
    }

    const item = payload[0].payload;

    return (

      <div
        style={{

          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            styles.cardRadius,

          padding: "14px",

          minWidth: "220px",
        }}
      >

        <div
          style={{

            ...theme.typography.subheading,

            color:
              theme.colors.textPrimary,

            marginBottom: "12px",
          }}
        >
          {item.category}
        </div>

        <div
          style={{

            ...theme.typography.body,

            color:
              theme.colors.textSecondary,

            marginBottom: "6px",
          }}
        >
          Budget: {formatINR(item.budget_amount)}
        </div>

        <div
          style={{

            ...theme.typography.body,

            color:
              theme.colors.textSecondary,

            marginBottom: "10px",
          }}
        >
          Actual: {formatINR(item.actual_spent)}
        </div>

        <div
          style={{

            ...theme.typography.amount,

            color:

              item.deviation_pct > 0

                ? theme.colors.negative

                : theme.colors.positive,
          }}
        >
          {item.deviation_pct.toFixed(1)}%
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
            styles.pagePadding,

          color:
            theme.colors.textPrimary,
        }}
      >
        Loading...
      </div>
    );
  }

  //////////////////////////////////////////////////
  // EMPTY
  //////////////////////////////////////////////////

  if (!data) {

    return (

      <div
        style={{

          padding:
            styles.pagePadding,

          color:
            theme.colors.textPrimary,
        }}
      >
        No data available.
      </div>
    );
  }

  //////////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////////

  return (

    <div
      style={{

        padding:
          styles.pagePadding,

        background:
          theme.colors.background,

        minHeight:
          "100vh",
      }}
    >


      <div
        style={{

          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          marginBottom: "28px",
        }}
      >

        <div>

          <div
            style={{

              ...theme.typography.heading,

              color:
                theme.colors.textPrimary,

              marginBottom: "8px",
            }}
          >
            Budget Performance
          </div>

          <div
            style={{

              ...theme.typography.body,

              color:
                theme.colors.textSecondary,
            }}
          >
            Budget vs actual spending analysis.
          </div>
        </div>

        <select

          value={selectedYear}

          onChange={(e) => {

            setSelectedYear(
              Number(e.target.value)
            );

            setSelectedMonth(null);
          }}

          style={{

            background:
              theme.colors.card,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              styles.buttonRadius,

            padding:
              "10px 14px",

            color:
              theme.colors.textPrimary,

            outline: "none",

            ...theme.typography.body,
          }}
        >

          {years.map((year) => (

            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>
      </div>


      <div
        style={{

          display: "flex",

          gap: "10px",

          flexWrap: "wrap",

          marginBottom: "28px",
        }}
      >

        <button

          onClick={() =>
            setSelectedMonth(null)
          }

          style={{

            background:

              selectedMonth === null

                ? theme.colors.neutral

                : theme.colors.card,

            color:

              selectedMonth === null

                ? "#FFFFFF"

                : theme.colors.textSecondary,

            border:
              `1px solid ${theme.colors.border}`,

            borderRadius:
              styles.buttonRadius,

            padding:
              "10px 14px",

            cursor: "pointer",

            ...theme.typography.body,
          }}
        >
          {selectedYear}
        </button>

        {activeMonths.map((month, index) => (

          <button

            key={month}

            onClick={() =>
              setSelectedMonth(index)
            }

            style={{

              background:

                selectedMonth === index

                  ? theme.colors.neutral

                  : theme.colors.card,

              color:

                selectedMonth === index

                  ? "#FFFFFF"

                  : theme.colors.textSecondary,

              border:
                `1px solid ${theme.colors.border}`,

              borderRadius:
                styles.buttonRadius,

              padding:
                "10px 14px",

              cursor: "pointer",

              ...theme.typography.body,
            }}
          >
            {month}
          </button>
        ))}
      </div>


      <div
        style={{

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",

          gap: "16px",

          marginBottom: "24px",
        }}
      >

        {[
          {
            label: "Total Budget",
            value: formatINR(
              data.summary.total_budget
            ),
            color:
              theme.colors.textPrimary,
          },
          {
            label: "Actual Spend",
            value: formatINR(
              data.summary.total_actual
            ),
            color:
              theme.colors.negative,
          },
          {
            label: "Over Budget",
            value:
              data.summary.over_budget_count,
            color:
              theme.colors.negative,
          },
          {
            label: "Net Deviation",
            value: formatINR(
              data.summary.total_deviation
            ),
            color:

              data.summary.total_deviation > 0

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
                styles.cardRadius,

              padding: "18px",
            }}
          >

            <div
              style={{

                ...theme.typography.caption,

                color:
                  theme.colors.textSecondary,

                marginBottom: "10px",
              }}
            >
              {card.label}
            </div>

            <div
              style={{

                ...theme.typography.amount,

                fontSize: "18px",

                color:
                  card.color,
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
            styles.cardRadius,

          padding: "20px",

          height: "560px",
        }}
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart

            data={categories}

            layout="vertical"

            barCategoryGap="38%"

            margin={{
              top: 8,
              right: 24,
              left: 0,
              bottom: 8,
            }}
          >

            <CartesianGrid

              stroke={
                theme.colors.chart.grid
              }

              horizontal={false}

              strokeDasharray="2 6"
            />

            <XAxis

              type="number"

              domain={[
                -100,
                maxDeviation,
              ]}

              tick={{

                fill:
                  theme.colors.textMuted,

                fontFamily:
                  theme.typography.mono.fontFamily,

                fontSize: 11,
              }}

              tickLine={false}

              axisLine={{
                stroke:
                  theme.colors.border,
              }}
            />

            <YAxis

              dataKey="category"

              type="category"

              width={140}

              tick={{

                fill:
                  theme.colors.textSecondary,

                fontFamily:
                  theme.typography.body.fontFamily,

                fontSize: 13,
              }}

              tickLine={false}

              axisLine={false}
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

              dataKey="chartDeviation"

              barSize={18}

              radius={[4,4,4,4]}

              onClick={(data) => {

                setSelectedCategory(
                  data.category
                );
              }}

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

                    stroke="rgba(255,255,255,0.04)"

                    strokeWidth={1}

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
    </div>
  );
}