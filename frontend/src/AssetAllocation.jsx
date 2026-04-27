import { useEffect, useState } from "react";
import { fetchWithAuth } from "./api";
import { theme } from "./theme";

const c = theme.colors;

// Maps every backend category to a palette colour
function getCategoryColor(category) {
  return c.cat[category.toLowerCase()] || c.textMuted;
}

export default function AssetAllocation() {
  const [data, setData]           = useState([]);
  const [hovered, setHovered]     = useState(null);

  // ── API call unchanged ──────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const res = await fetchWithAuth("http://localhost:8000/assets/breakdown");
      setData(res);
    }
    load();
  }, []);

  const total = data.reduce((sum, item) => sum + item.total, 0);
  const formatLakh = (val) => `₹${(val / 100000).toFixed(1)}L`;

  return (
    <div
      style={{
        background: c.card,
        border: `0.5px solid ${c.border}`,
        borderRadius: theme.layout.cardRadius,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ fontSize: "9px", color: c.textMuted, letterSpacing: "0.1em" }}>
          ASSET ALLOCATION
        </div>
        <div style={{ fontSize: "13px", fontWeight: "500", color: c.textPrimary }}>
          {formatLakh(total)}
        </div>
      </div>

      {/* Segmented bar */}
      <div
        style={{
          height: "6px",
          borderRadius: "3px",
          display: "flex",
          gap: "2px",
          overflow: "hidden",
          marginBottom: "14px",
        }}
      >
        {data.map((item, i) => (
          <div
            key={i}
            style={{
              flex: item.total,
              background: getCategoryColor(item.category),
              borderRadius: "2px",
              opacity: hovered === null || hovered === i ? 1 : 0.3,
              transition: "opacity 0.15s",
              cursor: "default",
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
      </div>

      {/* Legend rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        {data.map((item, i) => {
          const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : 0;
          const color = getCategoryColor(item.category);

          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: hovered === null || hovered === i ? 1 : 0.4,
                transition: "opacity 0.15s",
                cursor: "default",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Left: dot + name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                  fontSize: "11px",
                  color: c.textSecondary,
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                {item.category}
              </div>

              {/* Right: pct · value */}
              <div
                style={{
                  fontSize: "11px",
                  color: c.textMuted,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {pct}% · {formatLakh(item.total)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
