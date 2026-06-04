import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
} from "lucide-react";

import { DATE_RANGE_PRESETS } from "@/hooks/useScreenDateRange";
import { theme } from "@/theme/theme";

const c = theme.colors;

function formatShortDate(dateString) {
  if (!dateString) {
    return "";
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  );
}

export function PeriodSubtitle({
  label,
  prefix,
  style,
}) {
  if (!label) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "6px",
        fontFamily: theme.typography.caption.fontFamily,
        fontSize: theme.typography.caption.fontSize,
        color: c.textMuted,
        ...style,
      }}
    >
      {prefix ? `${prefix}: ` : ""}
      {label}
    </div>
  );
}

export function AsOfDateControl({
  value,
  onChange,
  label = "As of",
}) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 9px",
        background: c.cardAlt,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        color: c.textSecondary,
        fontFamily: theme.typography.body.fontFamily,
        fontSize: "12px",
      }}
    >
      <CalendarDays
        size={13}
        color={c.textSecondary}
      />
      <span>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        style={{
          background: "transparent",
          border: "none",
          color: c.textPrimary,
          fontFamily: theme.typography.mono.fontFamily,
          fontSize: "12px",
          outline: "none",
          colorScheme: "dark",
        }}
      />
    </label>
  );
}

export default function ScreenPeriodControl({
  range,
  compactLabel,
}) {
  const wrapperRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(
    range.preset === "custom",
  );
  const [customStart, setCustomStart] = useState(
    range.start || "",
  );
  const [customEnd, setCustomEnd] = useState(
    range.end || "",
  );
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setShowCustom(range.preset === "custom");
    setCustomStart(range.start || "");
    setCustomEnd(range.end || "");
  }, [open, range.end, range.preset, range.start]);

  const customValid =
    customStart && customEnd && customStart <= customEnd;

  function handlePresetClick(presetKey) {
    if (presetKey === "custom") {
      setShowCustom(true);
      return;
    }

    range.setPreset(presetKey);
    setShowCustom(false);
    setOpen(false);
  }

  function handleApplyCustom() {
    if (!customValid) {
      return;
    }

    range.setCustomRange(customStart, customEnd);
    setOpen(false);
  }

  const triggerLabel =
    compactLabel ??
    (range.preset === "custom"
      ? `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`
      : range.label);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        zIndex: 20,
      }}
    >
      <button
        onClick={() => {
          setOpen((value) => !value);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          padding: "7px 11px",
          background: open ? c.card : c.cardAlt,
          border: `1px solid ${open ? c.neutral : c.border}`,
          borderRadius: "8px",
          color: open ? c.neutral : c.textSecondary,
          cursor: "pointer",
          fontFamily: theme.typography.body.fontFamily,
          fontSize: "12px",
          fontWeight: 500,
          outline: "none",
          whiteSpace: "nowrap",
        }}
      >
        <CalendarDays
          size={13}
          color={open ? c.neutral : c.textSecondary}
        />
        <span>{triggerLabel}</span>
        <ChevronDown
          size={12}
          color={c.textMuted}
          style={{
            transform: open
              ? "rotate(180deg)"
              : "rotate(0deg)",
            transition: "transform 0.16s ease",
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            width: "226px",
            background: c.card,
            border: `1px solid ${c.border}`,
            borderRadius: "10px",
            boxShadow: "0 16px 44px rgba(0,0,0,0.5)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "5px" }}>
            {DATE_RANGE_PRESETS.map((preset) => {
              const active = range.preset === preset.key;
              const isHovered = hovered === preset.key;
              const customRow = preset.key === "custom";

              return (
                <div
                  key={preset.key}
                  onClick={() => {
                    handlePresetClick(preset.key);
                  }}
                  onMouseEnter={() => {
                    setHovered(preset.key);
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 9px",
                    borderRadius: "6px",
                    background: active
                      ? c.neutralDim
                      : isHovered
                        ? c.cardAlt
                        : "transparent",
                    color: active
                      ? c.neutral
                      : customRow && showCustom
                        ? c.neutral
                        : c.textSecondary,
                    cursor: "pointer",
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize: "13px",
                  }}
                >
                  <span>{preset.label}</span>
                  {active && !customRow && (
                    <Check
                      size={12}
                      color={c.neutral}
                    />
                  )}
                  {customRow && (
                    <ChevronDown
                      size={11}
                      color={
                        showCustom
                          ? c.neutral
                          : c.textMuted
                      }
                      style={{
                        transform: showCustom
                          ? "rotate(180deg)"
                          : "rotate(-90deg)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {showCustom && (
            <>
              <div
                style={{
                  height: "1px",
                  background: c.border,
                  margin: "0 5px",
                }}
              />

              <div style={{ padding: "10px" }}>
                <div style={inputGroupStyle}>
                  <div style={labelStyle}>From</div>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => {
                      setCustomStart(event.target.value);
                    }}
                    style={dateInputStyle}
                  />
                </div>

                <div style={inputGroupStyle}>
                  <div style={labelStyle}>To</div>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart || undefined}
                    onChange={(event) => {
                      setCustomEnd(event.target.value);
                    }}
                    style={dateInputStyle}
                  />
                </div>

                {customStart &&
                  customEnd &&
                  customStart > customEnd && (
                    <div
                      style={{
                        color: c.negative,
                        fontFamily:
                          theme.typography.caption.fontFamily,
                        fontSize: "11px",
                        marginBottom: "8px",
                      }}
                    >
                      End date must be after start date
                    </div>
                  )}

                <button
                  disabled={!customValid}
                  onClick={handleApplyCustom}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: customValid
                      ? c.neutral
                      : c.cardAlt,
                    border: "none",
                    borderRadius: "6px",
                    color: customValid
                      ? c.background
                      : c.textMuted,
                    cursor: customValid
                      ? "pointer"
                      : "not-allowed",
                    fontFamily: theme.typography.body.fontFamily,
                    fontSize: "12px",
                    fontWeight: 600,
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

const inputGroupStyle = {
  marginBottom: "9px",
};

const labelStyle = {
  color: theme.colors.textMuted,
  fontFamily: theme.typography.caption.fontFamily,
  fontSize: "10px",
  letterSpacing: "0.08em",
  marginBottom: "5px",
  textTransform: "uppercase",
};

const dateInputStyle = {
  width: "100%",
  background: theme.colors.sidebar,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: "6px",
  boxSizing: "border-box",
  color: theme.colors.textPrimary,
  colorScheme: "dark",
  fontFamily: theme.typography.mono.fontFamily,
  fontSize: "12px",
  outline: "none",
  padding: "7px 9px",
};
