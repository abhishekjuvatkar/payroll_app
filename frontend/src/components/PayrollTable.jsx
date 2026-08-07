
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Typography,
  Stack,
  Divider
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PayrollRow from "./PayrollRow";
import { savePayrollEntries, exportPayrollExcel, fetchPayrollEntries } from "../services/api";

const emptyRow = () => ({
  id: crypto.randomUUID(),
  employee: null,
  salaryHead: null,
  amount: "",
  remarks: ""
});

export default function PayrollTable({ month, year }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    setLoading(true);
    fetchPayrollEntries(month, year)
      .then((data) => {
        if (data?.length) {
          setRows(
            data.map((entry) => ({
              id: crypto.randomUUID(),
              employee: {
                id: entry.employee_id,
                employee_code: entry.employee_code,
                employee_name: entry.employee_name
              },
              salaryHead: {
                id: entry.salary_head_id,
                salary_head: entry.salary_head
              },
              amount: entry.actual_value,
              remarks: entry.remarks || ""
            }))
          );
        } else {
          setRows([emptyRow()]);
        }
      })
      .catch(() => setRows([emptyRow()]))
      .finally(() => setLoading(false));
  }, [month, year]);

  const handleRowChange = (index, updatedRow) => {
    setRows((prev) => prev.map((r, i) => (i === index ? updatedRow : r)));
  };

  const handleAddRow = () => setRows((prev) => [...prev, emptyRow()]);

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const validateRows = () =>
    rows.length > 0 &&
    rows.every(
      (row) => row.employee && row.salaryHead && row.amount !== "" && row.amount !== null
    );

  const reloadRows = async () => {
    const data = await fetchPayrollEntries(month, year);
    if (data?.length) {
      setRows(
        data.map((entry) => ({
          id: crypto.randomUUID(),
          employee: {
            id: entry.employee_id,
            employee_code: entry.employee_code,
            employee_name: entry.employee_name
          },
          salaryHead: {
            id: entry.salary_head_id,
            salary_head: entry.salary_head
          },
          amount: entry.actual_value,
          remarks: entry.remarks || ""
        }))
      );
    } else {
      setRows([emptyRow()]);
    }
  };

  const handleSave = async () => {
    if (!validateRows()) {
      setSnackbar({
        open: true,
        message: "Please fill Employee, Salary Head and Amount for every row.",
        severity: "warning"
      });
      return;
    }

    setSaving(true);
    try {
      await savePayrollEntries(month, year, rows);
      await reloadRows();
      setSnackbar({
        open: true,
        message: `${rows.length} entries saved successfully.`,
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.response?.data?.detail?.[0]?.msg || "Failed to save payroll entries.",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportPayrollExcel(month, year);
      setSnackbar({ open: true, message: "Export started.", severity: "success" });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export Excel.",
        severity: "error"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading entries...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800}>
          One Time Payroll Entry
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add employee, salary head, and amount for the selected month/year.
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.04)" }}>
              <TableCell>Employee</TableCell>
              <TableCell>Salary Head</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="center">Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <PayrollRow
                key={row.id}
                row={row}
                onChange={(updated) => handleRowChange(index, updated)}
                onDelete={() => handleDeleteRow(index)}
                disableDelete={rows.length === 1}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ my: 2.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRow}>
          Add Row
        </Button>

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
            onClick={handleExport}
            disabled={exporting}
          >
            Export Excel
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </Button>
        </Stack>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
