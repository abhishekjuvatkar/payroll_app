import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Divider,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EditIcon from "@mui/icons-material/Edit";
import ClearIcon from "@mui/icons-material/Clear";

import MonthYearSelector from "../components/MonthYearSelector";
import {
  getEmployees,
  getSalaryHeads,
  fetchPayrollEntries,
  savePayrollEntries,
  exportPayrollExcel,
  exportPayrollEntriesDirect,
} from "../services/api";

const now = new Date();

export default function SalaryUpdateScreen() {
  // Period Selection
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Master Data
  const [employees, setEmployees] = useState([]);
  const [salaryHeads, setSalaryHeads] = useState([]);
  const [loadingMasters, setLoadingMasters] = useState(true);

  // Form State
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSalaryHead, setSelectedSalaryHead] = useState(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [employeeSearchInput, setEmployeeSearchInput] = useState("");

  // Table & Entries State
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filter Table
  const [tableSearch, setTableSearch] = useState("");

  // Notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Load Employee and Salary Head Masters
  useEffect(() => {
    const fetchMasters = async () => {
      setLoadingMasters(true);
      try {
        const [empData, headData] = await Promise.all([
          getEmployees(),
          getSalaryHeads(),
        ]);
        setEmployees(empData || []);
        setSalaryHeads(headData || []);

        // Default to 'Basic Salary' or first head if available
        if (headData && headData.length > 0) {
          const basicHead = headData.find((h) =>
            h.salary_head.toLowerCase().includes("basic")
          );
          setSelectedSalaryHead(basicHead || headData[0]);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Failed to load employee or salary head master data from backend.",
          severity: "error",
        });
      } finally {
        setLoadingMasters(false);
      }
    };

    fetchMasters();
  }, []);

  // Load existing entries from backend for the chosen month/year
  const loadEntries = async (m = month, y = year) => {
    setLoadingEntries(true);
    try {
      const data = await fetchPayrollEntries(m, y);
      if (Array.isArray(data)) {
        const formatted = data.map((item) => ({
          id: item.id || crypto.randomUUID(),
          employee: {
            id: item.employee_id,
            employee_code: item.employee_code,
            employee_name: item.employee_name,
          },
          salaryHead: {
            id: item.salary_head_id,
            salary_head: item.salary_head,
          },
          amount: Number(item.actual_value) || 0,
          remarks: item.remarks || "",
        }));
        setEntries(formatted);
        setHasUnsavedChanges(false);
      } else {
        setEntries([]);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setEntries([]);
      setHasUnsavedChanges(false);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadEntries(month, year);
  }, [month, year]);

  // Handle adding or updating entry in the working table
  const handleAddOrUpdateEntry = (e) => {
    e?.preventDefault();

    if (!selectedEmployee) {
      setSnackbar({
        open: true,
        message: "Please select an employee.",
        severity: "warning",
      });
      return;
    }

    if (!selectedSalaryHead) {
      setSnackbar({
        open: true,
        message: "Please select a salary head.",
        severity: "warning",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      setSnackbar({
        open: true,
        message: "Please enter a valid salary amount (0 or greater).",
        severity: "warning",
      });
      return;
    }

    // Check if entry already exists in table for this employee and salary head
    const existingIndex = entries.findIndex(
      (entry) =>
        entry.employee?.id === selectedEmployee.id &&
        entry.salaryHead?.id === selectedSalaryHead.id
    );

    if (existingIndex >= 0) {
      // Update existing entry
      const updated = [...entries];
      updated[existingIndex] = {
        ...updated[existingIndex],
        amount: numAmount,
        remarks: remarks || updated[existingIndex].remarks,
      };
      setEntries(updated);
      setHasUnsavedChanges(true);
      setSnackbar({
        open: true,
        message: `Updated salary for ${selectedEmployee.employee_name} (${selectedSalaryHead.salary_head}). Remember to click Save All Changes.`,
        severity: "info",
      });
    } else {
      // Add new row
      const newEntry = {
        id: crypto.randomUUID(),
        employee: selectedEmployee,
        salaryHead: selectedSalaryHead,
        amount: numAmount,
        remarks: remarks || "",
      };
      setEntries((prev) => [newEntry, ...prev]);
      setHasUnsavedChanges(true);
      setSnackbar({
        open: true,
        message: `Added salary update for ${selectedEmployee.employee_name}. Click Save All Changes to persist to database.`,
        severity: "success",
      });
    }

    // Clear form inputs
    setSelectedEmployee(null);
    setAmount("");
    setRemarks("");
    setEmployeeSearchInput("");
  };

  // Quick edit row into form
  const handleEditRow = (row) => {
    setSelectedEmployee(row.employee);
    setSelectedSalaryHead(row.salaryHead);
    setAmount(row.amount.toString());
    setRemarks(row.remarks || "");
  };

  // Delete row from local working table
  const handleDeleteRow = (id) => {
    setEntries((prev) => prev.filter((r) => r.id !== id));
    setHasUnsavedChanges(true);
  };

  // Save all current table entries to backend API
  const handleSaveAll = async (suppressToast = false) => {
    if (entries.length === 0) {
      setSnackbar({
        open: true,
        message: "No salary entries to save.",
        severity: "warning",
      });
      return false;
    }

    setSaving(true);
    try {
      await savePayrollEntries(month, year, entries);
      await loadEntries(month, year);
      setHasUnsavedChanges(false);
      if (!suppressToast) {
        setSnackbar({
          open: true,
          message: `Successfully saved ${entries.length} salary entries to database for ${month}/${year}.`,
          severity: "success",
        });
      }
      return true;
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail?.[0]?.msg ||
        err?.response?.data?.detail ||
        "Failed to save salary entries to backend.";
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const validRows = (entries || []).filter(
        (e) => (e.employee_name || e.employee_code || e.employee_id) && (e.actual_value !== "" && e.actual_value !== undefined)
      );

      if (validRows.length > 0) {
        await exportPayrollEntriesDirect({
          month,
          year,
          rows: validRows.map((r) => ({
            employee_code: r.employee_code || "",
            employee_name: r.employee_name || "",
            salary_head: r.salary_head || "",
            amount: r.actual_value || 0,
            remarks: r.remarks || "",
            month: month,
            year: year
          }))
        });
        setSnackbar({
          open: true,
          message: `Exported ${validRows.length} payroll entries to Excel successfully!`,
          severity: "success",
        });
      } else {
        await exportPayrollExcel(month, year);
        setSnackbar({
          open: true,
          message: `Payroll export for ${month}/${year} generated and downloaded.`,
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export Excel file.",
        severity: "error",
      });
    } finally {
      setExporting(false);
    }
  };

  // Filtered employees for dropdown
  const filteredEmployees = useMemo(() => {
    const q = employeeSearchInput.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.employee_name?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q)
    );
  }, [employees, employeeSearchInput]);

  // Filtered table rows based on tableSearch
  const displayedEntries = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (entry) =>
        entry.employee?.employee_name?.toLowerCase().includes(q) ||
        entry.employee?.employee_code?.toLowerCase().includes(q) ||
        entry.salaryHead?.salary_head?.toLowerCase().includes(q) ||
        entry.remarks?.toLowerCase().includes(q)
    );
  }, [entries, tableSearch]);

  // Total Calculations
  const totalAmount = useMemo(() => {
    return entries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [entries]);

  const uniqueEmployeesCount = useMemo(() => {
    const ids = new Set(entries.map((e) => e.employee?.id).filter(Boolean));
    return ids.size;
  }, [entries]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Box sx={{ mt: 1, pb: 6 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            Salary Update
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search an employee, assign salary amount, review list and export to Excel.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => loadEntries(month, year)}
            disabled={loadingEntries}
            sx={{ borderRadius: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              exporting ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <FileDownloadIcon />
              )
            }
            onClick={handleExportExcel}
            disabled={exporting}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              color: "#fff",
              boxShadow: "0 4px 14px rgba(14, 165, 233, 0.3)",
            }}
          >
            {exporting ? "Exporting..." : "Export Excel"}
          </Button>
        </Stack>
      </Box>

      {/* Month-Year Selector Banner */}
      <Paper
        elevation={2}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        <MonthYearSelector
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </Paper>

      {/* Quick Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
              border: "1px solid #BFDBFE",
            }}
          >
            <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: "primary.main",
                    width: 40,
                    height: 40,
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Employees Updated
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {uniqueEmployeesCount}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({entries.length} entries)
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
              border: "1px solid #A7F3D0",
            }}
          >
            <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: "#10B981",
                    width: 40,
                    height: 40,
                  }}
                >
                  <AccountBalanceWalletIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Total Period Amount
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#065F46">
                    ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card
            elevation={1}
            sx={{
              borderRadius: 3,
              background: "linear-gradient(135deg, #FDF4FF 0%, #F3E8FF 100%)",
              border: "1px solid #E9D5FF",
            }}
          >
            <CardContent sx={{ py: 2, px: 2.5, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: "#8B5CF6",
                    width: 40,
                    height: 40,
                  }}
                >
                  <CalendarMonthIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Active Payroll Cycle
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#581C87">
                    {new Date(year, month - 1).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Salary Entry & Update Form Card */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid rgba(37, 99, 235, 0.15)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <PaidOutlinedIcon color="primary" />
          <Typography variant="h6" fontWeight={800}>
            Enter / Update Employee Salary
          </Typography>
        </Box>

        <form onSubmit={handleAddOrUpdateEntry}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 2.5,
            }}
          >
            {/* Searchable Employee Dropdown - Fixed Width */}
            <Box sx={{ width: { xs: "100%", sm: 340, md: 360 } }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Select Employee *
              </Typography>
              <Autocomplete
                sx={{ width: "100%" }}
                options={filteredEmployees}
                loading={loadingMasters}
                value={selectedEmployee}
                getOptionLabel={(option) =>
                  option ? `${option.employee_name} (${option.employee_code})` : ""
                }
                isOptionEqualToValue={(option, val) => option.id === val?.id}
                onInputChange={(_, val) => setEmployeeSearchInput(val)}
                onChange={(_, val) => setSelectedEmployee(val)}
                renderOption={(props, option) => {
                  const { key, ...restProps } = props;
                  return (
                    <Box
                      component="li"
                      key={option.id}
                      {...restProps}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        py: 1,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: 12,
                          fontWeight: 700,
                          bgcolor: "primary.main",
                        }}
                      >
                        {getInitials(option.employee_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {option.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {option.employee_code}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by name or code..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonIcon
                            sx={{ color: "primary.main", mr: 1 }}
                            fontSize="small"
                          />
                          {params.InputProps?.startAdornment || null}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {loadingMasters ? <CircularProgress size={16} /> : null}
                          {params.InputProps?.endAdornment || null}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>

            {/* Searchable Salary Head - Fixed Width */}
            <Box sx={{ width: { xs: "100%", sm: 240, md: 260 } }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Salary Head *
              </Typography>
              <Autocomplete
                sx={{ width: "100%" }}
                options={salaryHeads}
                loading={loadingMasters}
                value={selectedSalaryHead}
                getOptionLabel={(option) => (option ? option.salary_head : "")}
                isOptionEqualToValue={(option, val) => option.id === val?.id}
                onChange={(_, val) => setSelectedSalaryHead(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select Salary Head..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PaidOutlinedIcon
                            sx={{ color: "primary.main", mr: 1 }}
                            fontSize="small"
                          />
                          {params.InputProps?.startAdornment || null}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>

            {/* Amount Input - Fixed Width */}
            <Box sx={{ width: { xs: "100%", sm: 180, md: 200 } }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Salary Amount (₹) *
              </Typography>
              <TextField
                type="number"
                placeholder="Enter amount..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputProps={{ min: "0", step: "0.01" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography fontWeight={700} color="primary.main">
                        ₹
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            {/* Remarks - Fixed Width */}
            <Box sx={{ width: { xs: "100%", sm: 240, md: 260 } }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Remarks (Optional)
              </Typography>
              <TextField
                placeholder="e.g. Monthly basic / bonus"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </Box>
          </Box>

          {/* Action Row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 2.5,
              pt: 2,
              borderTop: "1px dashed rgba(0,0,0,0.08)",
            }}
          >
            {(selectedEmployee || amount || remarks) && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSelectedEmployee(null);
                  setAmount("");
                  setRemarks("");
                }}
                sx={{ borderRadius: 2 }}
              >
                Clear
              </Button>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
              }}
            >
              Add / Update Entry
            </Button>
          </Box>
        </form>
      </Paper>

      {/* Salary Records Table */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}
      >
        {/* Table Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2.5,
          }}
        >
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>
                Updated Salary Records
              </Typography>
              {hasUnsavedChanges ? (
                <Chip
                  label="Unsaved Changes Pending Save"
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              ) : (
                <Chip
                  label="Synced with Database"
                  color="success"
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              Directly connected to backend PostgreSQL / SQLite database.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search records in table..."
              size="small"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Chip
              label={`${displayedEntries.length} Record${displayedEntries.length === 1 ? "" : "s"}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Box>

        {/* Table Content */}
        {loadingEntries ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading salary entries...
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.04)" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee Code</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Salary Head</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    Amount (₹)
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary" fontWeight={500}>
                        {entries.length === 0
                          ? "No salary entries found for this month/year. Use the form above to add an employee salary."
                          : "No matching records found for your search."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedEntries.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(37, 99, 235, 0.03)",
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 12,
                              fontWeight: 700,
                              bgcolor: "primary.main",
                            }}
                          >
                            {getInitials(row.employee?.employee_name)}
                          </Avatar>
                          <Typography fontWeight={700}>
                            {row.employee?.employee_name || "Unknown"}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={row.employee?.employee_code || "-"}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          icon={<PaidOutlinedIcon fontSize="small" />}
                          label={row.salaryHead?.salary_head || "-"}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography fontWeight={800} color="primary.dark">
                          ₹{" "}
                          {Number(row.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {row.remarks || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Edit into form">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditRow(row)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Remove record">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Footer Actions & Export */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Total Sum:{" "}
              <Typography
                component="span"
                variant="subtitle1"
                fontWeight={800}
                color="primary.main"
              >
                ₹ {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={
                exporting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <FileDownloadIcon />
                )
              }
              onClick={handleExportExcel}
              disabled={exporting || entries.length === 0}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                px: 2.5,
              }}
            >
              Export to Excel
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              onClick={handleSaveAll}
              disabled={saving || entries.length === 0}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                px: 3,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
              }}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
