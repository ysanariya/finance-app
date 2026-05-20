import { useEffect, useState } from "react";
import { fetchWithAuth } from "./services/api";
import { theme } from "./theme";

const c = theme.colors;

function StatCard({ label, value, delta, deltaPositive, subtext, valueColor }) {
  return (
    <div
      style={{
        background: c.card,
        border: `0.5px solid ${c.border}`,
        borderRadius: theme.layout.cardRadius,
        padding: "11px 13px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: "9px",
          color: c.textMuted,
          letterSpacing: "0.09em",
          fontWeight: "500",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "20px",
          fontWeight: "500",
          color: valueColor || c.textPrimary,
          letterSpacing: "-0.5px",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {(delta || subtext) && (
        <div
          style={{
            fontSize: "10px",
            color: delta
              ? deltaPositive
                ? c.positive
                : c.negative
              : c.textMuted,
          }}
        >
          {delta
            ? `${deltaPositive ? "↑" : "↓"} ${delta}`
            : subtext}
        </div>
      )}
    </div>
  );
}

export default function TopStatCards() {
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

  const formatLakh = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "10px",
      }}
    >
      <StatCard
        label="TOTAL ASSETS"
        value={formatLakh(data.total_assets)}
        delta="2.3% MoM"
        deltaPositive={true}
        valueColor={c.positive}
      />

      <StatCard
        label="TOTAL LIABILITIES"
        value={formatLakh(data.total_liabilities)}
        delta="0.4% MoM"
        deltaPositive={false}
        valueColor={c.negative}
      />

      <StatCard
        label="MONTHLY INCOME"
        value="₹1.4L"
        subtext="Salary + Freelance"
        valueColor={c.neutral}
      />

      <StatCard
        label="MONTHLY SURPLUS"
        value="₹42K"
        delta="vs 26% last mo"
        deltaPositive={true}
        valueColor={c.positive}
      />
    </div>
  );
}
