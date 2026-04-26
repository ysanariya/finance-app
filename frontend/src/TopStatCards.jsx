import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";

function StatCard({ label, value, subtext, color }) {
  return (
    <div
      style={{
        background: "#2b2b2b", // 👈 slightly darker than main card
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "14px",
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "90px",
      }}
    >
      {/* LABEL */}
      <div
        style={{
          fontSize: "11px",
          color: theme.colors.textMuted,
          letterSpacing: "0.08em",
          fontWeight: "500",
        }}
      >
        {label}
      </div>

      {/* VALUE */}
      <div
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: color || theme.colors.textPrimary,
          marginTop: "6px",
        }}
      >
        {value}
      </div>

      {/* SUBTEXT */}
      {subtext && (
        <div
          style={{
            fontSize: "11px",
            color: theme.colors.textMuted,
            marginTop: "4px",
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}

export default function TopStatCards() {
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

  const formatLakh = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px", // tighter than before
        marginBottom: "10px",
      }}
    >
      <StatCard
        label="TOTAL ASSETS"
        value={formatLakh(data.total_assets)}
        subtext="—"
        color={theme.colors.positive}
      />

      <StatCard
        label="TOTAL LIABILITIES"
        value={formatLakh(data.total_liabilities)}
        subtext="—"
        color={theme.colors.negative}
      />

      <StatCard
        label="MONTHLY INCOME"
        value="₹1.4L"
        subtext="Salary + Freelance"
      />

      <StatCard
        label="MONTHLY SURPLUS"
        value="₹42K"
        subtext="30% savings rate"
        color={theme.colors.positive}
      />
    </div>
  );
}