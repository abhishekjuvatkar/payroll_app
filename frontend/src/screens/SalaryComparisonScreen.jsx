import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Divider,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TableChartIcon from "@mui/icons-material/TableChart";
import PeopleIcon from "@mui/icons-material/People";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import ClearIcon from "@mui/icons-material/Clear";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LaunchIcon from "@mui/icons-material/Launch";

import {
  compareCurrentVsSamarth,
  getSampleCurrentVsSamarthData,
  exportCurrentVsSamarthExcel,
  exportOneTimeEntriesExcel,
  syncPayrollFromComparison
} from "../services/api";

// Format Indian Rupee currency
const formatCurrency = (val) => {
  if (val === null || val === undefined || isNaN(val)) return "₹0.00";
  const num = Number(val);
  const isNeg = num < 0;
  const absFormatted = Math.abs(num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return isNeg ? `-₹${absFormatted}` : `₹${absFormatted}`;
};

// Helper for employee avatar initials
const getInitials = (name) => {
  if (!name) return "EMP";
  const clean = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/i, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
};

// Helper for status chips with clear distinction for data present in Current Month but missing in Samarth
const renderStatusChip = (status, isTotal = false) => {
  if (status === "MATCH") {
    return <Chip label="MATCH (₹0)" size="small" color="success" sx={{ fontWeight: 800, fontSize: "0.75rem" }} />;
  }
  if (status === "MISMATCH") {
    return (
      <Chip
        label="MISMATCH"
        size="small"
        color={isTotal ? "default" : "error"}
        sx={{ fontWeight: 800, fontSize: "0.75rem" }}
      />
    );
  }
  if (status === "NOT_AVAILABLE_IN_SAMARTH") {
    return (
      <Chip
        label="Not in Samarth (+Added from Current)"
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: "0.75rem",
          bgcolor: "#FEF3C7",
          color: "#92400E",
          border: "1px solid #FCD34D"
        }}
      />
    );
  }
  if (status === "NOT_AVAILABLE_IN_CURRENT") {
    return (
      <Chip
        label="Not in Current"
        size="small"
        sx={{
          fontWeight: 800,
          fontSize: "0.75rem",
          bgcolor: "#E0F2FE",
          color: "#0369A1",
          border: "1px solid #BAE6FD"
        }}
      />
    );
  }
  return <Chip label={status} size="small" sx={{ fontWeight: 800, fontSize: "0.75rem" }} />;
};

