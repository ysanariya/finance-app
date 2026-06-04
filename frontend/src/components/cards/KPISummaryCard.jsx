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

export default function KPISummaryCard({
  summary,
  periodLabel,
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "16px",
      }}
    >
      {/* INCOME */}
      <div style={card}>
        <div style={cardLabel}>Average Monthly Income</div>
        <div style={periodStyle}>{periodLabel}</div>
        <div style={{ ...cardValue, color: theme.colors.positive }}>
          {formatINR(summary?.avg_monthly_income)}
        </div>
      </div>

      {/* EXPENSE */}
      <div style={card}>
        <div style={cardLabel}>Average Monthly Expenses</div>
        <div style={periodStyle}>{periodLabel}</div>
        <div style={{ ...cardValue, color: theme.colors.negative }}>
          {formatINR(summary?.avg_monthly_expense)}
        </div>
      </div>

      {/* SURPLUS */}
      <div style={card}>
        <div style={cardLabel}>Average Monthly Surplus</div>
        <div style={periodStyle}>{periodLabel}</div>
        <div style={{ ...cardValue, color: theme.colors.textPrimary }}>
          {formatINR(summary?.avg_monthly_surplus)}
        </div>
        <div
          style={{
            marginTop: "10px",
            fontFamily: theme.typography.body.fontFamily,
            fontSize: "12px",
            color: theme.colors.textSecondary,
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
  );
}

const cardLabel = {
  fontFamily: theme.table.headerFontFamily,
  fontSize: theme.table.headerFontSize,
  fontWeight: theme.table.headerFontWeight,
  letterSpacing: theme.table.headerLetterSpacing,
  textTransform: theme.table.headerTextTransform,
  color: theme.table.headerColor,
  marginBottom: "14px",
};

const cardValue = {
  fontFamily: theme.table.amountFontFamily,
  fontWeight: theme.table.amountFontWeight,
  fontSize: "22px",
};

const periodStyle = {
  color: theme.colors.textMuted,
  fontFamily: theme.typography.caption.fontFamily,
  fontSize: theme.typography.caption.fontSize,
  marginBottom: "12px",
  marginTop: "-8px",
};
