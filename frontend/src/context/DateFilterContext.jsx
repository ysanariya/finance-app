import { createContext, useContext, useState, useEffect } from "react";

function today() { 
  return new Date().toISOString().split("T")[0]; 
}

function daysAgo(days) { 
  const d = new Date(); d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]; 
}

function currentFY() {
  const now = new Date(); const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { start: `${year}-04-01`, end: today(), }; 
}

function previousFY() {
  const now = new Date(); const year = now.getMonth() >= 3 ? now.getFullYear() - 1 : now.getFullYear() - 2;
  return { start: `${year}-04-01`, end: `${year + 1}-03-31`, }; 
}

const PRESETS = {
  last_week:          () => ({ start: daysAgo(7),   end: today() }),
  last_month:         () => ({ start: daysAgo(30),  end: today() }),
  last_quarter:       () => ({ start: daysAgo(90),  end: today() }),
  last_financial_year: () => currentFY(),
  previous_financial_year: () => previousFY(),
  custom:             null,
};

const DateFilterContext = createContext(null);

export function DateFilterProvider({ children }) {
  const [filter, setFilter] = useState(() => {
    // Rehydrate from sessionStorage on mount
    const saved =
      typeof window !== "undefined"
        ? sessionStorage.getItem("dateFilter")
        : null;
    return saved ? JSON.parse(saved) : {
      preset: "last_financial_year",
      ...currentFY()
    };
  });

  useEffect(() => {
    sessionStorage.setItem("dateFilter", JSON.stringify(filter));
  }, [filter]);

  function applyPreset(preset) {
    if (preset === "custom") return; // handled separately
    const { start, end } = PRESETS[preset]();
    setFilter({ preset, start, end });
  }

  function applyCustom(start, end) {
    setFilter({ preset: "custom", start, end });
  }

  // What components actually use to build API URLs
  function getQueryParams() {
    return `start_date=${filter.start}&end_date=${filter.end}`;
  }

  return (
    <DateFilterContext.Provider value={{ filter, applyPreset, applyCustom, getQueryParams }}>
      {children}
    </DateFilterContext.Provider>
  );
}

export const useDateFilter = () => useContext(DateFilterContext);