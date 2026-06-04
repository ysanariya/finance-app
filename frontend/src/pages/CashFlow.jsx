import { useEffect, useState } from "react";

import { fetchWithAuth } from "../services/api";
import { theme } from "../theme/theme";
import ScreenPeriodControl from "../components/filters/ScreenPeriodControl";
import { useScreenDateRange } from "../hooks/useScreenDateRange";

import { formatINR } from "../utils/formatters";

import KPISummaryCard from "../components/cards/KPISummaryCard";
import CategoryRankingList from "../components/cards/CategoryRankingList";
import CashflowTrendChart from "../components/charts/CashflowTrendChart";
import CategoryTrendChart from "../components/charts/CategoryTrendChart";
import MerchantTable from "../components/tables/MerchantTable";
import IncomeTable from "../components/tables/IncomeTable";


export default function Cashflow() {
  const [summary, setSummary] = useState(null);
  const [monthlyExpenseTrend, setMonthlyExpenseTrend] = useState([]);
  const [monthlyIncomeTrend, setMonthlyIncomeTrend] = useState([]);
  const [categories, setCategories] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [incomeByCategory, setIncomeByCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryTrend, setCategoryTrend] = useState([]);

  const dateRange = useScreenDateRange(
    "cashflow",
    "current_financial_year",
  );

  async function loadData() {
    try {
      setLoading(true);

      const params = dateRange.queryParams;

      const paramsString = params.toString();
      const query = paramsString ? `?${paramsString}` : "";

      const [
        summaryRes,
        ExpenseTrendRes,
        IncomeTrendRes,
        categoryRes,
        merchantRes,
        incomeByCategoryRes,
      ] = await Promise.all([
        fetchWithAuth(
          `http://localhost:8000/dashboard/monthly-cashflow${query}`,
        ),
        fetchWithAuth(
          `http://localhost:8000/dashboard/monthly-expense-trend${query}`,
        ),
        fetchWithAuth(
          `http://localhost:8000/dashboard/monthly-income-trend${query}`,
        ),
        fetchWithAuth(
          `http://localhost:8000/dashboard/category-breakdown${query}`,
        ),
        fetchWithAuth(`http://localhost:8000/dashboard/top-merchants${query}`),
        fetchWithAuth(`http://localhost:8000/dashboard/top-income${query}`),
      ]);

      setSummary({
        avg_monthly_income: summaryRes?.income || 0,
        avg_monthly_expense: summaryRes?.expenses || 0,
        avg_monthly_surplus: summaryRes?.surplus || 0,
        savings_rate_pct:
          summaryRes?.income > 0
            ? ((summaryRes.surplus / summaryRes.income) * 100).toFixed(1)
            : 0,
      });

      setMonthlyExpenseTrend(ExpenseTrendRes?.trend || []);
      setMonthlyIncomeTrend(IncomeTrendRes?.trend || []);
      setCategories(categoryRes?.categories || []);

      const categoryData = categoryRes?.categories || [];

      if (categoryData.length > 0) {
        const topCategory = categoryData[0]?.category;

        setSelectedCategory(topCategory);

        const trendRes = await fetchWithAuth(
          `http://localhost:8000/dashboard/category-trend?category=${encodeURIComponent(topCategory)}${paramsString ? `&${paramsString}` : ""}`,
        );

        setCategoryTrend(trendRes?.trend || []);
      }

      const merchantData = merchantRes?.merchants || [];
      const totalMerchantSpend = merchantData.reduce(
        (sum, m) => sum + (m.amount || 0),
        0,
      );

      const incomeCategoryData = incomeByCategoryRes?.merchants || [];
      const totalIncome = incomeCategoryData.reduce(
        (sum, c) => sum + (c.amount || 0),
        0,
      );

      console.log("Total Income:", totalIncome);
      console.log("Income by Category:", incomeCategoryData);

      const incomeWithPercentages = incomeCategoryData.map((c) => ({
        ...c,
        percentage:
          totalIncome > 0 ? ((c.amount / totalIncome) * 100).toFixed(1) : 0,
      }));

      setIncomeByCategory(incomeWithPercentages);

      setMerchants(
        merchantData.map((m) => ({
          ...m,
          percentage:
            totalMerchantSpend > 0
              ? ((m.amount / totalMerchantSpend) * 100).toFixed(1)
              : 0,
        })),
      );
    } catch (err) {
      console.error("Expense dashboard error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [dateRange.start, dateRange.end]);

  const allMonths = [
    ...new Set([
      ...monthlyExpenseTrend.map((i) => i.month),
      ...monthlyIncomeTrend.map((i) => i.month),
    ]),
  ].sort();

  const combinedCashflowTrend = allMonths.map((month) => {
    const expenseItem = monthlyExpenseTrend.find((i) => i.month === month);

    const incomeItem = monthlyIncomeTrend.find((i) => i.month === month);

    const income = incomeItem?.amount || 0;
    const expense = expenseItem?.amount || 0;

    return {
      month,
      income,
      expense,
      surplus: income - expense,
    };
  });

  const totalCategorySpend = categoryTrend.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );

  const avgCategorySpend =
    categoryTrend.length > 0 ? totalCategorySpend / categoryTrend.length : 0;

  const peakMonth = categoryTrend.reduce(
    (max, item) => ((item.amount || 0) > (max.amount || 0) ? item : max),
    { amount: 0, month: "-" },
  );

  const firstMonthAmount = categoryTrend[0]?.amount || 0;

  const lastMonthAmount = categoryTrend[categoryTrend.length - 1]?.amount || 0;

  const trendPercentage =
    firstMonthAmount > 0
      ? (
          ((lastMonthAmount - firstMonthAmount) / firstMonthAmount) *
          100
        ).toFixed(1)
      : 0;

  async function handleCategoryChange(category) {
    try {
      setSelectedCategory(category);

      const params = new URLSearchParams(
        dateRange.queryParams,
      );

      params.append("category", category);

      const res = await fetchWithAuth(
        `http://localhost:8000/dashboard/category-trend?${params.toString()}`,
      );

      setCategoryTrend(res?.trend || []);
    } catch (err) {
      console.error("Category trend failed", err);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "24px",
          color: theme.colors.textSecondary,
          fontFamily: theme.typography.body.fontFamily,
          fontSize: theme.typography.body.fontSize,
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: theme.colors.background,
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: theme.typography.heading.fontFamily,
              fontWeight: theme.typography.heading.fontWeight,
              fontSize: theme.typography.heading.fontSize,
              letterSpacing: theme.typography.heading.letterSpacing,
              color: theme.colors.textPrimary,
            }}
          >
            Cash Flow Analytics
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
              color: theme.colors.textSecondary,
            }}
          >
            Income and Spending behaviour with cashflow trends
          </p>
        </div>

        <ScreenPeriodControl range={dateRange} />
      </div>

      {/* SUMMARY CARDS */}
      <KPISummaryCard
        summary={summary}
        periodLabel={dateRange.label}
      />

      {/* CHART ROW */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* CASHFLOW TREND */}
        <CashflowTrendChart
          combinedCashflowTrend={combinedCashflowTrend}
          periodLabel={dateRange.label}
        />

        {/* CATEGORY ANALYTICS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.85fr 1.15fr",
            gap: "16px",
            gridColumn: "span 2",
          }}
        >
          {/* CATEGORY RANKING */}
          <CategoryRankingList
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            periodLabel={dateRange.label}
          />

          {/* CATEGORY TREND */}
          <CategoryTrendChart
            selectedCategory={selectedCategory}
            categoryTrend={categoryTrend}
            categories={categories}
            onCategoryChange={handleCategoryChange}
            periodLabel={dateRange.label}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* TOP MERCHANTS TABLE */}
        <MerchantTable
          merchants={merchants}
          periodLabel={dateRange.label}
        />

        {/* TOP INCOME TABLE */}
        <IncomeTable
          incomeByCategory={incomeByCategory}
          periodLabel={dateRange.label}
        />
      </div>
    </div>
  );
}
