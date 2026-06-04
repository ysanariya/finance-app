import { theme } from "../../theme/theme";

export default function RuleEngineHealthCard({
  rules
}) {

  const active =
    rules.filter(r => r.is_active).length;

  const total =
    rules.length;

  const percentage =
    total
      ? Math.round(
          (active / total) * 100
        )
      : 0;

  return (
    <div
      style={{
        background:
          theme.glass.background,
        backdropFilter:
          `blur(${theme.glass.blur})`,
        border:
          `1px solid ${theme.glass.border}`,
        borderRadius: "18px",
        padding: "24px",
      }}
    >
      <div
        style={{
          color:
            theme.colors.textSecondary,
          marginBottom: "14px",
        }}
      >
        Engine Health
      </div>

      <div
        style={{
          fontSize: "36px",
          fontWeight: 700,
          color:
            theme.colors.positive,
        }}
      >
        {percentage}%
      </div>

      <div
        style={{
          marginTop: "12px",
          height: "8px",
          background:
            theme.colors.cardAlt,
          borderRadius: "999px",
        }}
      >
        <div
          style={{
            width:
              `${percentage}%`,
            height: "100%",
            borderRadius:
              "999px",
            background:
              theme.gradients.primary,
          }}
        />
      </div>

      <div
        style={{
          marginTop: "12px",
          color:
            theme.colors.textSecondary,
        }}
      >
        {active} active of {total} rules
      </div>
    </div>
  );
}