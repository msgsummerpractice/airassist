import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#003178", // primary
      dark: "#0d47a1", // primary-container
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#1b6d24", // secondary
      light: "#a0f399", // secondary-container
      contrastText: "#ffffff",
    },
    warning: {
      main: "#6c4300", // tertiary-container
      contrastText: "#ffab31",
    },
    error: {
      main: "#ba1a1a",
      contrastText: "#ffffff",
    },
    background: {
      default: "#f8f9ff", // background / surface
      paper: "#ffffff", // surface-container-lowest
    },
    text: {
      primary: "#121c2a", // on-surface
      secondary: "#434652", // on-surface-variant
    },
    divider: "#c3c6d4", // outline-variant
  },

  typography: {
    fontFamily: "Inter, sans-serif", // default for all body/label text
    h1: {
      fontFamily: "Manrope, sans-serif",
      fontSize: "2rem", // 32px
      fontWeight: 700,
      lineHeight: "40px",
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: "Manrope, sans-serif",
      fontSize: "1.5rem", // 24px
      fontWeight: 600,
      lineHeight: "32px",
    },
    body1: {
      fontFamily: "Inter, sans-serif",
      fontSize: "1rem", // 16px
      lineHeight: "24px",
    },
    body2: {
      fontFamily: "Inter, sans-serif",
      fontSize: "1.125rem", // 18px
      lineHeight: "28px",
    },
    caption: {
      fontFamily: "Inter, sans-serif",
      fontSize: "0.75rem", // 12px
      fontWeight: 600,
      lineHeight: "16px",
    },
    button: {
      fontFamily: "Inter, sans-serif",
      fontSize: "0.875rem", // 14px label-sm
      fontWeight: 500,
      letterSpacing: "0.01em",
      textTransform: "none", // prevents MUI's default ALL CAPS
    },
  },

  shape: {
    borderRadius: 8, // DEFAULT: 0.5rem — applied to buttons & inputs
  },

  shadows: [
    "none",
    "0px 4px 20px rgba(0,0,0,0.05)", // surface card shadow (elevation 1)
    "0px 4px 20px rgba(0,0,0,0.05)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
    "0px 4px 20px rgba(0,0,0,0.08)",
  ] as const,

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // cards get 0.75rem
          backgroundColor: "#ffffff",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 2,
            borderColor: "#003178", // 2px blue focus ring
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
        contained: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0px 4px 20px rgba(0,0,0,0.12)" },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 9999 }, // pill shape for status chips
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { borderRadius: 4 }, // 0.25rem for checkboxes
      },
    },
  },
});

export default theme;
