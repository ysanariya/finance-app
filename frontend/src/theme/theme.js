// ─────────────────────────────────────────────────────────────────────────────
//  FinSight — Design Token System
//  Cool navy / dark blue finance theme
//  Drop-in: import { theme } from '@/theme/theme.js'
// ─────────────────────────────────────────────────────────────────────────────

export const theme = {

  // ── TYPOGRAPHY ──────────────────────────────────────────────────────────────
  // Load via index.html or global CSS:
  // <link rel="preconnect" href="https://fonts.googleapis.com" />
  // <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />

  typography: {
    // Brand / Logo
    logo: {
      fontFamily: "'Sora', sans-serif",
      fontWeight: 700,
      fontSize:   "18px",
      letterSpacing: "-0.02em",
    },

    // Page headings  e.g. "Transactions", "Rules"
    heading: {
      fontFamily: "'Sora', sans-serif",
      fontWeight: 600,
      fontSize:   "22px",
      lineHeight: "1.25",
      letterSpacing: "-0.02em",
    },

    // Section / card headings
    subheading: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 600,
      fontSize:   "15px",
      lineHeight: "1.4",
      letterSpacing: "-0.01em",
    },

    // Nav labels, sidebar items
    navLabel: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize:   "15px",
      lineHeight: "1.5",
      letterSpacing: "0",
    },

    // Body copy, descriptions, subtitles
    body: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize:   "14px",
      lineHeight: "1.6",
      letterSpacing: "0",
    },

    // Table column headers
    tableHeader: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 500,
      fontSize:   "12px",
      lineHeight: "1.4",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },

    // Table cell body text  (descriptions, merchant names)
    tableCell: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize:   "13px",
      lineHeight: "1.5",
      letterSpacing: "0",
    },

    // Amounts, dates, codes — monospaced for alignment
    mono: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 400,
      fontSize:   "13px",
      lineHeight: "1.5",
      letterSpacing: "-0.01em",
    },

    // Amount values specifically (larger + medium weight)
    amount: {
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 500,
      fontSize:   "13px",
      lineHeight: "1.5",
      letterSpacing: "-0.02em",
    },

    // Badge / pill labels, status chips
    badge: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 500,
      fontSize:   "11px",
      lineHeight: "1.4",
      letterSpacing: "0.03em",
    },

    // Input placeholders
    placeholder: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize:   "13px",
      letterSpacing: "0",
    },

    // Small helper text, footnotes
    caption: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      fontWeight: 400,
      fontSize:   "11px",
      lineHeight: "1.5",
      letterSpacing: "0.01em",
    },
  },

  // ── COLORS ──────────────────────────────────────────────────────────────────
  colors: {
    // Backgrounds — deep navy/charcoal, cold and sharp
    background: "#080B12",
    sidebar:    "#0A0D16",
    // Added glass background token
    glassCard: "rgba(15,20,30,0.6)", // semi-transparent dark glass
    glassOverlay: "rgba(0,0,0,0.4)",
    card:       "#0F1420",
    cardAlt:    "#141926",
    border:     "#1E2535",

    // Text hierarchy
    textPrimary:   "#E4EAF4",
    textSecondary: "#6B7A99",
    textMuted:     "#3D4A63",

    // Semantic
    positive:    "#00C896",
    positiveDim: "#00C89614",
    negative:    "#E8445A",
    negativeDim: "#E8445A14",
    neutral:     "#3B9EFF",
    neutralDim:  "#3B9EFF14",

    // Asset category colours (allocation chart only)
    cat: {
      equities:    "#00C896",
      cash:        "#3B9EFF",
      gold:        "#E0B94A",
      fd:          "#6C8EBF",
      retirement:  "#7B6FD4",
      real_estate: "#5C7A9E",
      receivables: "#3D5070",
      otherassets: "#1E2D45",
    },

    // Badges
    badge: {
      healthyBg:   "#002E22",
      healthyText: "#00C896",
      riskBg:      "#2E0A10",
      riskText:    "#E8445A",
      neutralBg:   "#0A1E36",
      neutralText: "#3B9EFF",
      mutedBg:     "#141926",
      mutedText:   "#6B7A99",
    },

    // Chart
    chart: {
      grid:        "rgba(59,158,255,0.08)",
      primary:     "#00C896",
      secondary:   "#E8445A",
      surplus:     "#7C9CFF",
      tertiary:    "#3B9EFF",
      dotties:     "#ffffff",
      axis:        "#3D4A63",
      area:        "rgba(0,200,150,0.06)",
      pie: [
        "#00C896",
        "#3B9EFF",
        "#E8445A",
        "#E0B94A",
        "#7B6FD4",
        "#00D4FF",
        "#FF6B35",
        "#00B8A9",
      ],
      barPrimary:   "#00C896",
      barSecondary: "#3B9EFF",
      barDanger:    "#E8445A",
      tooltipBg:    "#0F1420",
    },
  },

  // ── TABLE ────────────────────────────────────────────────────────────────────
  table: {
    // Structural
    background:        "#0F1420",        // table wrapper bg
    headerBackground:  "#080B12",        // <thead> row bg — darker than body
    rowBackground:     "transparent",    // default row
    rowHover:          "#141926",        // on hover
    rowAlt:            "transparent",    // no zebra — clean flat rows
    rowSelected:       "#0A1E36",        // selected / active row
    border:            "#1E2535",        // all dividers (1px solid)
    headerBorder:      "#1E2535",        // border under thead
    outerRadius:       "10px",           // table card border-radius

    // Header cell
    headerColor:       "#3D4A63",        // text color (muted, lets data stand out)
    headerFontFamily:  "'IBM Plex Sans', sans-serif",
    headerFontSize:    "11px",
    headerFontWeight:  "500",
    headerLetterSpacing: "0.07em",
    headerTextTransform: "uppercase",
    headerPaddingV:    "10px",
    headerPaddingH:    "14px",

    // Body cell
    cellColor:         "#E4EAF4",
    cellFontFamily:    "'IBM Plex Sans', sans-serif",
    cellFontSize:      "13px",
    cellFontWeight:    "400",
    cellPaddingV:      "13px",
    cellPaddingH:      "14px",
    cellLineHeight:    "1.45",

    // Description column (long UPI strings) — slightly muted + truncated
    descriptionColor:      "#9AAABF",
    descriptionFontSize:   "12px",
    descriptionFontFamily: "'IBM Plex Sans', sans-serif",
    descriptionMaxWidth:   "420px",       // clamp width, show ellipsis

    // Date column — monospaced for alignment
    dateFontFamily:  "'IBM Plex Mono', monospace",
    dateFontSize:    "12px",
    dateFontWeight:  "400",
    dateColor:       "#6B7A99",

    // Amount column — always monospaced, right-aligned
    amountFontFamily:  "'IBM Plex Mono', monospace",
    amountFontSize:    "13px",
    amountFontWeight:  "500",
    amountColorIncome: "#00C896",
    amountColorExpense:"#E8445A",

    // Merchant column
    merchantFontWeight: "500",
    merchantColor:      "#C5CFE4",

    // Category badge inside table
    badgePaddingV:    "3px",
    badgePaddingH:    "9px",
    badgeRadius:      "5px",
    badgeFontSize:    "11px",
    badgeFontWeight:  "500",
    badgeFontFamily:  "'IBM Plex Sans', sans-serif",

    // Inline action buttons (e.g. "+ Rule")
    actionBtnBackground:  "#141926",
    actionBtnBorder:      "#1E2535",
    actionBtnColor:       "#6B7A99",
    actionBtnHoverBg:     "#1E2535",
    actionBtnHoverColor:  "#3B9EFF",
    actionBtnRadius:      "5px",
    actionBtnFontSize:    "11px",

    // Empty state
    emptyColor:       "#3D4A63",
    emptyFontSize:    "13px",

    // Pagination
    paginationColor:       "#6B7A99",
    paginationActiveColor: "#E4EAF4",
    paginationActiveBg:    "#1E2535",
    paginationRadius:      "6px",
    paginationFontSize:    "12px",
  },

  // ── LAYOUT ───────────────────────────────────────────────────────────────────
  layout: {
    sidebarWidth: "160px",
    radius:       "10px",
    cardRadius:   "10px",
    spacing:      "10px",
  },
};