import { theme } from "@/theme/theme.js";

const card = {
  background: theme.colors.card,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.layout.cardRadius,
  padding: "20px",
  marginBottom: 0,
};

const cardLabel = {
  fontFamily: theme.table.headerFontFamily,
  fontSize: theme.table.headerFontSize,
  fontWeight: theme.table.headerFontWeight,
  letterSpacing: theme.table.headerLetterSpacing,
  textTransform: theme.table.headerTextTransform,
  color: theme.table.headerColor,
  marginBottom: "14px",
};

const formatINR = (value) => {
  return (
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export default function CategoryRankingList({
  categories,
  selectedCategory,
  onCategoryChange,
}) {
  return (
    <div style={card}>
      <div style={cardLabel}>Top Spending Categories</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          marginTop: "12px",
        }}
      >
        {categories.slice(0, 5).map((c) => {
          const maxAmount = categories[0]?.amount || 1;
          const width = (c.amount / maxAmount) * 100;
          const isSelected = selectedCategory === c.category;

          return (
            <div
              key={c.category}
              onClick={() => {
                onCategoryChange(c.category);
              }}
              style={{
                cursor: "pointer",
                padding: "10px",
                borderRadius: theme.layout.cardRadius,
                background: isSelected
                  ? theme.colors.cardAlt
                  : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: 500,
                  }}
                >
                  {c.category}
                </div>

                <div
                  style={{
                    color: theme.colors.textSecondary,
                    fontFamily: theme.table.amountFontFamily,
                    fontSize: "13px",
                  }}
                >
                  {formatINR(c.amount)}
                </div>
              </div>

              {/* BAR */}
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: theme.colors.border,
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${width}%`,
                    height: "100%",
                    background: theme.colors.chart.secondary,
                    borderRadius: "999px",
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
