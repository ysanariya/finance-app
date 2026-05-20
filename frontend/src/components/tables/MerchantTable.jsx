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

const cardLabel = {
  fontFamily: theme.table.headerFontFamily,
  fontSize: theme.table.headerFontSize,
  fontWeight: theme.table.headerFontWeight,
  letterSpacing: theme.table.headerLetterSpacing,
  textTransform: theme.table.headerTextTransform,
  color: theme.table.headerColor,
  marginBottom: "14px",
};

const cellStyle = {
  padding: `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
  color: theme.table.cellColor,
  fontFamily: theme.table.cellFontFamily,
  fontSize: theme.table.cellFontSize,
  lineHeight: theme.table.cellLineHeight,
};

export default function MerchantTable({ merchants }) {
  return (
    <div style={card}>
      <div style={cardLabel}>Top Merchants</div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead
            style={{
              background: theme.table.headerBackground,
              borderBottom: `1px solid ${theme.colors.border}`,
            }}
          >
            <tr>
              {["Rank", "Merchant", "Amount", "Share"].map((h, i) => (
                <th
                  key={h}
                  style={{
                    textAlign: i >= 2 ? "right" : "left",
                    padding: `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,
                    fontFamily: theme.table.headerFontFamily,
                    fontSize: theme.table.headerFontSize,
                    fontWeight: theme.table.headerFontWeight,
                    letterSpacing: theme.table.headerLetterSpacing,
                    textTransform: theme.table.headerTextTransform,
                    color: theme.table.headerColor,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {merchants.map((m, index) => (
              <tr
                key={m.merchant}
                style={{ borderBottom: `1px solid ${theme.colors.border}` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.table.rowHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Rank */}
                <td
                  style={{
                    ...cellStyle,
                    fontFamily: theme.table.dateFontFamily,
                    color: theme.colors.textMuted,
                  }}
                >
                  #{index + 1}
                </td>

                {/* Merchant */}
                <td
                  style={{
                    ...cellStyle,
                    fontWeight: theme.table.merchantFontWeight,
                    color: theme.table.merchantColor,
                  }}
                >
                  {m.merchant}
                </td>

                {/* Amount */}
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "right",
                    fontFamily: theme.table.amountFontFamily,
                    fontWeight: theme.table.amountFontWeight,
                    fontSize: theme.table.amountFontSize,
                    color: theme.table.amountColorExpense,
                  }}
                >
                  {formatINR(m.amount)}
                </td>

                {/* Share */}
                <td
                  style={{
                    ...cellStyle,
                    textAlign: "right",
                    fontFamily: theme.table.dateFontFamily,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {m.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
