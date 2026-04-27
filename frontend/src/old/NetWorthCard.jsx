import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";

export default function NetWorthCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth(
        "http://localhost:8000/dashboard/summary"
      );
      setData(res);
    }
    load();
  }, []);

  if (!data) return null;

  const { net_worth, total_assets, total_liabilities } = data;

  const formatLakh = (val) => `₹${(val / 100000).toFixed(2)}L`;

  // placeholder delta
  const deltaValue = 2.1;
  const deltaPercent = 4.6;
  const isPositive = deltaValue >= 0;

  return (
    <div
      style={{
        background: "#181818",
        borderRadius: "18px",
        border: `1px solid ${theme.colors.border}`,
        padding: "20px 20px",
        marginBottom: theme.layout.spacing,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* LEFT: NET WORTH */}
		<div
			style={{
			flex: 1,
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
			}}
		>
        <div
          style={{
            fontSize: "12px",
            color: theme.colors.textMuted,
            letterSpacing: "0.06em",
          }}
        >
          NET WORTH
        </div>

        <div
          style={{
            fontSize: "44px",
            fontWeight: "600",
            marginTop: "6px",
            color:
              net_worth >= 0
                ? theme.colors.positive
                : theme.colors.negative,
          }}
        >
          {formatLakh(net_worth)}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "13px",
            color: theme.colors.textMuted,
          }}
        >
          Total Assets {formatLakh(total_assets)} · Total Liabilities{" "}
          {formatLakh(total_liabilities)}
        </div>
      </div>

      {/* RIGHT: DELTA */}
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            display: "inline-block",
            padding: "6px 10px",
            borderRadius: "999px",
            background: isPositive
              ? theme.colors.badge.healthyBg
              : theme.colors.badge.riskBg,
            color: isPositive
              ? theme.colors.badge.healthyText
              : theme.colors.badge.riskText,
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {isPositive ? "↑" : "↓"} ₹{deltaValue}L
        </div>

        <div
          style={{
            marginTop: "8px",
            fontSize: "12px",
            color: theme.colors.textMuted,
          }}
        >
          {isPositive ? "+" : "-"}
          {deltaPercent}% vs last month
        </div>
      </div>
    </div>
  );
}