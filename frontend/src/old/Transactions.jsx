import { useEffect, useState } from "react";
import { theme } from "../theme";

export default function Transactions() {

  const [transactions, setTransactions] =
    useState([]);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [monthFilter, setMonthFilter] =
    useState("");

  const [merchantFilter, setMerchantFilter] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("");

  const [typeFilter, setTypeFilter] =
    useState("");

  const [amountFilter, setAmountFilter] =
    useState("");

  const [searchFilter, setSearchFilter] =
    useState("");

  async function fetchTransactions() {

    try {

      const token =
        localStorage.getItem("token");

      const params =
        new URLSearchParams();

      params.append("page", page);

      params.append("limit", 50);

      if (monthFilter) {
        params.append(
          "month",
          monthFilter
        );
      }

      if (merchantFilter) {
        params.append(
          "merchant",
          merchantFilter
        );
      }

      if (categoryFilter) {
        params.append(
          "category",
          categoryFilter
        );
      }

      if (typeFilter) {
        params.append(
          "transaction_type",
          typeFilter
        );
      }

      if (amountFilter) {
        params.append(
          "amount_type",
          amountFilter
        );
      }

      if (searchFilter) {
        params.append(
          "search",
          searchFilter
        );
      }

      const response = await fetch(
        `http://localhost:8000/transactions?${params.toString()}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      setTransactions(
        data.transactions || []
      );

      setTotalPages(
        data.total_pages || 1
      );

      setTotalPages(
        Math.ceil(
          (data.total || 0) / 50
        )
      );

    } catch (err) {

      console.error(err);
    }
  }

  useEffect(() => {

    fetchTransactions();

  }, [
    page,
    monthFilter,
    merchantFilter,
    categoryFilter,
    typeFilter,
    amountFilter,
    searchFilter,
  ]);

  async function handleUpload() {

    if (!selectedFile) {
      return;
    }

    try {

      setLoading(true);

      const token =
        localStorage.getItem("token");

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      await fetch(
        "http://localhost:8000/transactions/upload",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

      fetchTransactions();

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  }

  function formatCurrency(value) {

    return (
      "₹" +
      Number(value || 0)
        .toLocaleString(
          "en-IN",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )
    );
  }

  function getBadgeStyle() {

    return {
      background:
        theme.colors.badge.neutralBg,

      color:
        theme.colors.badge.neutralText,

      borderRadius:
        theme.table.badgeRadius,

      padding:
        `${theme.table.badgePaddingV} ${theme.table.badgePaddingH}`,

      fontFamily:
        theme.table.badgeFontFamily,

      fontSize:
        theme.table.badgeFontSize,

      fontWeight:
        theme.table.badgeFontWeight,

      display: "inline-block",
    };
  }

  return (

    <div
      style={{
        background:
          theme.colors.background,

        color:
          theme.colors.textPrimary,

        minHeight: "100vh",
      }}
    >

      <h1
        style={{
          fontFamily:
            theme.typography.heading.fontFamily,

          fontWeight:
            theme.typography.heading.fontWeight,

          fontSize:
            theme.typography.heading.fontSize,

          letterSpacing:
            theme.typography.heading.letterSpacing,

          color:
            theme.colors.textPrimary,

          marginBottom: "4px",
        }}
      >
        Transactions
      </h1>

      <p
        style={{
          fontFamily:
            theme.typography.body.fontFamily,

          fontSize:
            theme.typography.body.fontSize,

          color:
            theme.colors.textSecondary,

          marginBottom: "24px",
        }}
      >
        Upload, classify and review financial activity
      </p>

      {/* Upload Card */}

      <div
        style={{
          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            theme.layout.cardRadius,

          padding: "20px",

          marginBottom: "18px",
        }}
      >

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >

          <input
            type="file"

            onChange={(e) =>
              setSelectedFile(
                e.target.files[0]
              )
            }

            style={{
              color:
                theme.colors.textPrimary,

              fontFamily:
                theme.typography.body.fontFamily,
            }}
          />

          <button
            onClick={handleUpload}

            disabled={loading}

            style={{
              background:
                theme.colors.positive,

              color:
                theme.colors.background,

              border: "none",

              borderRadius: "8px",

              padding:
                "10px 16px",

              cursor: "pointer",

              fontFamily:
                theme.typography.body.fontFamily,

              fontWeight: 600,

              fontSize:
                theme.typography.body.fontSize,
            }}
          >
            {loading
              ? "Uploading..."
              : "Upload Statement"}
          </button>

        </div>

      </div>

      {/* Filters */}

      <div
        style={{
          background:
            theme.colors.card,

          border:
            `1px solid ${theme.colors.border}`,

          borderRadius:
            theme.layout.cardRadius,

          padding: "18px",

          display: "grid",

          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",

          gap: "12px",

          marginBottom: "18px",
        }}
      >

        <input
          type="month"

          value={monthFilter}

          onChange={(e) =>
            setMonthFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        />

        <input
          placeholder="Merchant"

          value={merchantFilter}

          onChange={(e) =>
            setMerchantFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        />

        <input
          placeholder="Category"

          value={categoryFilter}

          onChange={(e) =>
            setCategoryFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        />

        <select
          value={typeFilter}

          onChange={(e) =>
            setTypeFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        >

          <option value="">
            All Types
          </option>

          <option value="income">
            Income
          </option>

          <option value="expense">
            Expense
          </option>

          <option value="transfer">
            Transfer
          </option>

        </select>

        <select
          value={amountFilter}

          onChange={(e) =>
            setAmountFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        >

          <option value="">
            All Amounts
          </option>

          <option value="positive">
            Positive
          </option>

          <option value="negative">
            Negative
          </option>

          <option value="zero">
            Zero
          </option>

        </select>

        <input
          placeholder="Search"

          value={searchFilter}

          onChange={(e) =>
            setSearchFilter(
              e.target.value
            )
          }

          style={inputStyle()}
        />

      </div>

      {/* Table */}

      <div
        style={{
          background:
            theme.table.background,

          border:
            `1px solid ${theme.table.border}`,

          borderRadius:
            theme.table.outerRadius,

          overflow: "hidden",
        }}
      >

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
          }}
        >

          <thead
            style={{
              background:
                theme.table.headerBackground,

              borderBottom:
                `1px solid ${theme.table.headerBorder}`,
            }}
          >

            <tr>

              {[
                "Date",
                "Description",
                "Merchant",
                "Category",
                "Type",
                "Amount",
              ].map((header) => (

                <th
                  key={header}

                  style={{
                    color:
                      theme.table.headerColor,

                    fontFamily:
                      theme.table.headerFontFamily,

                    fontSize:
                      theme.table.headerFontSize,

                    fontWeight:
                      theme.table.headerFontWeight,

                    letterSpacing:
                      theme.table.headerLetterSpacing,

                    textTransform:
                      theme.table.headerTextTransform,

                    padding:
                      `${theme.table.headerPaddingV} ${theme.table.headerPaddingH}`,

                    textAlign: "left",
                  }}
                >
                  {header}
                </th>

              ))}

            </tr>

          </thead>

          <tbody>

            {transactions.map((tx) => (

              <tr
                key={tx.id}

                style={{
                  borderBottom:
                    `1px solid ${theme.table.border}`,
                }}

                onMouseEnter={(e) => {

                  e.currentTarget.style.background =
                    theme.table.rowHover;
                }}

                onMouseLeave={(e) => {

                  e.currentTarget.style.background =
                    "transparent";
                }}
              >

                {/* DATE */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,

                    fontFamily:
                      theme.table.dateFontFamily,

                    fontSize:
                      theme.table.dateFontSize,

                    color:
                      theme.table.dateColor,
                  }}
                >
                  {tx.recorded_at
                    ?.split("T")[0]
                    ?.split("-")
                    ?.reverse()
                    ?.join("/")}
                </td>

                {/* DESCRIPTION */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,

                    color:
                      theme.table.descriptionColor,

                    fontSize:
                      theme.table.descriptionFontSize,

                    fontFamily:
                      theme.table.descriptionFontFamily,

                    maxWidth:
                      theme.table.descriptionMaxWidth,

                    overflow: "hidden",

                    textOverflow:
                      "ellipsis",
                  }}
                >
                  {tx.description}
                </td>

                {/* MERCHANT */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,

                    color:
                      theme.table.merchantColor,

                    fontWeight:
                      theme.table.merchantFontWeight,
                  }}
                >
                  {tx.merchant || "-"}
                </td>

                {/* CATEGORY */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,
                  }}
                >

                  <span
                    style={
                      getBadgeStyle()
                    }
                  >
                    {tx.category ||
                      "Unclassified"}
                  </span>

                </td>

                {/* TYPE */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,

                    color:
                      tx.transaction_type ===
                      "income"

                        ? theme.colors.positive

                        : tx.transaction_type ===
                          "expense"

                        ? theme.colors.negative

                        : theme.colors.textSecondary,

                    fontFamily:
                      theme.typography.body.fontFamily,

                    fontWeight: 500,
                  }}
                >
                  {tx.transaction_type}
                </td>

                {/* AMOUNT */}

                <td
                  style={{
                    padding:
                      `${theme.table.cellPaddingV} ${theme.table.cellPaddingH}`,

                    color:
                      tx.amount >= 0

                        ? theme.table.amountColorIncome

                        : theme.table.amountColorExpense,

                    fontFamily:
                      theme.table.amountFontFamily,

                    fontSize:
                      theme.table.amountFontSize,

                    fontWeight:
                      theme.table.amountFontWeight,

                    textAlign: "right",
                  }}
                >
                  {formatCurrency(
                    Math.abs(
                      tx.amount
                    )
                  )}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* Pagination */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "center",
          gap: "10px",
          marginTop: "20px",
        }}
      >

        <button
          disabled={page === 1}

          onClick={() =>
            setPage(page - 1)
          }

          style={paginationButton()}
        >
          Previous
        </button>

        <div
          style={{
            color:
              theme.colors.textSecondary,

            fontFamily:
              theme.typography.body.fontFamily,
          }}
        >
          Page {page} / {totalPages}
        </div>

        <button
          disabled={
            page === totalPages
          }

          onClick={() =>
            setPage(page + 1)
          }

          style={paginationButton()}
        >
          Next
        </button>

      </div>

    </div>
  );

  function inputStyle() {

    return {
      background:
        theme.colors.background,

      border:
        `1px solid ${theme.colors.border}`,

      color:
        theme.colors.textPrimary,

      borderRadius: "8px",

      padding:
        "10px 14px",

      outline: "none",

      fontFamily:
        theme.typography.body.fontFamily,

      fontSize:
        theme.typography.body.fontSize,
    };
  }

  function paginationButton() {

    return {
      background:
        theme.colors.cardAlt,

      border:
        `1px solid ${theme.colors.border}`,

      color:
        theme.colors.textPrimary,

      borderRadius: "8px",

      padding:
        "8px 14px",

      cursor: "pointer",

      fontFamily:
        theme.typography.body.fontFamily,
    };
  }
}