export default function SalaryComparisonScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // Two File Inputs
  const [currentFile, setCurrentFile] = useState(null);
  const [samarthFile, setSamarthFile] = useState(null);

  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingOneTime, setExportingOneTime] = useState(false);
  const [syncingPayroll, setSyncingPayroll] = useState(false);

  // Comparison Result
  const [comparisonResult, setComparisonResult] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterSalaryHead, setFilterSalaryHead] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Pagination for tables
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [flatPage, setFlatPage] = useState(0);
  const [flatRowsPerPage, setFlatRowsPerPage] = useState(25);

  const [otePage, setOtePage] = useState(0);
  const [oteRowsPerPage, setOteRowsPerPage] = useState(25);

  // Snackbar Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Handle Run Comparison
  const handleRunComparison = async () => {
    if (!currentFile || !samarthFile) {
      setSnackbar({
        open: true,
        message: "Please upload BOTH the Current Month Salary Excel and Samarth Generated Salary Excel.",
        severity: "warning"
      });
      return;
    }

    setLoadingCompare(true);
    try {
      const formData = new FormData();
      formData.append("current_file", currentFile);
      formData.append("samarth_file", samarthFile);

      const result = await compareCurrentVsSamarth(formData);

      setComparisonResult(result);
      if (result.one_time_entries) {
        sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(result.one_time_entries));
        localStorage.setItem("LATEST_ONE_TIME_PAYROLL_ENTRIES", JSON.stringify(result.one_time_entries));
      }
      setActiveTab(0); // View Employee Grouped
      setSnackbar({
        open: true,
        message: `Comparison completed: ${result?.summary?.total_employees ?? 0} employees analyzed!`,
        severity: "success"
      });
    } catch (err) {
      const errorMsg =
        err?.response?.data?.detail || "Failed to compare salary files. Please check the Excel format.";
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: "error"
      });
    } finally {
      setLoadingCompare(false);
    }
  };

  // Handle Load Sample Data
  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      const result = await getSampleCurrentVsSamarthData();
      setComparisonResult(result);
      if (result.one_time_entries) {
        sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(result.one_time_entries));
      }
      setActiveTab(0);
      setSnackbar({
        open: true,
        message: "Sample Current Month vs Samarth Comparison loaded successfully!",
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load sample comparison data.",
        severity: "error"
      });
    } finally {
      setLoadingSample(false);
    }
  };

  // Handle Export Full Excel
  const handleExportExcel = async () => {
    if (!comparisonResult) return;
    setExporting(true);
    try {
      await exportCurrentVsSamarthExcel(comparisonResult);
      setSnackbar({
        open: true,
        message: "Full comparison Excel report downloaded successfully!",
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export comparison report.",
        severity: "error"
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle Export One-Time Entries Excel
  const handleExportOneTimeEntries = async () => {
    if (!comparisonResult) return;
    setExportingOneTime(true);
    try {
      await exportOneTimeEntriesExcel(comparisonResult);
      setSnackbar({
        open: true,
        message: "One-Time Payroll Entries & Adjustments Excel downloaded!",
        severity: "success"
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export One-Time Entries Excel.",
        severity: "error"
      });
    } finally {
      setExportingOneTime(false);
    }
  };

  // Base One-Time Entries with dynamic fallback
  const allOneTimeEntries = useMemo(() => {
    if (comparisonResult?.one_time_entries && comparisonResult.one_time_entries.length > 0) {
      return comparisonResult.one_time_entries;
    }
    if (comparisonResult?.flat_comparison_rows) {
      return comparisonResult.flat_comparison_rows
        .filter((r) => !r.is_total && Math.abs(r.difference) >= 0.01)
        .map((r, idx) => {
          const isDeduction = /TAX|DED|NPS|FEE|CHARGES|GPF|RECOVERY|CLUB/i.test(r.salary_head);
          const entryType = r.is_employer_contribution
            ? "Employer Cost Adjustment"
            : isDeduction
            ? "Deduction Adjustment"
            : "Earning Adjustment";
          const rem =
            r.status === "NOT_AVAILABLE_IN_SAMARTH"
              ? `One-time adjustment for ${r.salary_head}: present in Current Month (₹${Number(r.current_value).toFixed(2)}) but missing in Samarth`
              : r.status === "NOT_AVAILABLE_IN_CURRENT"
              ? `One-time adjustment for ${r.salary_head}: present in Samarth (₹${Number(r.samarth_value).toFixed(2)}) but missing in Current Month`
              : `One-time adjustment for ${r.salary_head}: variance of ₹${Math.abs(r.difference).toFixed(2)}`;
          return {
            s_no: idx + 1,
            employee_id: r.employee_id,
            employee_name: r.employee_name,
            category: r.category,
            salary_head: r.salary_head,
            entry_type: entryType,
            current_value: r.current_value,
            samarth_value: r.samarth_value,
            difference: r.difference,
            adjustment_amount: Math.abs(r.difference),
            adjustment_direction: r.difference > 0 ? "Current > Samarth (+)" : "Samarth > Current (-)",
            remarks: rem
          };
        });
    }
    return [];
  }, [comparisonResult]);

  // Handle 1-Click Push directly into One Time Payroll Entry Database
  const handle1ClickPushToPayroll = async () => {
    if (!allOneTimeEntries.length) {
      setSnackbar({
        open: true,
        message: "No one-time adjustment entries found to push.",
        severity: "warning"
      });
      return;
    }

    setSyncingPayroll(true);
    try {
      sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
      localStorage.setItem("LATEST_ONE_TIME_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
      const res = await syncPayrollFromComparison({
        month: 6,
        year: 2026,
        entries: allOneTimeEntries
      });

      setSnackbar({
        open: true,
        message: `⚡ 1-Click Automated! ${res.count || allOneTimeEntries.length} one-time adjustment entries saved to Payroll Entry database.`,
        severity: "success"
      });
    } catch (err) {
      sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
      localStorage.setItem("LATEST_ONE_TIME_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
      setSnackbar({
        open: true,
        message: "Entries saved to session! Ready in One Time Payroll Entry screen.",
        severity: "info"
      });
    } finally {
      setSyncingPayroll(false);
    }
  };

  // Open in Payroll Entry screen with 1 click
  const handleOpenInPayrollEntry = () => {
    if (allOneTimeEntries.length) {
      sessionStorage.setItem("PREFILLED_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
      localStorage.setItem("LATEST_ONE_TIME_PAYROLL_ENTRIES", JSON.stringify(allOneTimeEntries));
    }
    navigate("/payroll");
  };

  // Available Categories and Salary Heads
  const availableCategories = useMemo(() => {
    if (!comparisonResult?.categories) return [];
    return comparisonResult.categories;
  }, [comparisonResult]);

  const availableSalaryHeads = useMemo(() => {
    if (!comparisonResult?.flat_comparison_rows) return [];
    const heads = new Set(
      comparisonResult.flat_comparison_rows
        .filter((r) => !r.is_total)
        .map((r) => r.salary_head)
    );
    return Array.from(heads).sort();
  }, [comparisonResult]);

  // Filtered Grouped Employees (Alphabetical A -> Z)
  const filteredGroupedEmployees = useMemo(() => {
    if (!comparisonResult?.employee_grouped_comparison) return [];
    let list = comparisonResult.employee_grouped_comparison;

    // Category filter
    if (filterCategory !== "All") {
      list = list.filter((e) => e.category === filterCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.employee_name.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q)
      );
    }

    // Difference toggle
    if (showOnlyDifferences) {
      list = list.filter((e) => e.mismatch_count > 0 || e.match_status !== "MATCHED");
    }

    // Head or status filter: filter heads inside employee
    if (filterSalaryHead !== "All" || filterStatus !== "All") {
      list = list
        .map((e) => {
          let matchedHeads = e.heads;
          if (filterSalaryHead !== "All") {
            matchedHeads = matchedHeads.filter((h) => h.salary_head === filterSalaryHead);
          }
          if (filterStatus !== "All") {
            matchedHeads = matchedHeads.filter((h) => h.status === filterStatus);
          }
          return { ...e, heads: matchedHeads };
        })
        .filter((e) => e.heads.length > 0);
    }

    return list;
  }, [
    comparisonResult,
    filterCategory,
    searchQuery,
    showOnlyDifferences,
    filterSalaryHead,
    filterStatus
  ]);

  // Filtered Flat Table Rows
  const filteredFlatRows = useMemo(() => {
    if (!comparisonResult?.flat_comparison_rows) return [];
    let rows = comparisonResult.flat_comparison_rows;

    if (filterCategory !== "All") {
      rows = rows.filter((r) => r.category === filterCategory);
    }

    if (filterSalaryHead !== "All") {
      rows = rows.filter((r) => r.salary_head === filterSalaryHead);
    }

    if (filterStatus !== "All") {
      rows = rows.filter((r) => r.status === filterStatus);
    }

    if (showOnlyDifferences) {
      rows = rows.filter((r) => r.status === "MISMATCH" || r.status.startsWith("NOT_AVAILABLE"));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.salary_head.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [
    comparisonResult,
    filterCategory,
    filterSalaryHead,
    filterStatus,
    showOnlyDifferences,
    searchQuery
  ]);

  // Filtered One-Time Entries
  const filteredOneTimeEntries = useMemo(() => {
    let list = allOneTimeEntries;

    if (filterCategory !== "All") {
      list = list.filter((r) => r.category === filterCategory);
    }

    if (filterSalaryHead !== "All") {
      list = list.filter((r) => r.salary_head === filterSalaryHead);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.salary_head.toLowerCase().includes(q) ||
          r.employee_id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allOneTimeEntries, filterCategory, filterSalaryHead, searchQuery]);

  const summary = comparisonResult?.summary;

  return (
    <Box sx={{ pb: 8, pt: 1 }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <CompareArrowsIcon color="primary" sx={{ fontSize: 34 }} />
            <Typography variant="h5" fontWeight={900}>
              Current Month vs Samarth Salary Comparison
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Compare Current Month Salary Excel against Samarth Generated Report and automate One-Time Entry adjustments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={
              loadingSample ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <AutoAwesomeIcon />
              )
            }
            onClick={handleLoadSample}
            disabled={loadingSample || loadingCompare}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {loadingSample ? "Loading..." : "Load Sample Data"}
          </Button>

          {comparisonResult && (
            <>
              <Button
                variant="contained"
                color="secondary"
                startIcon={
                  syncingPayroll ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <FlashOnIcon />
                  )
                }
                onClick={handle1ClickPushToPayroll}
                disabled={syncingPayroll || allOneTimeEntries.length === 0}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#7C3AED",
                  "&:hover": { bgcolor: "#6D28D9" },
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                }}
              >
                {syncingPayroll ? "Syncing..." : "⚡ 1-Click Push to Payroll"}
              </Button>

              <Button
                variant="contained"
                color="warning"
                startIcon={
                  exportingOneTime ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <ReceiptLongIcon />
                  )
                }
                onClick={handleExportOneTimeEntries}
                disabled={exportingOneTime || allOneTimeEntries.length === 0}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#D97706",
                  "&:hover": { bgcolor: "#B45309" },
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)"
                }}
              >
                {exportingOneTime ? "Exporting..." : "Download One-Time Entries (.xlsx)"}
              </Button>

              <Button
                variant="contained"
                color="success"
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
                  textTransform: "none",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)"
                }}
              >
                {exporting ? "Exporting..." : "Export Full Report (.xlsx)"}
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* Upload Section Card */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
          Upload Files for Comparison
        </Typography>

        <Grid container spacing={3} alignItems="center">
          {/* File 1: Current Month Salary Excel */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: currentFile ? "#F0FDF4" : "#FAFAFA",
                borderColor: currentFile ? "success.main" : "rgba(0,0,0,0.15)",
                borderWidth: currentFile ? 2 : 1
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  1. Current Month Salary Excel
                </Typography>
                {currentFile && (
                  <IconButton size="small" color="error" onClick={() => setCurrentFile(null)}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Button
                variant={currentFile ? "contained" : "outlined"}
                color={currentFile ? "success" : "inherit"}
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{ borderRadius: 2, py: 1.2, textTransform: "none", fontWeight: 700 }}
              >
                {currentFile ? currentFile.name : "Upload Current Salary Report (.xlsx / .xls)"}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => setCurrentFile(e.target.files?.[0] || null)}
                />
              </Button>

              <Typography variant="caption" color={currentFile ? "success.main" : "text.secondary"} sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                {currentFile ? `✅ Ready: ${(currentFile.size / 1024).toFixed(1)} KB` : "Normal / category-wise salary sheet"}
              </Typography>
            </Paper>
          </Grid>

          {/* File 2: Samarth Generated Salary Excel */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: samarthFile ? "#F0FDF4" : "#FAFAFA",
                borderColor: samarthFile ? "success.main" : "rgba(0,0,0,0.15)",
                borderWidth: samarthFile ? 2 : 1
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  2. Samarth Generated Salary Excel
                </Typography>
                {samarthFile && (
                  <IconButton size="small" color="error" onClick={() => setSamarthFile(null)}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Button
                variant={samarthFile ? "contained" : "outlined"}
                color={samarthFile ? "success" : "inherit"}
                component="label"
                fullWidth
                startIcon={<CloudUploadIcon />}
                sx={{ borderRadius: 2, py: 1.2, textTransform: "none", fontWeight: 700 }}
              >
                {samarthFile ? samarthFile.name : "Upload Samarth Generated Report (.xlsx / .xls)"}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => setSamarthFile(e.target.files?.[0] || null)}
                />
              </Button>

              <Typography variant="caption" color={samarthFile ? "success.main" : "text.secondary"} sx={{ display: "block", mt: 1, fontWeight: 600 }}>
                {samarthFile ? `✅ Ready: ${(samarthFile.size / 1024).toFixed(1)} KB` : "Salary generated report from Samarth"}
              </Typography>
            </Paper>
          </Grid>

          {/* Compare Button */}
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              size="large"
              color="primary"
              fullWidth
              startIcon={
                loadingCompare ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CompareArrowsIcon />
                )
              }
              onClick={handleRunComparison}
              disabled={loadingCompare || !currentFile || !samarthFile}
              sx={{
                borderRadius: 2.5,
                py: 2,
                fontWeight: 800,
                boxShadow: "0 8px 20px rgba(37, 99, 235, 0.3)"
              }}
            >
              {loadingCompare ? "Comparing..." : "Compare Salary"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Comparison Results Section */}
      {comparisonResult && (
        <Box>
          {/* Top Summary Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "#EFF6FF", borderColor: "#BFDBFE" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    TOTAL EMPLOYEES
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ my: 0.5 }}>
                    {summary?.total_employees || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Matched: <strong>{summary?.matched_employees || 0}</strong> | Missing in Current: <strong>{summary?.missing_in_current || 0}</strong> | Missing in Samarth: <strong>{summary?.missing_in_samarth || 0}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "#ECFDF5", borderColor: "#A7F3D0" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="#047857" fontWeight={700}>
                    PERFECT MATCHES (✅)
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#047857" sx={{ my: 0.5 }}>
                    {summary?.total_matches || 0}
                  </Typography>
                  <Typography variant="caption" color="#047857">
                    Individual salary heads with ₹0 difference
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "#FEF2F2", borderColor: "#FECACA" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="#B91C1C" fontWeight={700}>
                    ONE-TIME ADJUSTMENTS (⚠️)
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#B91C1C" sx={{ my: 0.5 }}>
                    {allOneTimeEntries.length || summary?.total_one_time_entries || summary?.total_mismatches || 0}
                  </Typography>
                  <Typography variant="caption" color="#B91C1C">
                    Actual head discrepancies (Excludes Totals)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: "#F8FAFC", borderColor: "rgba(0,0,0,0.12)" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    NET VARIANCE (CURRENT - SAMARTH)
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    color={(summary?.total_difference || 0) > 0 ? "#166534" : (summary?.total_difference || 0) < 0 ? "#991B1B" : "text.primary"}
                    sx={{ my: 0.5 }}
                  >
                    {(summary?.total_difference || 0) > 0 ? `+${formatCurrency(summary?.total_difference)}` : formatCurrency(summary?.total_difference)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current: {formatCurrency(summary?.total_current_amount)} | Samarth: {formatCurrency(summary?.total_samarth_amount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filter Bar */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: "#F8FAFC" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                <TextField
                  placeholder="Search Employee by Name or ID..."
                  size="small"
                  fullWidth
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(0);
                    setFlatPage(0);
                    setOtePage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setPage(0);
                      setFlatPage(0);
                      setOtePage(0);
                    }}
                  >
                    <MenuItem value="All">All Categories</MenuItem>
                    {availableCategories.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="head-filter-label">Salary Head</InputLabel>
                  <Select
                    labelId="head-filter-label"
                    value={filterSalaryHead}
                    label="Salary Head"
                    onChange={(e) => {
                      setFilterSalaryHead(e.target.value);
                      setPage(0);
                      setFlatPage(0);
                      setOtePage(0);
                    }}
                  >
                    <MenuItem value="All">All Heads</MenuItem>
                    {availableSalaryHeads.map((h) => (
                      <MenuItem key={h} value={h}>
                        {h}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControl size="small" fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setPage(0);
                      setFlatPage(0);
                      setOtePage(0);
                    }}
                  >
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="MATCH">MATCH (₹0)</MenuItem>
                    <MenuItem value="MISMATCH">MISMATCH</MenuItem>
                    <MenuItem value="NOT_AVAILABLE_IN_CURRENT">Not in Current</MenuItem>
                    <MenuItem value="NOT_AVAILABLE_IN_SAMARTH">Not in Samarth</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showOnlyDifferences}
                      onChange={(e) => {
                        setShowOnlyDifferences(e.target.checked);
                        setPage(0);
                        setFlatPage(0);
                        setOtePage(0);
                      }}
                      color="error"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={700}>
                      Show Only Differences
                    </Typography>
                  }
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Navigation Tabs for Views */}
          <Paper elevation={1} sx={{ borderRadius: 3, mb: 3, overflow: "hidden" }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
              sx={{
                bgcolor: "#FFFFFF",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  py: 1.5
                }
              }}
            >
              <Tab
                icon={<PeopleIcon />}
                iconPosition="start"
                label={`1. Employee-wise Grouped (${filteredGroupedEmployees.length} Alphabetical A-Z)`}
              />
              <Tab
                icon={<ReceiptLongIcon />}
                iconPosition="start"
                label={`2. One-Time Payroll Entries (${filteredOneTimeEntries.length})`}
                sx={{
                  color: filteredOneTimeEntries.length > 0 ? "#B45309 !important" : "inherit",
                  fontWeight: 800
                }}
              />
              <Tab
                icon={<ListAltIcon />}
                iconPosition="start"
                label="3. Flat Detailed Table"
              />
              <Tab
                icon={<AssessmentIcon />}
                iconPosition="start"
                label={`4. Head Mismatch Summary (${comparisonResult?.head_mismatch_summary?.length || 0})`}
              />
            </Tabs>
          </Paper>

          {/* ========================================================================= */}
          {/* VIEW 0: EMPLOYEE-WISE GROUPED VIEW (Alphabetical A -> Z)                  */}
          {/* ========================================================================= */}
          {activeTab === 0 && (
            <Box>
              {filteredGroupedEmployees.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                  <Typography color="text.secondary">No employee records match the selected filter criteria.</Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {filteredGroupedEmployees
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((emp, empIdx) => (
                      <Accordion
                        key={emp.employee_id || empIdx}
                        defaultExpanded={showOnlyDifferences || emp.mismatch_count > 0}
                        sx={{
                          borderRadius: "12px !important",
                          border: "1px solid",
                          borderColor: emp.mismatch_count > 0 ? "rgba(239, 68, 68, 0.3)" : "rgba(0,0,0,0.08)",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor: emp.mismatch_count > 0 ? "rgba(254, 242, 242, 0.7)" : "#FAFAFA",
                            px: 3,
                            py: 1
                          }}
                        >
                          <Grid container spacing={2} alignItems="center" sx={{ width: "100%", pr: 2 }}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar
                                  sx={{
                                    bgcolor: emp.mismatch_count > 0 ? "#DC2626" : "primary.main",
                                    fontWeight: 700,
                                    width: 34,
                                    height: 34,
                                    fontSize: 12
                                  }}
                                >
                                  {getInitials(emp.employee_name)}
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={800}>{emp.employee_name}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {emp.employee_id} | {emp.category}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>

                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Current Month:
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(emp.current_total)}
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Samarth:
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(emp.samarth_total)}
                              </Typography>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 2 }} sx={{ textAlign: { xs: "left", sm: "right" } }}>
                              <Chip
                                label={
                                  emp.mismatch_count > 0
                                    ? `${emp.mismatch_count} Mismatch${emp.mismatch_count > 1 ? "es" : ""}`
                                    : "MATCH (₹0)"
                                }
                                color={emp.mismatch_count > 0 ? "error" : "success"}
                                size="small"
                                sx={{ fontWeight: 800 }}
                              />
                            </Grid>
                          </Grid>
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "rgba(0,0,0,0.03)" }}>
                                  <TableCell sx={{ fontWeight: 800, pl: 3 }}>Salary Head</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                                    Current Month Value (₹)
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                                    Samarth Value (₹)
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                                    Difference (Current - Samarth)
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 800, pr: 3 }}>
                                    Status
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {emp.heads.map((hd, hIdx) => (
                                  <TableRow
                                    key={hIdx}
                                    hover
                                    sx={{
                                      bgcolor: hd.is_total ? "rgba(0,0,0,0.02)" : hd.status === "MISMATCH" ? "rgba(254, 242, 242, 0.4)" : "inherit"
                                    }}
                                  >
                                    <TableCell sx={{ pl: 3 }}>
                                      <Typography fontWeight={hd.is_total ? 800 : 600} variant="body2">
                                        {hd.salary_head} {hd.is_total && <Typography component="span" variant="caption" color="text.secondary" sx={{ fontStyle: "italic", ml: 1 }}>(Calculated Aggregate - Not an Entry)</Typography>}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2">{formatCurrency(hd.current_value)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2">{formatCurrency(hd.samarth_value)}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography
                                        variant="body2"
                                        fontWeight={hd.status === "MISMATCH" && !hd.is_total ? 800 : 500}
                                        color={
                                          hd.difference > 0
                                            ? "#166534"
                                            : hd.difference < 0
                                            ? "#991B1B"
                                            : "text.secondary"
                                        }
                                      >
                                        {hd.difference > 0 ? `+${formatCurrency(hd.difference)}` : formatCurrency(hd.difference)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ pr: 3 }}>
                                      {renderStatusChip(hd.status, hd.is_total)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </AccordionDetails>
                      </Accordion>
                    ))}

                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredGroupedEmployees.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newP) => setPage(newP)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                  />
                </Stack>
              )}
            </Box>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: ONE-TIME PAYROLL ENTRIES (EXCLUDES TOTALS)                         */}
          {/* ========================================================================= */}
          {activeTab === 1 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#B45309">
                    One-Time Payroll Entries & Adjustments ({filteredOneTimeEntries.length})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Individual salary head discrepancies to be processed as one-time payroll entries (Gross, Deductions, and Net Pay totals excluded).
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={
                      syncingPayroll ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <FlashOnIcon />
                      )
                    }
                    onClick={handle1ClickPushToPayroll}
                    disabled={syncingPayroll || filteredOneTimeEntries.length === 0}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: "#7C3AED",
                      "&:hover": { bgcolor: "#6D28D9" },
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                    }}
                  >
                    {syncingPayroll ? "Saving to Payroll..." : "⚡ 1-Click Push to Payroll DB"}
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<LaunchIcon />}
                    onClick={handleOpenInPayrollEntry}
                    disabled={filteredOneTimeEntries.length === 0}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700
                    }}
                  >
                    Open in Payroll Entry Screen
                  </Button>

                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={
                      exportingOneTime ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <ReceiptLongIcon />
                      )
                    }
                    onClick={handleExportOneTimeEntries}
                    disabled={exportingOneTime || filteredOneTimeEntries.length === 0}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: "#D97706",
                      "&:hover": { bgcolor: "#B45309" }
                    }}
                  >
                    {exportingOneTime ? "Exporting..." : `Download One-Time Entries (${filteredOneTimeEntries.length} Records)`}
                  </Button>
                </Stack>
              </Box>

              {filteredOneTimeEntries.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 52, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="success.main">
                    No One-Time Adjustments Needed!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    All individual salary heads match perfectly across all employees.
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ maxHeight: 600 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "rgba(217, 119, 6, 0.08)" }}>
                          <TableCell sx={{ fontWeight: 800 }}>S.No.</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Employee ID</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Employee Name</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Salary Head</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Entry Type</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            Current Month (₹)
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            Samarth (₹)
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            Adjustment Amount (₹)
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Direction / Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOneTimeEntries
                          .slice(otePage * oteRowsPerPage, otePage * oteRowsPerPage + oteRowsPerPage)
                          .map((ote, idx) => (
                            <TableRow key={idx} hover sx={{ bgcolor: "rgba(254, 242, 242, 0.3)" }}>
                              <TableCell>{ote.s_no}</TableCell>
                              <TableCell>
                                <Typography fontWeight={700} variant="body2">
                                  {ote.employee_id}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={800} variant="body2">
                                  {ote.employee_name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={ote.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                              </TableCell>
                              <TableCell>
                                <Typography fontWeight={700} variant="body2" color="primary.main">
                                  {ote.salary_head}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={ote.entry_type}
                                  size="small"
                                  color={ote.entry_type.includes("Deduction") ? "error" : "success"}
                                  sx={{ fontWeight: 700 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(ote.current_value)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{formatCurrency(ote.samarth_value)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  fontWeight={800}
                                  color={ote.difference > 0 ? "#166534" : "#991B1B"}
                                >
                                  {ote.difference > 0 ? `+${formatCurrency(ote.difference)}` : formatCurrency(ote.difference)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {ote.remarks}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    component="div"
                    count={filteredOneTimeEntries.length}
                    rowsPerPage={oteRowsPerPage}
                    page={otePage}
                    onPageChange={(_, newP) => setOtePage(newP)}
                    onRowsPerPageChange={(e) => {
                      setOteRowsPerPage(parseInt(e.target.value, 10));
                      setOtePage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: FLAT DETAILED TABLE VIEW                                          */}
          {/* ========================================================================= */}
          {activeTab === 2 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Flat Salary Comparison Table
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredFlatRows.length} total salary head comparison rows.
                </Typography>
              </Box>

              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.05)" }}>
                      <TableCell sx={{ fontWeight: 800 }}>Employee Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Salary Head</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        Current Month (₹)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        Samarth (₹)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        Difference (Current - Samarth)
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredFlatRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">No matching salary rows found.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFlatRows
                        .slice(flatPage * flatRowsPerPage, flatPage * flatRowsPerPage + flatRowsPerPage)
                        .map((row, rIdx) => (
                          <TableRow
                            key={rIdx}
                            hover
                            sx={{
                              bgcolor: row.status === "MISMATCH" ? "rgba(254, 242, 242, 0.4)" : "inherit"
                            }}
                          >
                            <TableCell>
                              <Typography fontWeight={700}>{row.employee_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={row.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight={row.is_total ? 800 : 500}>{row.salary_head}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{formatCurrency(row.current_value)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{formatCurrency(row.samarth_value)}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                fontWeight={row.status === "MISMATCH" && !row.is_total ? 800 : 500}
                                color={
                                  row.difference > 0
                                    ? "#166534"
                                    : row.difference < 0
                                    ? "#991B1B"
                                    : "text.secondary"
                                }
                              >
                                {row.difference > 0 ? `+${formatCurrency(row.difference)}` : formatCurrency(row.difference)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {renderStatusChip(row.status, row.is_total)}
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredFlatRows.length}
                rowsPerPage={flatRowsPerPage}
                page={flatPage}
                onPageChange={(_, newP) => setFlatPage(newP)}
                onRowsPerPageChange={(e) => {
                  setFlatRowsPerPage(parseInt(e.target.value, 10));
                  setFlatPage(0);
                }}
              />
            </Paper>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: SALARY HEAD MISMATCH SUMMARY                                      */}
          {/* ========================================================================= */}
          {activeTab === 3 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="h6" fontWeight={800}>
                  Salary Head Mismatch Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Summarizes which salary heads have discrepancies and the total net difference across all employees (Totals excluded).
                </Typography>
              </Box>

              {comparisonResult?.head_mismatch_summary?.length === 0 ? (
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="success.main">
                    All Salary Heads Match Perfectly!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Zero mismatches detected across individual salary heads.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.05)" }}>
                        <TableCell sx={{ fontWeight: 800 }}>Salary Head</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800 }}>
                          Employees with Mismatches
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          Total Net Difference (₹)
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparisonResult?.head_mismatch_summary?.map((hm, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell>
                            <Typography fontWeight={700}>{hm.salary_head}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={hm.category} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={`${hm.employees_changed} Employees`}
                              size="small"
                              color="error"
                              sx={{ fontWeight: 800 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              fontWeight={800}
                              color={
                                hm.total_difference > 0
                                  ? "#166534"
                                  : hm.total_difference < 0
                                  ? "#991B1B"
                                  : "text.secondary"
                              }
                            >
                              {hm.total_difference > 0 ? `+${formatCurrency(hm.total_difference)}` : formatCurrency(hm.total_difference)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
