import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function AssetAllocation() {
  const [data, setData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth(
        "http://localhost:8000/assets/breakdown"
      );
      setData(res);
    }
    load();
  }, []);

  // 🎯 STRICT palette mapping (NO RANDOM COLORS)
  const getColor = (category) => {
    switch (category.toLowerCase()) {
      case "equities":
        return theme.colors.stocks;
      case "epf":
      case "ppf":
        return theme.colors.epf;
      case "cash":
      case "bank":
        return theme.colors.cash;
      case "gold":
        return theme.colors.gold;
    }
  };

  const total = data.reduce((sum, item) => sum + item.total, 0);

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
        ASSET ALLOCATION
      </div>

      {/* CHART */}
      <div style={{ position: "relative", height: "240px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(entry.category)}
                  opacity={
                    activeIndex === null || activeIndex === index
                      ? 1
                      : 0.3
                  }
                />
              ))}
            </Pie>

            {/* TOOLTIP */}
            <Tooltip
              formatter={(value, name) => [
                formatLakh(value),
                name,
              ]}
              contentStyle={{
                backgroundColor: "#181818",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* 🎯 CENTER LABEL */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: theme.colors.textMuted,
            }}
          >
            Total
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: theme.colors.textPrimary,
            }}
          >
            {formatLakh(total)}
          </div>
        </div>
      </div>

      {/* 🎯 LEGEND */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        {data.map((item, index) => {
          const percent =
            total > 0
              ? ((item.total / total) * 100).toFixed(1)
              : 0;

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              {/* LEFT */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: theme.colors.textPrimary,
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: getColor(item.category),
                  }}
                ></div>

                {item.category}
              </div>

              {/* RIGHT */}
              <div
                style={{
                  color: theme.colors.textMuted,
                }}
              >
                {percent}% · {formatLakh(item.total)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}