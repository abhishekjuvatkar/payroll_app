import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { exportPayrollExcel } from "../services/api";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
];

const currentYear = new Date().getFullYear();

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  if (typeof detail === "string") {
    return detail;
  }

  return "Failed to export payroll Excel file.";
};

export default function ExportsScreen() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const handleExport = async () => {
    const numericMonth = Number(month);
    const numericYear = Number(year);

    if (!numericMonth || numericMonth < 1 || numericMonth > 12) {
      setSnackbar({
        open: true,
        message: "Please select a valid month.",
        severity: "warning"
      });
      return;
    }

    if (!numericYear || numericYear < 2000 || numericYear > 2100) {
      setSnackbar({
        open: true,
        message: "Please enter a valid year.",
        severity: "warning"
      });
      return;
    }

    setExporting(true);

    try {
      await exportPayrollExcel(numericMonth, numericYear);

      setSnackbar({
        open: true,
        message: `Payroll_${numericMonth}_${numericYear}.xlsx downloaded successfully.`,
        severity: "success"
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error),
        severity: "error"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Exports
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Download the one-time payroll Excel file for a selected month and year.
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <CalendarMonthIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Export Payroll
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          The export uses the same month/year records saved through the Payroll Entry
          screen.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="export-month-label">Month</InputLabel>

            <Select
              labelId="export-month-label"
              value={month}
              label="Month"
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {MONTHS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Year"
            type="number"
            size="small"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            inputProps={{
              min: 2000,
              max: 2100,
              step: 1
            }}
            sx={{ width: { xs: "100%", sm: 130 } }}
          />

          <Button
            variant="contained"
            startIcon={
              exporting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <FileDownloadIcon />
              )
            }
            onClick={handleExport}
            disabled={exporting}
            sx={{
              minHeight: 40,
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5
            }}
          >
            {exporting ? "Exporting..." : "Export Payroll Excel"}
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4500}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false
            }))
          }
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}