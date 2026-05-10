import { useEffect, useState } from "react";

import { fetchWithAuth } from "../api.js";
import { theme } from "../theme";

export default function Transactions() {

  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [showRuleModal, setShowRuleModal] =
    useState(false);

  const [ruleForm, setRuleForm] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const limit = 50;

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  async function fetchTransactions() {

    try {

      setLoading(true);

      const data =
        await fetchWithAuth(
          `http://127.0.0.1:8000/transactions?page=${page}&limit=${limit}`
        );

      setTransactions(
        data.transactions || []
      );

      setTotal(
        data.total || 0
      );

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  }

  async function handleUpload() {

    if (!selectedFile) {
      alert("Select a file first");
      return;
    }

    try {

      const token =
        localStorage.getItem("token");

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          "http://127.0.0.1:8000/transactions/upload",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body: formData,
          }
        );

      const data =
        await response.json();

      setUploadMessage(
        `Parsed ${data.parsed} | Inserted ${data.inserted} | Duplicates ${data.duplicates}`
      );

      fetchTransactions();

    } catch (err) {

      console.error(err);

      setUploadMessage(
        "Upload failed"
      );
    }
  }

  function openRuleModal(tx) {

    let merchantGuess = "";

    const description =
      tx.description.toUpperCase();

    if (
      description.includes("BLINKIT")
    ) {
      merchantGuess = "BLINKIT";
    }

    else if (
      description.includes("ZOMATO")
    ) {
      merchantGuess = "ZOMATO";
    }

    else if (
      description.includes("STARBUCKS")
    ) {
      merchantGuess = "STARBUCKS";
    }

    else if (
      description.includes("INDIGO")
    ) {
      merchantGuess = "INDIGO";
    }

    setRuleForm({

      pattern:
        merchantGuess,

      merchant:
        merchantGuess,

      match_type:
        "contains",

      category:
        "",

      transaction_type: "",

      priority:
        50,
    });

    setShowRuleModal(true);
  }

  async function createRule() {

    try {

      const token =
        localStorage.getItem("token");

      const response =
        await fetch(
          "http://127.0.0.1:8000/rules",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              ...ruleForm,

              transaction_type:

                ruleForm.transaction_type === ""

                  ? null

                  : ruleForm.transaction_type,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Failed to create rule"
        );

        return;
      }

      await fetch(
        "http://127.0.0.1:8000/rules/reclassify",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setShowRuleModal(false);

      fetchTransactions();

      alert(
        "Rule created and transactions reclassified"
      );

    } catch (err) {

      console.error(err);

      alert(
        "Failed to create rule"
      );
    }
  }

  return (

    <div
      style={{
        padding: "24px",
        color:
          theme.colors.textPrimary,
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: "30px",
          }}
        >
          Transactions
        </h1>

        <p
          style={{
            color:
              theme.colors.textSecondary,
          }}
        >
          Upload, classify and review financial activity
        </p>

      </div>

      {/* UPLOAD */}

      <div
        style={{
          background:
            theme.colors.surface,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius: "16px",

          padding: "20px",

          marginBottom: "24px",
        }}
      >

        <div
          style={{
            fontSize: "18px",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          Upload Bank Statement
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >

          <input
            type="file"
            accept=".txt"

            onChange={(e) =>
              setSelectedFile(
                e.target.files[0]
              )
            }

            style={{
              color:
                theme.colors.textSecondary,
            }}
          />

          <button
            onClick={handleUpload}

            style={{
              background:
                theme.colors.primary,

              color:
                theme.colors.background,

              border: "none",

              padding:
                "10px 18px",

              borderRadius: "10px",

              fontWeight: 600,

              cursor: "pointer",
            }}
          >
            Upload Statement
          </button>

        </div>

        {uploadMessage && (

          <div
            style={{
              marginTop: "14px",
              color:
                theme.colors.textSecondary,
            }}
          >
            {uploadMessage}
          </div>

        )}

      </div>

      {/* TABLE */}

      <div
        style={{
          background:
            theme.colors.surface,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius: "16px",

          overflow: "hidden",
        }}
      >

        {/* TABLE HEADER */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "120px 2fr 140px 160px 120px 140px",

            padding: "16px 20px",

            borderBottom:
              `1px solid ${theme.colors.border}`,

            color:
              theme.colors.textSecondary,

            fontSize: "13px",

            fontWeight: 600,
          }}
        >

          <div>Date</div>
          <div>Description</div>
          <div>Merchant</div>
          <div>Category</div>
          <div>Type</div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            Amount
          </div>

        </div>

        {/* BODY */}

        {loading ? (

          <div
            style={{
              padding: "24px",
            }}
          >
            Loading...
          </div>

        ) : (

          transactions.map((tx) => {

            const isUnclassified =
              !tx.category;

            return (

              <div
                key={tx.id}

                style={{
                  display: "grid",

                  gridTemplateColumns:
                    "120px 2fr 140px 160px 120px 140px",

                  padding: "16px 20px",

                  borderBottom:
                    `1px solid ${theme.colors.border}`,

                  alignItems: "center",

                  background:
                    isUnclassified
                      ? "rgba(201,168,76,0.05)"
                      : "transparent",
                }}
              >

                <div
                  style={{
                    color:
                      theme.colors.textSecondary,
                  }}
                >
                  {new Date(
                    tx.recorded_at
                  ).toLocaleDateString()}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.4,
                    paddingRight: "18px",
                    wordBreak:
                      "break-word",
                  }}
                >
                  {tx.description}
                </div>

                <div>
                  {tx.merchant || "-"}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection:
                      "column",

                    alignItems:
                      "flex-start",

                    gap: "8px",
                  }}
                >

                  {tx.category ? (

                    <span
                      style={{
                        background:
                          theme.colors.neutralDim,

                        color:
                          theme.colors.neutral,

                        padding:
                          "4px 10px",

                        borderRadius:
                          "999px",

                        fontSize:
                          "12px",
                      }}
                    >
                      {tx.category}
                    </span>

                  ) : (

                    <>
                      <span
                        style={{
                          background:
                            "rgba(201,168,76,0.12)",

                          color:
                            "#C9A84C",

                          padding:
                            "4px 10px",

                          borderRadius:
                            "999px",

                          fontSize:
                            "12px",
                        }}
                      >
                        Unclassified
                      </span>

                      <button
                        onClick={() =>
                          openRuleModal(tx)
                        }

                        style={{
                          background:
                            "transparent",

                          color:
                            theme.colors.textPrimary,

                          border:
                            `1px solid ${theme.colors.border}`,

                          padding:
                            "6px 10px",

                          borderRadius:
                            "8px",

                          cursor:
                            "pointer",

                          fontSize:
                            "12px",
                        }}
                      >
                        + Rule
                      </button>
                    </>
                  )}

                </div>

                <div
                  style={{
                    color:
                      tx.transaction_type ===
                      "income"

                        ? theme.colors.positive

                        : tx.transaction_type ===
                          "expense"

                        ? theme.colors.negative

                        : theme.colors.textSecondary,

                    textTransform:
                      "capitalize",
                  }}
                >
                  {tx.transaction_type || "-"}
                </div>

                <div
                  style={{
                    textAlign:
                      "right",

                    color:
                      tx.amount > 0

                        ? theme.colors.positive

                        : theme.colors.negative,

                    fontWeight: 600,

                    fontSize: "16px",
                  }}
                >
                  ₹
                  {Math.abs(
                    tx.amount
                  ).toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </div>

              </div>
            );
          })

        )}

      </div>

      {/* PAGINATION */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems: "center",

          marginTop: "18px",
        }}
      >

        <div
          style={{
            color:
              theme.colors.textSecondary,

            fontSize: "13px",
          }}
        >
          Showing{" "}

          {(page - 1) * limit + 1}

          -

          {Math.min(
            page * limit,
            total
          )}

          {" "}of {total}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            disabled={page === 1}

            onClick={() =>
              setPage(page - 1)
            }

            style={paginationBtn}
          >
            Previous
          </button>

          <button
            disabled={
              page * limit >= total
            }

            onClick={() =>
              setPage(page + 1)
            }

            style={paginationBtn}
          >
            Next
          </button>

        </div>

      </div>

      {/* MODAL */}

      {showRuleModal && (

        <div
          style={{
            position: "fixed",

            inset: 0,

            background:
              "rgba(0,0,0,0.75)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            zIndex: 999,
          }}
        >

          <div
            style={{
              width: "460px",

              background:
                theme.colors.surface,

              border:
                `1px solid ${theme.colors.border}`,

              borderRadius: "18px",

              padding: "28px",
            }}
          >

            <h2
              style={{
                marginTop: 0,
                marginBottom: "24px",
              }}
            >
              Create Rule
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection:
                  "column",

                gap: "14px",
              }}
            >

              <input
                placeholder="Pattern"

                value={
                  ruleForm.pattern
                }

                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    pattern:
                      e.target.value,
                  })
                }

                style={inputStyle}
              />

              <input
                placeholder="Merchant"

                value={
                  ruleForm.merchant
                }

                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    merchant:
                      e.target.value,
                  })
                }

                style={inputStyle}
              />

              <input
                placeholder="Category"

                value={
                  ruleForm.category
                }

                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    category:
                      e.target.value,
                  })
                }

                style={inputStyle}
              />

              <select
                value={
                  ruleForm.transaction_type
                }

                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,

                    transaction_type:
                      e.target.value,
                  })
                }

                style={inputStyle}
              >

                <option value="">
                  Infer from bank statement
                </option>

                <option value="expense">
                  Expense
                </option>

                <option value="income">
                  Income
                </option>

                <option value="transfer">
                  Transfer
                </option>

              </select>

              <input
                type="number"

                placeholder="Priority"

                value={
                  ruleForm.priority
                }

                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    priority:
                      Number(
                        e.target.value
                      ),
                  })
                }

                style={inputStyle}
              />

              <button
                onClick={createRule}

                style={{
                  background:
                    theme.colors.primary,

                  color:
                    theme.colors.background,

                  border: "none",

                  padding: "14px",

                  borderRadius: "12px",

                  fontWeight: 600,

                  cursor: "pointer",

                  marginTop: "8px",
                }}
              >
                Save Rule
              </button>

              <button
                onClick={() =>
                  setShowRuleModal(false)
                }

                style={{
                  background:
                    "transparent",

                  color:
                    theme.colors.textSecondary,

                  border:
                    `1px solid ${theme.colors.border}`,

                  padding: "14px",

                  borderRadius: "12px",

                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

const inputStyle = {

  background:
    "#0B0B08",

  border:
    "1px solid rgba(255,255,255,0.08)",

  color:
    "#EDE7D9",

  padding: "12px",

  borderRadius: "10px",

  fontSize: "14px",

  outline: "none",
};

const paginationBtn = {

  background:
    "#181610",

  border:
    "1px solid rgba(255,255,255,0.08)",

  color:
    "#EDE8DF",

  padding:
    "10px 14px",

  borderRadius:
    "10px",

  cursor:
    "pointer",
};