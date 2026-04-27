import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";

const c = theme.colors;

export default function NetWorthCard() {
  const [data, setData] = useState(null);

  // ── API call unchanged ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth("http://localhost:8000/dashboard/summary");
      setData(res);
    }
    load();
  }, []);

  if (!data) return null;

  const { net_worth, total_assets, total_liabilities } = data;

  const formatLakh = (val) => `₹${(val / 100000).toFixed(2)}L`;

  // Placeholder delta until backend supplies it
  const deltaValue   = 2.1;
  const deltaPercent = 4.6;
  const isPositive   = deltaValue >= 0;

  return (
    <div
      style={{
        background: c.card,
        border: `0.5px solid ${c.border}`,
        borderRadius: theme.layout.cardRadius,
        padding: "16px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {/* LEFT: main numbers */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "9px",
            color: c.textMuted,
            letterSpacing: "0.1em",
            marginBottom: "6px",
          }}
        >
          NET WORTH · APR 2026
        </div>

        <div
          style={{
            fontSize: "36px",
            fontWeight: "500",
            letterSpacing: "-1.5px",
            lineHeight: 1,
            color: net_worth >= 0 ? c.positive : c.negative,
          }}
        >
          {formatLakh(net_worth)}
        </div>

        <div
          style={{
            marginTop: "7px",
            fontSize: "11px",
            color: c.textMuted,
          }}
        >
          Assets{" "}
          <span style={{ color: c.textSecondary }}>
            {formatLakh(total_assets)}
          </span>
          {" · "}
          Liabilities{" "}
          <span style={{ color: c.textSecondary }}>
            {formatLakh(total_liabilities)}
          </span>
        </div>
      </div>

      {/* RIGHT: delta badge */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "4px",
            background: isPositive ? c.badge.healthyBg : c.badge.riskBg,
            border: `0.5px solid ${isPositive ? c.positive + "30" : c.negative + "30"}`,
            fontSize: "11px",
            fontWeight: "500",
            color: isPositive ? c.badge.healthyText : c.badge.riskText,
          }}
        >
          {isPositive ? "↑" : "↓"} ₹{deltaValue}L
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "10px",
            color: c.textMuted,
          }}
        >
          {isPositive ? "+" : "-"}{deltaPercent}% vs last month
        </div>
      </div>
    </div>
  );
}
