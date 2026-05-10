import { useState, useEffect } from "react";

import NetWorthChart from "./NetWorthChart";
import NetWorthCard from "./NetWorthCard";
import Login from "./Login";
import TopStatCards from "./TopStatCards";
import AssetAllocation from "./AssetAllocation";
import CashflowChart from "./CashflowChart";

import Transactions from "./pages/Transactions";

import "./index.css";

const NAV_ITEMS = [
  { label: "Overview" },
  { label: "Assets" },
  { label: "Liabilities" },
  { label: "Income" },
  { label: "Goals" },
  { label: "Transactions" },
];

function Sidebar({
  onLogout,
  currentUser,
  activeTab,
  setActiveTab,
}) {
  const [showLogout, setShowLogout] = useState(false);

  return (
    <aside className="sidebar">
      <div className="sb-logo">
        Fin<em>Sight</em>
      </div>

      <nav>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`nav-item ${
              item.label === activeTab ? "active" : ""
            }`}
            onClick={() => setActiveTab(item.label)}
          >
            <span className="nav-dot" />
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sb-footer" style={{ position: "relative" }}>
        <div
          className="sb-avatar"
          onClick={() => setShowLogout((v) => !v)}
          title="Account"
        >
          {currentUser?.name?.[0] || "U"}
        </div>

        <span className="sb-username">{currentUser?.name || "User"}</span>

        {showLogout && (
          <div className="logout-dropdown">
            <div
              className="logout-btn"
              onClick={() => {
                setShowLogout(false);
                onLogout();
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
    <nav className="bottom-tabs">
      {NAV_ITEMS.slice(0, 4).map((item) => (
        <div
          key={item.label}
          className={`bt-item ${
            item.label === activeTab ? "active" : ""
          }`}
          onClick={() => setActiveTab(item.label)}
        >
          <div className="bt-dot" />
          {item.label}
        </div>
      ))}

      <div
        className="bt-item"
        onClick={onLogout}
        style={{ color: "#D95F4B" }}
      >
        <div className="bt-dot" />
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
        gap: "10px",
      }}
    >
      {/* Hero */}
      <NetWorthCard />

      {/* Stats */}
      <TopStatCards />

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "10px",
        }}
      >
        <NetWorthChart />
        <CashflowChart />
      </div>

      {/* Allocation */}
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

    <div className="app-layout">

      <Sidebar
        onLogout={handleLogout}
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">

        {activeTab === "Overview" && (
          <Dashboard />
        )}

        {activeTab === "Transactions" && (
          <Transactions />
        )}

      </main>

      <BottomTabs
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

    </div>
  );
}