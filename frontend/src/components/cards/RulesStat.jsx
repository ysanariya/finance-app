import { theme } from "../../theme/theme";

export default function RulesStats({ rules }) {

  const activeRules =
    rules.filter(r => r.is_active).length;

  const totalRules =
    rules.length;

  const highestPriority =
    rules.length
      ? Math.max(...rules.map(r => r.priority))
      : 0;

  const ruleTypes =
    new Set(
      rules
        .map(r => r.transaction_type)
        .filter(Boolean)
    ).size;

  const coverage =
    totalRules === 0
      ? 0
      : Math.round((activeRules / totalRules) * 100);

  const cards = [
    {
      label: "ACTIVE RULES",
      value: activeRules,
      color: theme.colors.neutral,
    },
    {
      label: "RULE TYPES",
      value: ruleTypes,
      color: theme.colors.positive,
    },
    {
      label: "MAX PRIORITY",
      value: highestPriority,
      color: theme.colors.neutral,
    },
    {
      label: "ENGINE COVERAGE",
      value: `${coverage}%`,
      color: theme.colors.positive,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(220px,1fr))",
        gap: "16px",
      }}
    >
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            background: theme.colors.glassCard,
            backdropFilter: "blur(12px)",
            border: `1px solid ${theme.colors.border}`,
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              color: theme.colors.textSecondary,
              fontSize: "11px",
              letterSpacing: "0.08em",
            }}
          >
            {card.label}
          </div>

          <div
            style={{
              marginTop: "10px",
              fontSize: "28px",
              color: card.color,
              fontFamily:
                theme.typography.mono.fontFamily,
            }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}