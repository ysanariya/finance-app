import { useState, useEffect } from "react";
import NetWorthChart from "./NetWorthChart";
import NetWorthCard from "./NetWorthCard";
import Login from "./Login";
import TopStatCards from "./TopStatCards"
import AssetAllocation from "./AssetAllocation"
import CashflowChart from "./CashflowChart"

document.body.style.margin = 0;
document.body.style.fontFamily = "Inter, sans-serif";
document.body.style.backgroundColor = "#121212";


function Header({ onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
      }}
    >
      <h1 style={{ color: "#e5e7eb", fontWeight: "600" }}>FinSight</h1>

      <div style={{ position: "relative" }}>
        <div
          onClick={() => setOpen(!open)}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#1f2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#e5e7eb",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Y
        </div>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "45px",
              background: "#121616",
              border: "1px solid #1f2626",
              borderRadius: "8px",
              padding: "10px",
              minWidth: "120px",
            }}
          >
            <div
              onClick={onLogout}
              style={{
                cursor: "pointer",
                color: "#ef4444",
                fontSize: "14px",
              }}
            >
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div
      style={{
        background: "#0b0f0f",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px 20px",
          fontFamily: "sans-serif",
        }}
      >
        <Header
          onLogout={() => {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
          }}
        />

        {/* Net Worth Card */}
        <NetWorthCard />
		
		<TopStatCards />

        {/* Grid Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
        <NetWorthChart />
		<CashflowChart />
        <AssetAllocation />
        </div>
      </div>
    </div>
  );
}

export default App;