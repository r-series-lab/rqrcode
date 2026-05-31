import { alpha, createTheme } from "@mui/material/styles";

const fontFamily = [
  '"SF Pro Display"',
  '"Avenir Next"',
  '"PingFang SC"',
  '"Hiragino Sans GB"',
  '"Microsoft YaHei"',
  "sans-serif",
].join(", ");

export const rqrcodeTheme = createTheme({
  shape: {
    borderRadius: 20,
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#f5f3ee",
      contrastText: "#111214",
    },
    secondary: {
      main: "#b8c0cc",
    },
    background: {
      default: "#0d0f12",
      paper: "rgba(20, 22, 26, 0.84)",
    },
    text: {
      primary: "#f5f3ee",
      secondary: "#98a0aa",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: {
    fontFamily,
    button: {
      fontWeight: 700,
      letterSpacing: 0,
      textTransform: "none",
    },
    h1: {
      fontSize: "1.1rem",
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h2: {
      fontSize: "1rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "::selection": {
          backgroundColor: "rgba(245, 243, 238, 0.24)",
        },
        body: {
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 32%)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 16,
          paddingInline: 16,
        },
        contained: {
          color: "#111214",
          background:
            "linear-gradient(180deg, rgba(247,248,250,1) 0%, rgba(226,229,233,1) 100%)",
          boxShadow: "0 16px 30px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.4)",
          "&:hover": {
            background:
              "linear-gradient(180deg, rgba(252,252,252,1) 0%, rgba(232,235,239,1) 100%)",
          },
        },
        outlined: {
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: "rgba(255,255,255,0.02)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(17, 19, 23, 0.8)",
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 20px 46px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(24px)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          minHeight: 30,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.04)",
          color: "#d9dde3",
        },
        label: {
          paddingInline: 10,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255,255,255,0.06)",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          color: "#cfd4db",
          border: "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "rgba(255,255,255,0.03)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.03)",
          boxShadow: `inset 0 1px 0 ${alpha("#ffffff", 0.02)}`,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.08)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.16)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.24)",
          },
        },
        input: {
          lineHeight: 1.65,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 0,
          color: "#cfd4db",
          paddingInline: 16,
          borderRadius: 14,
          "&.Mui-selected": {
            color: "#111214",
            background:
              "linear-gradient(180deg, rgba(247,248,250,1) 0%, rgba(223,227,232,1) 100%)",
            boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        grouped: {
          border: "0 !important",
          margin: "0 !important",
          borderRadius: "14px !important",
        },
      },
    },
  },
});
