export const theme = {
  colors: {
    // Backgrounds — warm blacks, not cold neutral
    background: "#0C0B09",
    sidebar:    "#111009",
    card:       "#181610",
    cardAlt:    "#1F1D15",
    border:     "#2A2720",

    // Text hierarchy
    textPrimary:   "#EDE8DF",  // warm white
    textSecondary: "#8A837A",  // mid grey
    textMuted:     "#736E6A",  // near-invisible

    // Semantic — clear & unambiguous
    positive:    "#3DB882",    // green: good metrics, assets, surplus
    positiveDim: "#3DB88214",
    negative:    "#D95F4B",    // red: liabilities, expenses, bad deltas
    negativeDim: "#D95F4B14",
    neutral:     "#7986B8",    // indigo: income, neutral data
    neutralDim:  "#7986B814",

    // Asset category colours (allocation chart only)
    cat: {
      equities:    "#3DB882",  // green
      cash:        "#7986B8",  // indigo
      gold:        "#C9A84C",  // actual gold
      fd:          "#A89060",  // sand — fixed income / FD
      retirement:  "#7986B8",  // indigo
      real_estate: "#A89060",  // sand
      receivables: "#6B6560",  // muted
      otherassets: "#3D3A34",  // very muted
    },

    // Badges on dark backgrounds
    badge: {
      healthyBg:   "#0F3D2A",
      healthyText: "#3DB882",
      riskBg:      "#3D1812",
      riskText:    "#D95F4B",
      neutralBg:   "#1A1E30",
      neutralText: "#7986B8",
    },

    // Chart
    chart: {
      grid: "rgba(255,255,255,0.10)",
      axis: "#6B6560",
      area: "rgba(61,184,130,0.07)",
    },
  },

  layout: {
    sidebarWidth: "160px",
    radius:       "10px",
    cardRadius:   "10px",
    spacing:      "10px",
  },
};
