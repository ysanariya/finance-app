import { theme }
from "@/theme/theme";


export default function BudgetTargetForm({

  target,
  setTarget,
  onSave
}) {

  const styles = {

    title: {

      ...theme.typography.subheading,

      color:
        theme.colors.textSecondary,

      marginBottom: "18px",

      textTransform: "uppercase",

      letterSpacing: "0.08em",
    },

    group: {

      marginBottom: "18px",
    },

    label: {

      ...theme.typography.body,

      color:
        theme.colors.textSecondary,

      display: "block",

      marginBottom: "8px",
    },

    input: {

      width: "100%",

      background:
        theme.colors.background,

      border:
        `1px solid ${theme.colors.border}`,

      borderRadius: "8px",

      padding: "12px",

      color:
        theme.colors.textPrimary,

      outline: "none",

      ...theme.typography.amount,
    },

    button: {

      width: "100%",

      background:
        theme.colors.positive,

      border: "none",

      color: "#fff",

      padding: "12px",

      borderRadius: "8px",

      cursor: "pointer",

      marginTop: "12px",

      ...theme.typography.subheading,
    }
  };


  return (

    <div>

      <div style={styles.title}>
        Income Targets
      </div>

      <div style={styles.group}>

        <label style={styles.label}>
          Monthly Income
        </label>

        <input

          style={styles.input}

          type="number"

          value={
            target.monthly_income_target
          }

          onChange={(e) =>

            setTarget({

              ...target,

              monthly_income_target:
                Number(
                  e.target.value
                )
            })
          }
        />

      </div>

      <div style={styles.group}>

        <label style={styles.label}>
          Savings %
        </label>

        <input

          style={styles.input}

          type="number"

          value={
            target.savings_rate_target
          }

          onChange={(e) =>

            setTarget({

              ...target,

              savings_rate_target:
                Number(
                  e.target.value
                )
            })
          }
        />

      </div>

      <button
        style={styles.button}
        onClick={onSave}
      >
        Save Target
      </button>

    </div>
  );
}