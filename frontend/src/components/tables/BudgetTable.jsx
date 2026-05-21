import { theme }
from "@/theme/theme";
import { formatINR } from "@/utils/formatters";
export default function BudgetTable({

  budgets,
  setBudgets,
  categories
}) {

  //////////////////////////////////////////////////
  // UPDATE FIELD
  //////////////////////////////////////////////////

  const updateBudget = (
    index,
    field,
    value
  ) => {

    const updated = [...budgets];

    updated[index][field] =
      value;

    setBudgets(updated);
  };


  //////////////////////////////////////////////////
  // ADD ROW
  //////////////////////////////////////////////////

  const addRow = () => {

    const currentYear =
      new Date().getFullYear();

    setBudgets([

      ...budgets,

      {

        category: "",

        budget_type:
          "monthly",

        amount: "",

        start_date:
          `${currentYear}-01-01`,

        end_date:
          `${currentYear}-12-31`
      }
    ]);
  };


  //////////////////////////////////////////////////
  // REMOVE ROW
  //////////////////////////////////////////////////

  const removeRow = (index) => {

    const updated =
      budgets.filter(

        (_, i) =>
          i !== index
      );

    setBudgets(updated);
  };


  //////////////////////////////////////////////////
  // STYLES
  //////////////////////////////////////////////////

  const styles = {

    header: {

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginBottom: "18px",
    },

    title: {

      ...theme.typography.subheading,

      color:
        theme.colors.textSecondary,

      textTransform:
        "uppercase",

      letterSpacing:
        "0.08em",
    },

    addButton: {

      background:
        theme.colors.cardAlt,

      border:
        `1px solid ${theme.colors.border}`,

      color:
        theme.colors.textPrimary,

      padding:
        "8px 14px",

      borderRadius: "8px",

      cursor: "pointer",
    },

    tableWrapper: {

      overflowX: "auto",
    },

    table: {

      width: "100%",

      borderCollapse:
        "collapse",

      minWidth: "900px",
    },

    th: {

      ...theme.typography.tableHeader,

      color:
        theme.colors.textMuted,

      textAlign: "left",

      padding: "14px",

      borderBottom:
        `1px solid ${theme.colors.border}`,
    },

    td: {

      padding: "14px",

      borderBottom:
        `1px solid ${theme.colors.border}`,
    },

    input: {

      width: "100%",

      background:
        theme.colors.background,

      border:
        `1px solid ${theme.colors.border}`,

      borderRadius: "8px",

      padding: "10px",

      color:
        theme.colors.textPrimary,

      outline: "none",

      ...theme.typography.body,
    },

    select: {

      width: "100%",

      background:
        theme.colors.background,

      border:
        `1px solid ${theme.colors.border}`,

      borderRadius: "8px",

      padding: "10px",

      color:
        theme.colors.textPrimary,

      outline: "none",

      ...theme.typography.body,
    },

    deleteButton: {

      background:
        theme.colors.negativeDim,

      border: "none",

      color:
        theme.colors.negative,

      padding:
        "8px 10px",

      borderRadius: "6px",

      cursor: "pointer",
    },

    budgetTypeBadge: {

      padding:
        "6px 10px",

      borderRadius: "999px",

      fontSize: "12px",

      fontWeight: 600,
    }
  };


  //////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////

  return (

    <div>

      <div style={styles.header}>

        <div style={styles.title}>
          Budget Configuration
        </div>

        <button
          style={styles.addButton}
          onClick={addRow}
        >
          + Add Budget
        </button>

      </div>

      <div style={styles.tableWrapper}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>
                Category
              </th>

              <th style={styles.th}>
                Budget Type
              </th>

              <th style={styles.th}>
                Amount
              </th>

              <th style={styles.th}>
                Start Date
              </th>

              <th style={styles.th}>
                End Date
              </th>

              <th style={styles.th}>
              </th>

            </tr>

          </thead>

          <tbody>

            {

              budgets.map(

                (
                  budget,
                  index
                ) => (

                  <tr key={index}>

                    <td style={styles.td}>

                      <select

                        style={styles.select}

                        value={
                          budget.category
                        }

                        onChange={(e) =>

                          updateBudget(

                            index,

                            "category",

                            e.target.value
                          )
                        }
                        >

                        <option value="">
                          Select Category
                        </option>

                        {

                          categories.map(

                            (category) => (

                              <option
                                key={category}
                                value={category}
                              >
                                {category}
                              </option>
                            )
                          )
                        }

                        </select>

                    </td>

                    <td style={styles.td}>

                      <select

                        style={styles.select}

                        value={
                          budget.budget_type
                        }

                        onChange={(e) =>

                          updateBudget(

                            index,

                            "budget_type",

                            e.target.value
                          )
                        }
                      >

                        <option value="monthly">
                          Monthly
                        </option>

                        <option value="annual">
                          Annual
                        </option>

                      </select>

                    </td>

                    <td style={styles.td}>

                      <div
                        style={{
                          position: "relative"
                        }}
                      >

                        <input

                          style={styles.input}

                          type="text"

                          value={

                            budget.amount === ""

                              ? ""

                              : formatINR(
                                  budget.amount
                                )
                          }

                          placeholder="₹ 5,000"

                          onChange={(e) => {

                            ////////////////////////////////////////
                            // REMOVE ₹ + COMMAS + SPACES
                            ////////////////////////////////////////

                            const raw =

                              e.target.value

                                .replace(/₹/g, "")

                                .replace(/,/g, "")

                                .trim();

                            ////////////////////////////////////////
                            // EMPTY VALUE
                            ////////////////////////////////////////

                            if (raw === "") {

                              updateBudget(

                                index,

                                "amount",

                                ""
                              );

                              return;
                            }

                            ////////////////////////////////////////
                            // NUMERIC VALIDATION
                            ////////////////////////////////////////

                            if (!/^\d*\.?\d*$/.test(raw)) {

                              return;
                            }

                            updateBudget(

                              index,

                              "amount",

                              Number(raw)
                            );
                          }}
                        />

                      </div>

                    </td>

                    <td style={styles.td}>

                      <input

                        style={styles.input}

                        type="date"

                        value={
                          budget.start_date
                        }

                        onChange={(e) =>

                          updateBudget(

                            index,

                            "start_date",

                            e.target.value
                          )
                        }
                      />

                    </td>

                    <td style={styles.td}>

                      <input

                        style={styles.input}

                        type="date"

                        value={
                          budget.end_date
                        }

                        onChange={(e) =>

                          updateBudget(

                            index,

                            "end_date",

                            e.target.value
                          )
                        }
                      />

                    </td>

                    <td style={styles.td}>

                      <button

                        style={
                          styles.deleteButton
                        }

                        onClick={() =>

                          removeRow(
                            index
                          )
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                )
              )
            }

          </tbody>

        </table>

      </div>

    </div>
  );
}