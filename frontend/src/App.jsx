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
          Y
        </div>

        <span className="sb-username">Yash K.</span>

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeTab, setActiveTab] =
    useState("Overview");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={() => setIsLoggedIn(true)}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        onLogout={handleLogout}
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