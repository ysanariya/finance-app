import { useEffect, useMemo, useState } from "react";

function toDateInputValue(date) {
  return date.toISOString().split("T")[0];
}

function today() {
  return toDateInputValue(new Date());
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

function currentFinancialYear() {
  const now = new Date();
  const year =
    now.getMonth() >= 3
      ? now.getFullYear()
      : now.getFullYear() - 1;

  return {
    start: `${year}-04-01`,
    end: today(),
  };
}

function previousFinancialYear() {
  const now = new Date();
  const year =
    now.getMonth() >= 3
      ? now.getFullYear() - 1
      : now.getFullYear() - 2;

  return {
    start: `${year}-04-01`,
    end: `${year + 1}-03-31`,
  };
}

export const DATE_RANGE_PRESETS = [
  {
    key: "last_7_days",
    label: "Last 7 Days",
    getRange: () => ({
      start: daysAgo(7),
      end: today(),
    }),
  },
  {
    key: "last_30_days",
    label: "Last 30 Days",
    getRange: () => ({
      start: daysAgo(30),
      end: today(),
    }),
  },
  {
    key: "last_3_months",
    label: "Last 3 Months",
    getRange: () => ({
      start: daysAgo(90),
      end: today(),
    }),
  },
  {
    key: "current_financial_year",
    label: "This Financial Year",
    getRange: currentFinancialYear,
  },
  {
    key: "previous_financial_year",
    label: "Previous Financial Year",
    getRange: previousFinancialYear,
  },
  {
    key: "custom",
    label: "Custom Range",
    getRange: null,
  },
];

const PRESET_MAP = Object.fromEntries(
  DATE_RANGE_PRESETS.map((preset) => [
    preset.key,
    preset,
  ]),
);

function readStoredRange(screenKey) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(
      `finsight:dateRange:${screenKey}`,
    );

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function resolveRange(presetKey) {
  const preset =
    PRESET_MAP[presetKey] ??
    PRESET_MAP.current_financial_year;

  if (!preset.getRange) {
    return currentFinancialYear();
  }

  return preset.getRange();
}

function formatMonthYear(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

function formatRangeLabel(range) {
  const preset = PRESET_MAP[range.preset];

  if (
    range.preset !== "custom" &&
    preset?.key !== "current_financial_year" &&
    preset?.key !== "previous_financial_year"
  ) {
    return preset?.label ?? "";
  }

  if (!range.start || !range.end) {
    return preset?.label ?? "";
  }

  const start = formatMonthYear(range.start);
  const end = formatMonthYear(range.end);

  return start === end ? start : `${start} - ${end}`;
}

export function formatScreenDateRange(start, end) {
  if (!start || !end) {
    return "";
  }

  const startLabel = formatMonthYear(start);
  const endLabel = formatMonthYear(end);

  return startLabel === endLabel
    ? startLabel
    : `${startLabel} - ${endLabel}`;
}

export function useScreenDateRange(
  screenKey,
  defaultPreset = "current_financial_year",
) {
  const [range, setRange] = useState(() => {
    const stored = readStoredRange(screenKey);

    if (stored?.start && stored?.end) {
      return stored;
    }

    return {
      preset: defaultPreset,
      ...resolveRange(defaultPreset),
    };
  });

  useEffect(() => {
    localStorage.setItem(
      `finsight:dateRange:${screenKey}`,
      JSON.stringify(range),
    );
  }, [range, screenKey]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();

    if (range.start) {
      params.append("start_date", range.start);
    }

    if (range.end) {
      params.append("end_date", range.end);
    }

    return params;
  }, [range.start, range.end]);

  return {
    preset: range.preset,
    start: range.start,
    end: range.end,
    label: formatRangeLabel(range),
    queryParams,
    setPreset: (preset) => {
      setRange({
        preset,
        ...resolveRange(preset),
      });
    },
    setCustomRange: (start, end) => {
      setRange({
        preset: "custom",
        start,
        end,
      });
    },
  };
}
