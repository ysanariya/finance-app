import { useState, useRef, useEffect } from "react";
import { CalendarDays, ChevronDown, Check } from "lucide-react";
import { useDateFilter } from "@/context/DateFilterContext.jsx";
import { theme } from "@/theme/theme.js";

const c = theme.colors;

const PRESETS = [
  { key: "last_week",            label: "Last 7 Days" },
  { key: "last_month",           label: "Last 30 Days" },
  { key: "last_quarter",         label: "Last 3 Months" },
  { key: "last_financial_year",  label: "This Financial Year" },
  { key: "previous_financial_year", label: "Previous Financial Year" },
  { key: "custom",               label: "Custom Range" },
];

// Format a YYYY-MM-DD string to "12 Mar" for display in the pill
function formatShort(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function GlobalDateFilter() {
  const { filter, applyPreset, applyCustom } = useDateFilter();

  const [open, setOpen]               = useState(false);
  const [showCustom, setShowCustom]   = useState(filter.preset === "custom");
  const [customStart, setCustomStart] = useState(filter.start || "");
  const [customEnd, setCustomEnd]     = useState(filter.end   || "");
  const [hovered, setHovered]         = useState(null);

  const wrapperRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // When dropdown opens, sync custom inputs to current filter
  useEffect(() => {
    if (open) {
      setShowCustom(filter.preset === "custom");
      setCustomStart(filter.start || "");
      setCustomEnd(filter.end   || "");
    }
  }, [open]);

  // Pill label — shows date range for custom, preset name otherwise
  const pillLabel =
    filter.preset === "custom" && filter.start && filter.end
      ? `${formatShort(filter.start)} – ${formatShort(filter.end)}`
      : PRESETS.find(p => p.key === filter.preset)?.label ?? "This Financial Year";

  function handlePresetClick(key) {
    if (key === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    applyPreset(key);
    setOpen(false);
  }

  function handleApplyCustom() {
    if (!customStart || !customEnd || customStart > customEnd) return;
    applyCustom(customStart, customEnd);
    setOpen(false);
  }

  const customValid =
    customStart && customEnd && customStart <= customEnd;

  return (
    <div
      ref={wrapperRef}
      style={{
        display:        "flex",
        justifyContent: "flex-end",
        marginBottom:   "16px",
        position:       "relative",
        zIndex:         200,
      }}
    >
      {/* ── TRIGGER PILL ── */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "6px",
          padding:     "6px 11px 6px 9px",
          background:  open ? c.card : c.cardAlt,
          border:      `1px solid ${open ? c.neutral : c.border}`,
          borderRadius: "8px",
          cursor:       "pointer",
          outline:      "none",
          transition:   "border-color 0.15s, background 0.15s",
        }}
      >
        <CalendarDays
          size={13}
          color={open ? c.neutral : c.textSecondary}
          style={{ flexShrink: 0, transition: "color 0.15s" }}
        />

        <span
          style={{
            fontFamily:    theme.typography.body.fontFamily,
            fontSize:      "12px",
            fontWeight:    "500",
            letterSpacing: "0.01em",
            color:         open ? c.neutral : c.textSecondary,
            transition:    "color 0.15s",
            whiteSpace:    "nowrap",
          }}
        >
          {pillLabel}
        </span>

        <ChevronDown
          size={11}
          color={c.textMuted}
          style={{
            transform:  open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            marginLeft: "2px",
          }}
        />
      </button>

      {/* ── DROPDOWN PANEL ── */}
      {open && (
        <div
          style={{
            position:     "absolute",
            top:          "calc(100% + 5px)",
            right:        0,
            width:        "210px",
            background:   c.card,
            border:       `1px solid ${c.border}`,
            borderRadius: "10px",
            boxShadow:    "0 12px 40px rgba(0,0,0,0.6)",
            overflow:     "hidden",
          }}
        >
          {/* Preset list */}
          <div style={{ padding: "5px" }}>
            {PRESETS.map((preset) => {
              const isActive  = filter.preset === preset.key;
              const isHovered = hovered === preset.key;
              const isCustomRow = preset.key === "custom";

              return (
                <div
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key)}
                  onMouseEnter={() => setHovered(preset.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "space-between",
                    padding:        "8px 9px",
                    borderRadius:   "6px",
                    cursor:         "pointer",
                    background:
                      isActive
                        ? c.neutralDim
                        : isHovered
                        ? c.cardAlt
                        : "transparent",
                    transition: "background 0.1s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.typography.body.fontFamily,
                      fontSize:   "13px",
                      fontWeight: isActive ? "500" : "400",
                      color:
                        isActive
                          ? c.neutral
                          : isCustomRow && showCustom
                          ? c.neutral
                          : c.textSecondary,
                      transition: "color 0.1s",
                    }}
                  >
                    {preset.label}
                  </span>

                  {isActive && !isCustomRow && (
                    <Check size={12} color={c.neutral} />
                  )}

                  {/* Arrow hint for custom row */}
                  {isCustomRow && (
                    <ChevronDown
                      size={11}
                      color={showCustom ? c.neutral : c.textMuted}
                      style={{
                        transform:  showCustom ? "rotate(180deg)" : "rotate(-90deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── CUSTOM DATE INPUTS ── */}
          {showCustom && (
            <>
              <div
                style={{
                  height:     "1px",
                  background: c.border,
                  margin:     "0 5px",
                }}
              />

              <div style={{ padding: "10px" }}>

                {/* FROM */}
                <div style={{ marginBottom: "8px" }}>
                  <div style={labelStyle}>From</div>
                  <input
                    type="date"
                    value={customStart}
                    onChange={e => setCustomStart(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>

                {/* TO */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={labelStyle}>To</div>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={e => setCustomEnd(e.target.value)}
                    style={dateInputStyle}
                  />
                </div>

                {/* Validation hint */}
                {customStart && customEnd && customStart > customEnd && (
                  <div
                    style={{
                      fontSize:    "11px",
                      color:       c.negative,
                      fontFamily:  theme.typography.caption.fontFamily,
                      marginBottom: "8px",
                    }}
                  >
                    End date must be after start date
                  </div>
                )}

                {/* Apply button */}
                <button
                  onClick={handleApplyCustom}
                  disabled={!customValid}
                  style={{
                    width:        "100%",
                    padding:      "8px",
                    background:   customValid ? c.neutral : c.cardAlt,
                    color:        customValid ? "#080B12" : c.textMuted,
                    border:       "none",
                    borderRadius: "6px",
                    fontFamily:   theme.typography.body.fontFamily,
                    fontSize:     "12px",
                    fontWeight:   "600",
                    cursor:       customValid ? "pointer" : "not-allowed",
                    transition:   "background 0.15s, color 0.15s",
                    letterSpacing: "0.01em",
                  }}
                >
                  Apply Range
                </button>

              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared micro-styles ───────────────────────────────────────────────────────

const labelStyle = {
  fontSize:      "10px",
  color:         theme.colors.textMuted,
  fontFamily:    theme.typography.caption.fontFamily,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom:  "5px",
};

const dateInputStyle = {
  width:       "100%",
  background:  theme.colors.sidebar,
  border:      `1px solid ${theme.colors.border}`,
  borderRadius: "6px",
  color:       theme.colors.textPrimary,
  padding:     "7px 9px",
  fontFamily:  theme.typography.mono.fontFamily,
  fontSize:    "12px",
  outline:     "none",
  colorScheme: "dark",
  boxSizing:   "border-box",
};