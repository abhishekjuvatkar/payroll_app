import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2563EB"
    },
    secondary: {
      main: "#0EA5E9"
    },
    background: {
      default: "#EEF2FF",
      paper: "#FFFFFF"
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B"
    }
  },
  shape: {
    borderRadius: 16
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
    h4: {
      fontWeight: 800
    },
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    },
    button: {
      textTransform: "none",
      fontWeight: 700
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true
      }
    },
    MuiAutocomplete: {
      defaultProps: {
        size: "small"
      }
    },
    MuiButton: {
      defaultProps: {
        variant: "contained"
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700
        }
      }
    }
  }
});

export default theme;