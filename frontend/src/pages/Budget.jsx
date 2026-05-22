import { useEffect, useState } from "react";

import BudgetTable from "@/components/tables/BudgetTable";

import BudgetSankeyChart from "@/components/charts/BudgetSankeyChart";

import BudgetTargetForm from "@/components/forms/BudgetTargetForm";

import { formatINR } from "@/utils/formatters";

import {
    getBudgets,
    saveBudgets,
    getBudgetTarget,
    saveBudgetTarget,
    getTransactionCategories,
}
from "@/services/budgetAPI";

import { theme } from "@/theme/theme";


export default function Budget() {

  const [categories, setCategories] = useState([]);

  const [conflicts, setConflicts] = useState([]);

  const [showConflictModal, setShowConflictModal] = useState(false);

  const [draftBudgets, setDraftBudgets] = useState([]);
  
  const [savedBudgets, setSavedBudgets] = useState([]);

  const [budgetTarget, setBudgetTarget] = useState(null);
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [target, setTarget] = useState({

      monthly_income_target: "",

      savings_rate_target: ""
    });

  const [loading, setLoading] = useState(false);

  ////////////////////////////////////////////
  // LOAD DATA
  ////////////////////////////////////////////
  const loadBudgetTarget =
    async () => {

      try {

        const data =
          await getBudgetTarget();

        setBudgetTarget(data);

      } catch (err) {

        console.error(err);
      }
    };




  const loadData = async () => {

    try {

      setLoading(true);
      const categoryData =
        await getTransactionCategories();

      setCategories(categoryData || []);

      const budgetData =
        await getBudgets();

      const targetData =
        await getBudgetTarget();

      setSavedBudgets(
        (budgetData || []).map(
          (budget) => ({
            ...budget,
            start_date:
              budget.start_date
                ?.split("T")[0],
            end_date:
              budget.end_date
                ?.split("T")[0],
          })
        )
      );

      if (targetData) {

        setTarget(targetData);
      }

    } catch (err) {

      console.error(err);

      alert("Failed to fetch budgets");

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {

    loadBudgetTarget();
    loadData();

  }, []);


  ////////////////////////////////////////////
  // SAVE BUDGETS
  ////////////////////////////////////////////

const handleSaveBudgets =
  async (forceUpdate = false) => {

    try {

      const response =
        await saveBudgets(

          draftBudgets,

          forceUpdate
        );

      //////////////////////////////////////////////////
      // CONFLICT DETECTED
      //////////////////////////////////////////////////

      if (
        response
        ?.requires_confirmation
      ) {

        setConflicts(
          response.conflicts
        );

        setShowConflictModal(
          true
        );

        return;
      }

      //////////////////////////////////////////////////
      // SUCCESS
      //////////////////////////////////////////////////

      alert(
        "Budgets saved"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Failed to save budgets"
      );
    }
  };


  ////////////////////////////////////////////
  // SAVE TARGETS
  ////////////////////////////////////////////

  const handleSaveTarget =
  async () => {

    try {

      await saveBudgetTarget(
        target
      );

      alert(
        "Target saved"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Failed to save target"
      );
    }
  };


  ////////////////////////////////////////////
  // STYLES
  ////////////////////////////////////////////

  const styles = {

    page: {

      background:
        theme.colors.background,

      minHeight: "100vh",

      padding: "32px",

      color:
        theme.colors.textPrimary,
    },

    headerRow: {

      display: "flex",

      justifyContent:
        "space-between",

      alignItems: "center",

      marginBottom: "24px",
    },

    title: {

      ...theme.typography.heading,

      fontSize: "42px",

      color:
        theme.colors.textPrimary,
    },

    subtitle: {

      ...theme.typography.body,

      color:
        theme.colors.textSecondary,

      marginTop: "6px",
    },

    topGrid: {

      display: "grid",

      gridTemplateColumns:
        "1fr 1fr",

      gap: "20px",

      alignItems: "start",

      marginBottom: "24px",
    },

    card: {

      background:
        theme.colors.card,

      border:
        `1px solid ${theme.colors.border}`,

      borderRadius:
        theme.layout.cardRadius,

      padding: "24px",
    },

    actionButton: {

      background:
        theme.colors.neutral,

      border: "none",

      color: "#fff",

      padding:
        "10px 16px",

      borderRadius: "8px",

      cursor: "pointer",

      ...theme.typography.subheading,
    },

    ghostButton: {

      background:
        theme.colors.cardAlt,

      border:
        `1px solid ${theme.colors.border}`,

      color:
        theme.colors.textPrimary,

      padding:
        "10px 16px",

      borderRadius: "8px",

      cursor: "pointer",

      ...theme.typography.subheading,
    },

    buttonRow: {

      display: "flex",

      gap: "12px",
    }
  };


  return (

    <div style={styles.page}>

      <div style={styles.headerRow}>

        <div>

          <div style={styles.title}>
            Budgets
          </div>

          <div style={styles.subtitle}>
            Configure monthly and annual
            budget limits
          </div>

        </div>

        <div style={styles.buttonRow}>

         <button
            style={styles.ghostButton}
            onClick={async () => {

              await loadData();

              setShowBudgetModal(true);
            }}
          >
            View Saved Budgets
          </button>

          <button
            style={styles.actionButton}
            onClick={() => handleSaveBudgets()}
          >
            Save Budgets
          </button>

        </div>

      </div>


      <div style={styles.topGrid}>

        <div style={styles.card}>

          <BudgetTargetForm

            target={target}

            setTarget={setTarget}

            onSave={
              handleSaveTarget
            }
          />

        </div>

        <div style={styles.card}>

          <BudgetTable
            budgets={draftBudgets}
            setBudgets={
              setDraftBudgets
            }
            categories={categories}
          />

        </div>

      </div>

    {
  showBudgetModal && (

    <div

      style={{

        position: "fixed",

        inset: 0,

        background:
          "rgba(0,0,0,0.65)",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        zIndex: 9999,
      }}
    >

      <div

        style={{

          width: "1100px",

          maxHeight: "80vh",

          overflowY: "auto",

          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            "16px",

          padding: "24px",
        }}
      >

        <div

          style={{

            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            marginBottom: "24px",
          }}
        >

          <div

            style={{

              fontSize: "24px",

              fontWeight: 700,
            }}
          >
            Saved Budgets
          </div>

          <button

            style={styles.ghostButton}

            onClick={() =>

              setShowBudgetModal(
                false
              )
            }
          >
            Close
          </button>

        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >

          {

            savedBudgets.map(

              (budget) => (

                <div

                  key={budget.id}

                  style={{

                    display: "grid",

                    gridTemplateColumns:
                      "2fr 1fr 1.5fr 1.5fr 1.5fr",

                    alignItems: "center",

                    gap: "16px",

                    padding: "18px",

                    background:
                      theme.colors.cardAlt,

                    border:
                      `1px solid ${theme.colors.border}`,

                    borderRadius: "12px",
                  }}
                >

                  {/* CATEGORY */}

                  <div>

                    <div

                      style={{

                        fontSize: "13px",

                        color:
                          theme.colors.textMuted,

                        marginBottom: "6px",
                      }}
                    >
                      CATEGORY
                    </div>

                    <div

                      style={{

                        fontWeight: 600,

                        fontSize: "18px",
                      }}
                    >
                      {budget.category}
                    </div>

                  </div>

                  {/* TYPE */}

                  <div>

                    <div

                      style={{

                        fontSize: "13px",

                        color:
                          theme.colors.textMuted,

                        marginBottom: "6px",
                      }}
                    >
                      TYPE
                    </div>

                    <div

                      style={{

                        display: "inline-flex",

                        padding:
                          "6px 10px",

                        borderRadius:
                          "999px",

                        fontSize: "13px",

                        background:

                          budget.budget_type ===
                          "annual"

                            ? "rgba(255,184,77,0.12)"

                            : "rgba(76,175,255,0.12)",

                        color:

                          budget.budget_type ===
                          "annual"

                            ? "#ffb84d"

                            : "#4cafef",
                      }}
                    >
                      {budget.budget_type}
                    </div>

                  </div>

                  {/* AMOUNT */}

                  <div>

                    <div

                      style={{

                        fontSize: "13px",

                        color:
                          theme.colors.textMuted,

                        marginBottom: "6px",
                      }}
                    >
                      AMOUNT
                    </div>

                    <div

                      style={{

                        fontWeight: 700,

                        fontSize: "20px",

                        color:
                          theme.colors.positive,
                      }}
                    >
                      {formatINR(
                        budget.amount
                      )}
                    </div>

                  </div>

                  {/* START */}

                  <div>

                    <div

                      style={{

                        fontSize: "13px",

                        color:
                          theme.colors.textMuted,

                        marginBottom: "6px",
                      }}
                    >
                      START
                    </div>

                    <div>

                      {budget.start_date}

                    </div>

                  </div>

                  {/* END */}

                  <div>

                    <div

                      style={{

                        fontSize: "13px",

                        color:
                          theme.colors.textMuted,

                        marginBottom: "6px",
                      }}
                    >
                      END
                    </div>

                    <div>

                      {budget.end_date}

                    </div>

                  </div>

                </div>
              )
            )
          }

        </div>

      </div>

    </div>
  )
}

{
  showConflictModal && (

    <div

      style={{

        position: "fixed",

        inset: 0,

        background:
          "rgba(0,0,0,0.7)",

        display: "flex",

        justifyContent:
          "center",

        alignItems: "center",

        zIndex: 9999,
      }}
    >

      <div

        style={{

          width: "520px",

          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius: "16px",

          padding: "24px",
        }}
      >

        <div

          style={{

            fontSize: "24px",

            fontWeight: 700,

            marginBottom: "20px",
          }}
        >
          Budget Already Exists
        </div>

        {

          conflicts.map(

            (conflict, index) => (

              <div
                key={index}
                style={{
                  marginBottom: "18px",
                }}
              >

                <div>

                  Conflict in
                  {" "}
                  <b>
                    {
                      conflict.category
                    }
                  </b>
                  {" "}
                  budget:

                </div>

                <div
                  style={{
                    marginTop: "12px",
                    marginBottom: "12px",

                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >

                  {/* CURRENT */}

                  <div>

                    <span
                      style={{
                        color:
                          theme.colors.textMuted,
                      }}
                    >
                      Current:
                    </span>

                    {" "}

                    <b>
                      {
                        conflict.existing_budget_type
                      }
                    </b>

                    {" · "}

                    {formatINR(
                      conflict.existing_amount
                    )}

                  </div>

                  {/* NEW */}

                  <div>

                    <span
                      style={{
                        color:
                          theme.colors.textMuted,
                      }}
                    >
                      New:
                    </span>

                    {" "}

                    <b>
                      {
                       conflict.new_budget_type
                      }
                    </b>

                    {" · "}

                    {formatINR(
                      conflict.new_amount
                    )}

                  </div>

                </div>

              </div>
            )
          )
        }

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
          }}
        >

          <button

            style={styles.ghostButton}

            onClick={() =>

              setShowConflictModal(
                false
              )
            }
          >
            Cancel
          </button>

          <button

            style={styles.actionButton}

            onClick={async () => {

              setShowConflictModal(
                false
              );

              await handleSaveBudgets(
                true
              );
            }}
          >
            Update Budget
          </button>

        </div>

      </div>

    </div>
  )
}

<BudgetSankeyChart
  budgets={savedBudgets}
  monthlyIncome={ budgetTarget?.monthly_income_target || 0}
/>



    </div>
  );
}