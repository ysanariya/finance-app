import { ResponsiveSankey } from "@nivo/sankey";

import { theme } from "../../theme/theme";

import { formatINR } from "@/utils/formatters";

export default function BudgetSankeyChart({
  budgets = [],
  monthlyIncome = 0,
}) {
  const normalizeBudget = (budget) => {
    if (budget.budget_type === "annual") {
      return budget.amount / 12;
    }

    return budget.amount;
  };

  const groupMap = {
    Rent: "Essentials",
    Hospital: "Health",
    "Loan Repayment": "Essentials",
    Self: "Essentials",
    Travel: "Wants",
    Premium: "Essentials",
    Cash: "Essentials",
    "Credit Card": "Wants",
    Food: "Essentials",
    Groceries: "Essentials",
    Lifestyle: "Wants",
    Subscription: "Wants",
    Fuel: "Wants",
    Bike: "Wants",
    Gifts: "Wants",
    Bills: "Essentials",
    Trip: "Wants",
  };

  const nodes = [
    {
      id: "Income",
    },
  ];

  const links = [];

  const addedGroups = new Set();

  budgets.forEach((budget) => {
    const normalizedAmount =
      normalizeBudget(budget);

    const category =
      budget.category;

    const group =
      groupMap[category] || "Other";

    if (!addedGroups.has(group)) {
      nodes.push({
        id: group,
      });

      links.push({
        source: "Income",
        target: group,
        value: 0,
      });

      addedGroups.add(group);
    }

    nodes.push({
      id: category,
    });

    links.push({
      source: group,
      target: category,
      value: normalizedAmount,
    });

    const groupLink =
      links.find(
        (l) =>
          l.source === "Income" &&
          l.target === group
      );

    if (groupLink) {
      groupLink.value += normalizedAmount;
    }
  });

  const totalBudget = budgets.reduce(
    (sum, b) =>
      sum + normalizeBudget(b),
    0
  );

  const remaining =
    monthlyIncome - totalBudget;

  if (remaining > 0) {
    nodes.push({
      id: "Surplus",
    });

    links.push({
      source: "Income",
      target: "Surplus",
      value: remaining,
    });
  }

  const sankeyData = {
    nodes,
    links,
  };

  return (
    <div
      style={{
        height: "650px",
        width: "100%",
        background:
          theme.colors.card,
        border: `1px solid ${theme.colors.border}`,
        borderRadius:
          theme.layout.cardRadius,
        padding: "16px",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            ...theme.typography.subheading,
            color:
              theme.colors.textPrimary,
            marginBottom: "6px",
          }}
        >
          Budget Flow Architecture
        </h2>

        <div
          style={{
            ...theme.typography.caption,
            color:
              theme.colors.textSecondary,
          }}
        >
          Monthly normalized budget topology
        </div>
      </div>

      <ResponsiveSankey
        data={sankeyData}
        valueFormat={(value) => formatINR(value)}
        margin={{
          top: 40,
          right: 180,
          bottom: 80,
          left: 120,
        }}
        align="justify"
        olors={{ scheme: "category10" }}
        nodeOpacity={1}
        nodeThickness={15}
        nodeSpacing={20}
        nodeBorderWidth={0}
        linkOpacity={0.85}
        linkHoverOpacity={0.99}
        enableLinkGradient={true}
        labelPosition="outside"
        labelPadding={14}
        labelTextColor={
          theme.colors.textPrimary
        }
        labelOrientation="horizontal"
        label={(node) => node.id}
        theme={{
          text: {
            fontSize: 12,
            fill:
              theme.colors.textPrimary,
            fontFamily:
              theme.typography.body.fontFamily,
          },

          tooltip: {
            container: {
              background:
                theme.colors.cardAlt,
              color:
                theme.colors.textPrimary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "8px",
              fontSize: "12px",
            },
          },
        }}
        tooltip={({ node, link }) => {
          if (node) {
            return (
              <div
                style={{
                  padding: "10px",
                }}
              >
                <div>
                  {node.id}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color:
                      theme.colors.textSecondary,
                  }}
                >
                  {formatINR(
                    node.value || 0
                  )}
                  /month
                </div>
              </div>
            );
          }

          if (link) {
            return (
              <div
                style={{
                  padding: "10px",
                }}
              >
                <div>
                  {link.source.id}
                  {" → "}
                  {link.target.id}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    color:
                      theme.colors.textSecondary,
                  }}
                >
                  {formatINR(
                    link.value
                  )}
                  /month
                </div>
              </div>
            );
          }

          return null;
        }}
      />
    </div>
  );
}