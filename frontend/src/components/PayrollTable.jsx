import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  TablePagination,
  CircularProgress,
  Typography,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  InputAdornment,
  Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import SearchIcon from "@mui/icons-material/Search";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PayrollRow from "./PayrollRow";
import BulkAddSalaryHeadDialog from "./BulkAddSalaryHeadDialog";
import {
  savePayrollEntries,
  exportPayrollExcel,
  exportPayrollEntriesDirect,
  fetchPayrollEntries,
  getSampleCurrentVsSamarthData,
  syncPayrollFromComparison,
  deleteAllPayrollEntries,
  getEmployees,
  getSalaryHeads
} from "../services/api";

const emptyRow = () => ({
  id: crypto.randomUUID(),
  employee: null,
  salaryHead: null,
  amount: "",
  remarks: ""
});

export default function PayrollTable({ month, year }) {
  const [rows, setRows] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allSalaryHeads, setAllSalaryHeads] = useState([]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingAuto, setImportingAuto] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Pagination for fast DOM rendering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Helper to match raw entries with official master records
  const matchEmployeeWithMaster = (rawItem, masterList = allEmployees) => {
    const rawName = (rawItem.employee_name || rawItem.name || "").trim();
    const rawCode = (rawItem.employee_code || rawItem.employee_id || "").trim();

    if (masterList && masterList.length) {
      const byCode = masterList.find(
        (e) => e.employee_code && rawCode && e.employee_code.trim().toUpperCase() === rawCode.toUpperCase()
      );
      if (byCode) return byCode;

      const byName = masterList.find(
        (e) => e.employee_name && rawName && e.employee_name.trim().toUpperCase() === rawName.toUpperCase()
      );
      if (byName) return byName;

      const norm = (s) => (s || "").replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.|shri|smt\.)\s+/i, "").replace(/[\s._-]+/g, " ").trim().toUpperCase();
      const targetNorm = norm(rawName);
      if (targetNorm) {
        const byNorm = masterList.find((e) => norm(e.employee_name) === targetNorm);
        if (byNorm) return byNorm;
      }
    }

    return {
      id: rawItem.employee_db_id || null,
      employee_code: rawCode || rawName || "EMP",
      employee_name: rawName || rawCode || "Employee"
    };
  };

  const matchSalaryHeadWithMaster = (rawItem, headList = allSalaryHeads) => {
    const rawHead = (rawItem.salary_head || "").trim();
    if (headList && headList.length) {
      const byHead = headList.find(
        (h) => h.salary_head && rawHead && h.salary_head.trim().toUpperCase() === rawHead.toUpperCase()
      );
      if (byHead) return byHead;
    }
    return {
      id: rawItem.salary_head_db_id || null,
      salary_head: rawHead
    };
  };

  // Load master data & entries for selected Month & Year
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      allEmployees.length ? Promise.resolve(allEmployees) : getEmployees(),
      allSalaryHeads.length ? Promise.resolve(allSalaryHeads) : getSalaryHeads(),
      fetchPayrollEntries(month, year).catch(() => [])
    ])
      .then(([emps, heads, entries]) => {
        if (!isMounted) return;
        const empList = emps || [];
        const headList = heads || [];
        setAllEmployees(empList);
        setAllSalaryHeads(headList);

        // Check if there are pre-filled entries from 1-Click Push in Salary Comparison
        const prefilled = sessionStorage.getItem("PREFILLED_PAYROLL_ENTRIES");
        if (prefilled) {
          try {
            const parsed = JSON.parse(prefilled);
            if (parsed?.length) {
              const mappedRows = parsed.map((item) => {
                const currentSheetAmount = item.current_value !== undefined && item.current_value !== null
                  ? item.current_value
                  : (item.actual_value !== undefined && item.actual_value !== null
                    ? item.actual_value
                    : (item.adjustment_amount !== undefined ? item.adjustment_amount : Math.abs(item.difference || 0)));

                const matchedEmp = matchEmployeeWithMaster(item, empList);
                const matchedHead = matchSalaryHeadWithMaster(item, headList);

                return {
                  id: crypto.randomUUID(),
                  employee: matchedEmp,
                  salaryHead: matchedHead,
                  amount: currentSheetAmount,
                  remarks: item.remarks || `Current sheet value for ${item.salary_head}`
                };
              });

              setRows(mappedRows);
              setPage(0);
              setSnackbar({
                open: true,
                message: `⚡ 1-Click Automated! Loaded ${mappedRows.length} one-time adjustment entries from Salary Comparison.`,
                severity: "success"
              });
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error parsing prefilled payroll entries", e);
          }
        }

        // Database entries
        if (entries?.length) {
          setRows(
            entries.map((entry) => ({
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
        setPage(0);
      })
      .catch((err) => {
        console.error("Error loading payroll entries:", err);
        if (isMounted) {
          setRows([emptyRow()]);
          setPage(0);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [month, year]);

  // High-performance memoized row updates by ID
  const handleRowChangeById = useCallback((id, updatedRow) => {
    setRows((prev) => prev.map((r) => (r.id === id ? updatedRow : r)));
  }, []);

  const handleDeleteRowById = useCallback((id) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length === 0 ? [emptyRow()] : next;
    });
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [emptyRow(), ...prev]);
    setPage(0);
  }, []);

  const handleBulkAddEntries = useCallback((entriesToAdd, salaryHead) => {
    const newFormattedRows = entriesToAdd.map((item) => ({
      id: crypto.randomUUID(),
      employee: item.employee,
      salaryHead: item.salaryHead || salaryHead,
      amount: item.amount || "",
      remarks: item.remarks || ""
    }));

    setRows((prev) => {
      const isOnlyEmpty = prev.length === 1 && !prev[0].employee && !prev[0].amount;
      return isOnlyEmpty ? newFormattedRows : [...prev, ...newFormattedRows];
    });

    setPage(0);
    setSnackbar({
      open: true,
      message: `Added ${entriesToAdd.length} entries for "${salaryHead.salary_head}" to the payroll table!`,
      severity: "success"
    });
  }, []);

  // 1-Click Import from Salary Comparison Mismatches
  const handle1ClickImport = async () => {
    setImportingAuto(true);
    try {
      let entries = [];
      const storedSession = sessionStorage.getItem("PREFILLED_PAYROLL_ENTRIES");
      const storedLocal = localStorage.getItem("LATEST_ONE_TIME_PAYROLL_ENTRIES");

      if (storedSession) {
        try { entries = JSON.parse(storedSession) || []; } catch (e) {}
      }
      if (!entries.length && storedLocal) {
        try { entries = JSON.parse(storedLocal) || []; } catch (e) {}
      }
      if (!entries.length) {
        const comp = await getSampleCurrentVsSamarthData();
        entries = comp.one_time_entries || [];
      }

      if (!entries?.length) {
        setSnackbar({
          open: true,
          message: "No mismatched records available to import. Run Salary Comparison first.",
          severity: "warning"
        });
        return;
      }

      const newRows = entries.map((item) => {
        const currentSheetAmount = item.current_value !== undefined && item.current_value !== null
          ? item.current_value
          : (item.actual_value !== undefined && item.actual_value !== null
            ? item.actual_value
            : (item.adjustment_amount !== undefined ? item.adjustment_amount : Math.abs(item.difference || 0)));

        const matchedEmp = matchEmployeeWithMaster(item);
        const matchedHead = matchSalaryHeadWithMaster(item);

        return {
          id: crypto.randomUUID(),
          employee: matchedEmp,
          salaryHead: matchedHead,
          amount: currentSheetAmount,
          remarks: item.remarks || `Current sheet value for ${item.salary_head}`
        };
      });

      setRows(newRows);
      setPage(0);
      sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(entries));
      localStorage.setItem("LATEST_ONE_TIME_PAYROLL_ENTRIES", JSON.stringify(entries));
      setSnackbar({
        open: true,
        message: `⚡ 1-Click Automated! Imported ${newRows.length} one-time adjustment records with current sheet amounts. Click 'Save' to commit to database.`,
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to auto-import comparison entries.",
        severity: "error"
      });
    } finally {
      setImportingAuto(false);
    }
  };

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
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const syncPayload = {
        month: Number(month),
        year: Number(year),
        entries: rows.map((r) => ({
          employee_code: r.employee?.employee_code || r.employee?.employee_name || "",
          employee_name: r.employee?.employee_name || r.employee?.employee_code || "",
          salary_head: r.salaryHead?.salary_head || "",
          current_value: r.amount !== "" && r.amount !== null ? Number(r.amount) : 0,
          remarks: r.remarks || ""
        }))
      };

      await syncPayrollFromComparison(syncPayload);
      await reloadRows();
      setSnackbar({
        open: true,
        message: `${rows.length} entries saved successfully to database.`,
        severity: "success"
      });
    } catch (err) {
      try {
        await savePayrollEntries(month, year, rows);
        await reloadRows();
        setSnackbar({
          open: true,
          message: `${rows.length} entries saved successfully.`,
          severity: "success"
        });
      } catch (err2) {
        setSnackbar({
          open: true,
          message: err?.response?.data?.detail || "Failed to save payroll entries.",
          severity: "error"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      await deleteAllPayrollEntries(month, year);
      setRows([emptyRow()]);
      setPage(0);
      sessionStorage.removeItem("PREFILLED_PAYROLL_ENTRIES");
      setConfirmDeleteAllOpen(false);
      setSnackbar({
        open: true,
        message: "All payroll entries for this month/year deleted successfully from database.",
        severity: "success"
      });
    } catch (err) {
      setRows([emptyRow()]);
      setPage(0);
      sessionStorage.removeItem("PREFILLED_PAYROLL_ENTRIES");
      setConfirmDeleteAllOpen(false);
      setSnackbar({
        open: true,
        message: "All rows cleared from the table.",
        severity: "info"
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const validRows = (rows || []).filter(
        (r) => (r.employee && (r.employee.employee_name || r.employee.employee_code)) || (r.amount && String(r.amount).trim() !== "")
      );

      if (validRows.length > 0) {
        await exportPayrollEntriesDirect({
          month,
          year,
          rows: validRows.map((r) => ({
            employee_code: r.employee?.employee_code || "",
            employee_name: r.employee?.employee_name || "",
            salary_head: r.salaryHead?.salary_head || "",
            amount: r.amount || 0,
            remarks: r.remarks || "",
            month: month,
            year: year
          }))
        });
        setSnackbar({
          open: true,
          message: `Exported ${validRows.length} payroll entries to Excel successfully!`,
          severity: "success"
        });
      } else {
        await exportPayrollExcel(month, year);
        setSnackbar({ open: true, message: "Export completed successfully!", severity: "success" });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export Excel file.",
        severity: "error"
      });
    } finally {
      setExporting(false);
    }
  };

  // Instant In-Memory Filter by Search Query
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const empName = (r.employee?.employee_name || "").toLowerCase();
      const empCode = (r.employee?.employee_code || "").toLowerCase();
      const head = (r.salaryHead?.salary_head || "").toLowerCase();
      const amt = String(r.amount || "");
      return empName.includes(q) || empCode.includes(q) || head.includes(q) || amt.includes(q);
    });
  }, [rows, searchQuery]);

  // Total Amount Calculation
  const totalAmount = useMemo(() => {
    return rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  }, [rows]);

  const paginatedRows = useMemo(() => {
    return filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

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
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Top Header & Search Bar */}
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            One Time Payroll Entry ({rows.length} Total)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add employee, salary head, and amount for the selected month/year.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip
            icon={<AccountBalanceWalletIcon />}
            label={`Total: ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 800, fontSize: "0.9rem", py: 2 }}
          />

          <TextField
            size="small"
            placeholder="Search rows (name, code, head)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
            sx={{ width: { xs: "100%", sm: 260 }, bgcolor: "white" }}
          />

          {rows.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setConfirmDeleteAllOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 700,
                height: 38
              }}
            >
              Delete All
            </Button>
          )}
        </Stack>
      </Box>

      {/* Action Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddRow}>
            Add Row
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<PlaylistAddIcon />}
            onClick={() => setBulkDialogOpen(true)}
            sx={{
              fontWeight: 800,
              bgcolor: "#2563EB",
              "&:hover": { bgcolor: "#1D4ED8" }
            }}
          >
            Bulk Add for Salary Head
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={
              importingAuto ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            onClick={handle1ClickImport}
            disabled={importingAuto}
            sx={{
              fontWeight: 800,
              bgcolor: "#D97706",
              "&:hover": { bgcolor: "#B45309" }
            }}
          >
            {importingAuto ? "Importing..." : "⚡ 1-Click Import from Comparison"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setConfirmDeleteAllOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Delete All
          </Button>
        </Stack>

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


<Divider sx={{ my: 2.5 }} />

      {/* High Performance Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.04)" }}>
              <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Salary Head</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Amount (₹)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800, width: 70 }}>Delete</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  {searchQuery ? `No records matching "${searchQuery}".` : "No payroll entries. Click 'Add Row' or 'Bulk Add' to begin."}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => (
                <PayrollRow
                  key={row.id}
                  row={row}
                  onRowChange={handleRowChangeById}
                  onRowDelete={handleDeleteRowById}
                  disableDelete={rows.length === 1}
                  allEmployees={allEmployees}
                  allSalaryHeads={allSalaryHeads}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[25, 50, 100, 250]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newP) => setPage(newP)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Divider sx={{ my: 2.5 }} />

      
      {/* Bulk Add by Salary Head Dialog */}
      <BulkAddSalaryHeadDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        allSalaryHeads={allSalaryHeads}
        allEmployees={allEmployees}
        onAddEntries={handleBulkAddEntries}
      />

      {/* Confirmation Dialog for Delete All */}
      <Dialog
        open={confirmDeleteAllOpen}
        onClose={() => setConfirmDeleteAllOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
          Delete All Payroll Entries?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{rows.length}</strong> payroll entries for Month: <strong>{month}</strong>, Year: <strong>{year}</strong>?
            <br /><br />
            This will clear all rows from the screen and permanently remove the saved entries from the database.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDeleteAllOpen(false)}
            variant="outlined"
            disabled={deletingAll}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAll}
            variant="contained"
            color="error"
            disabled={deletingAll}
            startIcon={deletingAll ? <CircularProgress size={18} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ fontWeight: 800 }}
          >
            {deletingAll ? "Deleting..." : "Yes, Delete All"}
          </Button>
        </DialogActions>
      </Dialog>

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
