import { useState, useEffect } from "react";

import NetWorthChart from "./NetWorthChart";
import NetWorthCard from "./NetWorthCard";
import Login from "./pages/Login";
import TopStatCards from "./TopStatCards";
import AssetAllocation from "./AssetAllocation";
import CashflowChart from "./CashflowChart";

import Transactions from "./pages/Transactions";
import Cashflow from "./pages/CashFlow";
import Rules from "./pages/Rules";

import { DateFilterProvider } from "./context/DateFilterContext";
import GlobalDateFilter from "./components/filters/GlobalDateFilter";

import ReviewInbox from "./pages/ReviewInbox";


import { theme } from "./theme/theme";

import "./index.css";


const NAV_ITEMS = [
  { label: "Overview" },
  { label: "Assets" },
  { label: "Liabilities" },
  { label: "Cash Flow" },
  { label: "Goals" },
  { label: "Transactions" },
  { label: "Rules" },
  { label: "Review Inbox" },
];

function Sidebar({
  onLogout,
  currentUser,
  activeTab,
  setActiveTab,
}) {

  const [showLogout, setShowLogout] =
    useState(false);

  return (
    <aside
      className="sidebar"
      style={{
        background: theme.colors.sidebar,
        borderRight: `1px solid ${theme.colors.border}`,
      }}
    >

      <div
        className="sb-logo"
        style={{
          fontFamily:
            theme.typography.logo.fontFamily,

          fontWeight:
            theme.typography.logo.fontWeight,

          fontSize:
            theme.typography.logo.fontSize,

          letterSpacing:
            theme.typography.logo.letterSpacing,

          color:
            theme.colors.textPrimary,
        }}
      >
        Fin
        <em
          style={{
            color: theme.colors.positive,
            fontStyle: "normal",
          }}
        >
          Sight
        </em>
      </div>

      <nav>

        {NAV_ITEMS.map((item) => (

          <div
            key={item.label}

            className={`nav-item ${
              item.label === activeTab
                ? "active"
                : ""
            }`}

            onClick={() =>
              setActiveTab(item.label)
            }

            style={{
              fontFamily:
                theme.typography.navLabel.fontFamily,

              fontWeight:
                theme.typography.navLabel.fontWeight,

              fontSize:
                theme.typography.navLabel.fontSize,

              color:
                item.label === activeTab
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,

              background:
                item.label === activeTab
                  ? theme.colors.card
                  : "transparent",

              borderRadius:
                theme.layout.radius,
            }}
          >

            <span
              className="nav-dot"
              style={{
                background:
                  item.label === activeTab
                    ? theme.colors.positive
                    : theme.colors.textMuted,
              }}
            />

            {item.label}

          </div>
        ))}

      </nav>

      <div
        className="sb-footer"
        style={{
          position: "relative",
        }}
      >

        <div
          className="sb-avatar"

          onClick={() =>
            setShowLogout((v) => !v)
          }

          title="Account"

          style={{
            background:
              theme.colors.cardAlt,

            color:
              theme.colors.textPrimary,

            border:
              `1px solid ${theme.colors.border}`,

            fontFamily:
              theme.typography.body.fontFamily,
          }}
        >
          {currentUser?.name?.[0] || "U"}
        </div>

        <span
          className="sb-username"
          style={{
            fontFamily:
              theme.typography.caption.fontFamily,

            fontSize:
              theme.typography.caption.fontSize,

            color:
              theme.colors.textSecondary,
          }}
        >
          {currentUser?.name || "User"}
        </span>

        {showLogout && (

          <div
            className="logout-dropdown"
            style={{
              background:
                theme.colors.card,

              border:
                `1px solid ${theme.colors.border}`,

              borderRadius:
                theme.layout.radius,
            }}
          >

            <div
              className="logout-btn"

              onClick={() => {

                setShowLogout(false);

                onLogout();
              }}

              style={{
                color:
                  theme.colors.negative,

                fontFamily:
                  theme.typography.body.fontFamily,
              }}
            >
              Logout
            </div>

          </div>

        )}

      </div>

    </aside>
  );
}

function BottomTabs({
  onLogout,
  activeTab,
  setActiveTab,
}) {

  return (

    <nav
      className="bottom-tabs"
      style={{
        background:
          theme.colors.sidebar,

        borderTop:
          `1px solid ${theme.colors.border}`,
      }}
    >

      {NAV_ITEMS.slice(0, 5).map((item) => (

        <div
          key={item.label}

          className={`bt-item ${
            item.label === activeTab
              ? "active"
              : ""
          }`}

          onClick={() =>
            setActiveTab(item.label)
          }

          style={{
            fontFamily:
              theme.typography.navLabel.fontFamily,

            fontSize:
              theme.typography.navLabel.fontSize,

            color:
              item.label === activeTab
                ? theme.colors.textPrimary
                : theme.colors.textSecondary,
          }}
        >

          <div
            className="bt-dot"
            style={{
              background:
                item.label === activeTab
                  ? theme.colors.positive
                  : theme.colors.textMuted,
            }}
          />

          {item.label}

        </div>
      ))}

      <div
        className="bt-item"

        onClick={onLogout}

        style={{
          color: theme.colors.negative,

          fontFamily:
            theme.typography.navLabel.fontFamily,
        }}
      >

        <div
          className="bt-dot"
          style={{
            background:
              theme.colors.negative,
          }}
        />

        Logout

      </div>

    </nav>
  );
}

function Dashboard() {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: theme.layout.spacing,
      }}
    >
      <NetWorthCard />
      <TopStatCards />
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: theme.layout.spacing,
        }}
      >
        <NetWorthChart />
        <CashflowChart />
      </div>
      <AssetAllocation />
    </div>
  );
}

export default function App() {

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("Overview");

  const [currentUser, setCurrentUser] =
    useState(null);

  useEffect(() => {

    async function loadUser() {

      const token =
        localStorage.getItem("token");

      if (!token) {
        return;
      }

      try {

        const response = await fetch(
          "http://localhost:8000/me",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {

          localStorage.removeItem(
            "token"
          );

          return;
        }

        const data =
          await response.json();

        setCurrentUser(data);

        setIsLoggedIn(true);

      } catch (err) {

        console.error(
          "Failed to load user",
          err
        );
      }
    }

    loadUser();

  }, []);

  function handleLogout() {

    localStorage.removeItem(
      "token"
    );

    setCurrentUser(null);

    setIsLoggedIn(false);

    setActiveTab("Overview");
  }

  if (!isLoggedIn) {

    return (
      <Login
        onLogin={() => {
          window.location.reload();
        }}
      />

    );
  }

  return (
    <DateFilterProvider>
        
    <div
      className="app-layout"
      style={{
        background:
          theme.colors.background,

        color:
          theme.colors.textPrimary,
      }}
    >
      <Sidebar
        onLogout={handleLogout}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main
        className="main-content"
        style={{
          background:
            theme.colors.background,
        }}
      >
      <GlobalDateFilter />

        {activeTab === "Overview" && (
          <Dashboard />
        )}

        {activeTab === "Transactions" && (
          <Transactions />
        )}

        {activeTab === "Cash Flow" && (
          <Cashflow />
        )}

        {activeTab === "Rules" && (
          <Rules />
        )}

        {activeTab === "Review Inbox" && (
          <ReviewInbox />
        )}

      </main>

      <BottomTabs
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      </div>
    </DateFilterProvider>
    
  );
}