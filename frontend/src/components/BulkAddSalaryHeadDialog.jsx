import React, { useState, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Checkbox,
  Chip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Divider,
  Alert
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";

// Individual Memoized Row to prevent unnecessary re-renders
const BulkEmpRow = React.memo(function BulkEmpRow({
  emp,
  isSelected,
  amount,
  remarks,
  onToggle,
  onAmountChange,
  onRemarksChange
}) {
  const empId = emp.id || emp.employee_code;

  return (
    <TableRow
      hover
      selected={isSelected}
      sx={{
        bgcolor: isSelected ? "rgba(37, 99, 235, 0.04)" : "inherit"
      }}
    >
      <TableCell align="center" width={50} onClick={() => onToggle(empId)}>
        <Checkbox checked={isSelected} size="small" />
      </TableCell>

      <TableCell width={110} onClick={() => onToggle(empId)} sx={{ cursor: "pointer" }}>
        <Chip
          label={emp.employee_code || "—"}
          size="small"
          color="primary"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "0.75rem" }}
        />
      </TableCell>

      <TableCell onClick={() => onToggle(empId)} sx={{ cursor: "pointer" }}>
        <Typography fontWeight={600} fontSize="0.85rem">
          {emp.title ? `${emp.title} ` : ""}{emp.employee_name}
        </Typography>
        {emp.designation && (
          <Typography variant="caption" color="text.secondary">
            {emp.designation}
          </Typography>
        )}
      </TableCell>

      <TableCell width={150}>
        <TextField
          size="small"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => onAmountChange(empId, e.target.value)}
          sx={{ width: "100%", bgcolor: "white" }}
          inputProps={{ min: 0, style: { fontSize: "0.85rem", padding: "4px 8px", fontWeight: 600 } }}
        />
      </TableCell>

      <TableCell width={180}>
        <TextField
          size="small"
          placeholder="Remarks"
          value={remarks}
          onChange={(e) => onRemarksChange(empId, e.target.value)}
          sx={{ width: "100%", bgcolor: "white" }}
          inputProps={{ style: { fontSize: "0.85rem", padding: "4px 8px" } }}
        />
      </TableCell>
    </TableRow>
  );
});

export default function BulkAddSalaryHeadDialog({
  open,
  onClose,
  allSalaryHeads = [],
  allEmployees = [],
  onAddEntries
}) {
  const [selectedHead, setSelectedHead] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Tab 0 State
  const [search, setSearch] = useState("");
  const [defaultAmount, setDefaultAmount] = useState("");
  const [defaultRemarks, setDefaultRemarks] = useState("");
  const [empSelections, setEmpSelections] = useState({});

  // Pagination for fast rendering of the employee list inside dialog
  const [dialogPage, setDialogPage] = useState(0);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState(25);

  // Tab 1 (Paste) State
  const [pasteText, setPasteText] = useState("");

  // Instant In-Memory Filter
  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter((e) => {
      const name = (e.employee_name || "").toLowerCase();
      const code = (e.employee_code || "").toLowerCase();
      const desig = (e.designation || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desig.includes(q);
    });
  }, [allEmployees, search]);

  const paginatedEmployees = useMemo(() => {
    const start = dialogPage * dialogRowsPerPage;
    return filteredEmployees.slice(start, start + dialogRowsPerPage);
  }, [filteredEmployees, dialogPage, dialogRowsPerPage]);

  const handleToggleEmp = useCallback((empId) => {
    setEmpSelections((prev) => {
      const current = prev[empId] || { selected: false, amount: defaultAmount || "", remarks: defaultRemarks || "" };
      return {
        ...prev,
        [empId]: {
          ...current,
          selected: !current.selected,
          amount: current.amount || defaultAmount || "",
          remarks: current.remarks || defaultRemarks || ""
        }
      };
    });
  }, [defaultAmount, defaultRemarks]);

  const handleAmountChange = useCallback((empId, val) => {
    setEmpSelections((prev) => {
      const current = prev[empId] || { selected: true, amount: "", remarks: defaultRemarks || "" };
      return {
        ...prev,
        [empId]: {
          ...current,
          selected: true,
          amount: val
        }
      };
    });
  }, [defaultRemarks]);

  const handleRemarksChange = useCallback((empId, val) => {
    setEmpSelections((prev) => {
      const current = prev[empId] || { selected: true, amount: defaultAmount || "", remarks: "" };
      return {
        ...prev,
        [empId]: {
          ...current,
          remarks: val
        }
      };
    });
  }, [defaultAmount]);

  const handleApplyDefaultAmount = () => {
    if (!defaultAmount.trim()) return;
    setEmpSelections((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k]?.selected) {
          next[k] = { ...next[k], amount: defaultAmount };
        }
      });
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setEmpSelections((prev) => {
      const next = { ...prev };
      filteredEmployees.forEach((emp) => {
        const empId = emp.id || emp.employee_code;
        next[empId] = {
          selected: true,
          amount: next[empId]?.amount || defaultAmount || "",
          remarks: next[empId]?.remarks || defaultRemarks || ""
        };
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    setEmpSelections({});
  };

  const selectedCountTab0 = useMemo(() => {
    return Object.values(empSelections).filter((v) => v?.selected).length;
  }, [empSelections]);

  // Tab 1: Parse pasted text
  const parsedPasteRows = useMemo(() => {
    if (!pasteText.trim()) return [];
    const lines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean);
    const results = [];

    const norm = (s) => (s || "").replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.|shri|smt\.)\s+/i, "").replace(/[\s._-]+/g, " ").trim().toUpperCase();

    lines.forEach((line) => {
      let parts = line.split("\t");
      if (parts.length === 1) parts = line.split(",");
      if (parts.length === 1) parts = line.split(/\s{2,}/);
      if (parts.length === 1) {
        const spaceTokens = line.split(/\s+/);
        if (spaceTokens.length >= 2 && !isNaN(Number(spaceTokens[spaceTokens.length - 1]))) {
          const amt = spaceTokens.pop();
          parts = [spaceTokens.join(" "), amt];
        }
      }

      const rawIdentifier = (parts[0] || "").trim();
      const rawAmount = (parts[1] || "").trim().replace(/[^\d.-]/g, "");
      const rawRemarks = (parts[2] || "").trim();

      if (!rawIdentifier) return;

      let matched = allEmployees.find(
        (e) => e.employee_code && e.employee_code.trim().toUpperCase() === rawIdentifier.toUpperCase()
      );
      if (!matched) {
        matched = allEmployees.find(
          (e) => e.employee_name && e.employee_name.trim().toUpperCase() === rawIdentifier.toUpperCase()
        );
      }
      if (!matched) {
        const targetNorm = norm(rawIdentifier);
        if (targetNorm) {
          matched = allEmployees.find((e) => norm(e.employee_name) === targetNorm);
        }
      }

      results.push({
        rawIdentifier,
        matchedEmployee: matched || { employee_code: rawIdentifier, employee_name: rawIdentifier },
        isMatched: Boolean(matched),
        amount: rawAmount,
        remarks: rawRemarks
      });
    });

    return results;
  }, [pasteText, allEmployees]);

  const totalReadyToAdd = activeTab === 0 ? selectedCountTab0 : parsedPasteRows.length;

  const handleConfirmAdd = () => {
    if (!selectedHead) return;

    let entriesToAdd = [];

    if (activeTab === 0) {
      allEmployees.forEach((emp) => {
        const empId = emp.id || emp.employee_code;
        const sel = empSelections[empId];
        if (sel?.selected) {
          entriesToAdd.push({
            employee: emp,
            salaryHead: selectedHead,
            amount: sel.amount || "0",
            remarks: sel.remarks || ""
          });
        }
      });
    } else {
      parsedPasteRows.forEach((r) => {
        entriesToAdd.push({
          employee: r.matchedEmployee,
          salaryHead: selectedHead,
          amount: r.amount || "0",
          remarks: r.remarks || ""
        });
      });
    }

    if (entriesToAdd.length > 0) {
      onAddEntries(entriesToAdd, selectedHead);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedHead(null);
    setSearch("");
    setDefaultAmount("");
    setDefaultRemarks("");
    setEmpSelections({});
    setPasteText("");
    setActiveTab(0);
    setDialogPage(0);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      transitionDuration={150}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PlaylistAddIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Bulk Add Employees for Salary Head
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Select one Salary Head and add multiple employees with individual or uniform amounts at once.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        {/* Step 1: Salary Head Selector */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.8, color: "primary.main" }}>
            1. Select Salary Head *
          </Typography>
          <Autocomplete
            options={allSalaryHeads}
            getOptionLabel={(option) => option.salary_head || ""}
            value={selectedHead}
            onChange={(_, newVal) => setSelectedHead(newVal)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Type or select a salary head (e.g. Income Tax (TDS), Electricity Charges...)"
                size="small"
                fullWidth
              />
            )}
            sx={{ bgcolor: "#F8FAFC" }}
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Step 2: Input Mode Tabs */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.8, color: "primary.main" }}>
            2. Choose Employees & Amounts
          </Typography>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              minHeight: 36,
              "& .MuiTab-root": { minHeight: 36, py: 0.5, fontWeight: 700 }
            }}
          >
            <Tab icon={<PlaylistAddIcon fontSize="small" />} iconPosition="start" label="Select from Directory" />
            <Tab icon={<ContentPasteIcon fontSize="small" />} iconPosition="start" label="Quick Paste from Excel" />
          </Tabs>
        </Box>

        {/* TAB 0: Multi-Select from Employee Directory */}
        {activeTab === 0 && (
          <Box>
            {/* Global defaults & Filter bar */}
            <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, bgcolor: "#F1F5F9", borderRadius: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                <TextField
                  placeholder="Search name, code, designation..."
                  size="small"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setDialogPage(0);
                  }}
                  sx={{ flex: 1, bgcolor: "white" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  placeholder="Default Amount (₹)"
                  type="number"
                  size="small"
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(e.target.value)}
                  sx={{ width: { xs: "100%", sm: 160 }, bgcolor: "white" }}
                />

                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleApplyDefaultAmount}
                  disabled={!defaultAmount.trim() || selectedCountTab0 === 0}
                  sx={{ textTransform: "none", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  Apply to Selected ({selectedCountTab0})
                </Button>
              </Stack>

              <Box sx={{ mt: 1.2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={handleSelectAllFiltered} sx={{ fontSize: "0.75rem", py: 0 }}>
                    Select All Filtered ({filteredEmployees.length})
                  </Button>
                  <Button size="small" color="secondary" onClick={handleDeselectAll} sx={{ fontSize: "0.75rem", py: 0 }}>
                    Clear All
                  </Button>
                </Stack>

                <Chip
                  label={`${selectedCountTab0} Employee${selectedCountTab0 === 1 ? "" : "s"} Selected`}
                  color={selectedCountTab0 > 0 ? "primary" : "default"}
                  size="small"
                  variant="filled"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Paper>

            {/* High Performance Paginated Employee Table */}
            <TableContainer sx={{ maxHeight: 300, border: "1px solid #E2E8F0", borderRadius: 1.5 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                    <TableCell width={50} align="center">Select</TableCell>
                    <TableCell width={110}>Code</TableCell>
                    <TableCell>Employee Name</TableCell>
                    <TableCell width={150}>Amount (₹)</TableCell>
                    <TableCell width={180}>Remarks (Optional)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No employees found matching "{search}".
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((emp) => {
                      const empId = emp.id || emp.employee_code;
                      const sel = empSelections[empId] || { selected: false, amount: "", remarks: "" };

                      return (
                        <BulkEmpRow
                          key={empId}
                          emp={emp}
                          isSelected={Boolean(sel.selected)}
                          amount={sel.amount || ""}
                          remarks={sel.remarks || ""}
                          onToggle={handleToggleEmp}
                          onAmountChange={handleAmountChange}
                          onRemarksChange={handleRemarksChange}
                        />
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[25, 50, 100]}
              component="div"
              count={filteredEmployees.length}
              rowsPerPage={dialogRowsPerPage}
              page={dialogPage}
              onPageChange={(_, newP) => setDialogPage(newP)}
              onRowsPerPageChange={(e) => {
                setDialogRowsPerPage(parseInt(e.target.value, 10));
                setDialogPage(0);
              }}
              sx={{ borderTop: "1px solid #E2E8F0" }}
            />
          </Box>
        )}

        {/* TAB 1: Quick Paste Mode */}
        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 1.5, fontSize: "0.85rem" }}>
              Copy columns from Excel and paste here. Supported format: <strong>[Employee Code / Name]</strong> [tab/comma] <strong>[Amount]</strong> [tab/comma] [Remarks].
            </Alert>

            <TextField
              multiline
              rows={6}
              fullWidth
              placeholder={`Example:\nRF2002\t50000\tTax Deduction\nAS1801\t1200\nSandeep Pareek\t2500`}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              sx={{ fontFamily: "monospace", fontSize: "0.85rem", mb: 2 }}
            />

            {parsedPasteRows.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Parsed Preview ({parsedPasteRows.length} Rows):
                </Typography>
                <TableContainer sx={{ maxHeight: 180, border: "1px solid #E2E8F0", borderRadius: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#F8FAFC" }}>
                        <TableCell>Matched Code</TableCell>
                        <TableCell>Employee Name</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedPasteRows.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Chip
                              label={r.matchedEmployee?.employee_code || r.rawIdentifier}
                              size="small"
                              color={r.isMatched ? "primary" : "warning"}
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography fontSize="0.85rem" fontWeight={r.isMatched ? 600 : 400}>
                              {r.matchedEmployee?.employee_name || r.rawIdentifier}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontSize="0.85rem" fontWeight={700}>
                              ₹{Number(r.amount || 0).toLocaleString("en-IN")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography fontSize="0.8rem" color="text.secondary">
                              {r.remarks || "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: "space-between" }}>
        <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
          {selectedHead ? (
            <span>Salary Head: <strong>{selectedHead.salary_head}</strong> ({totalReadyToAdd} employees)</span>
          ) : (
            <span style={{ color: "#DC2626" }}>* Please select a Salary Head above</span>
          )}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={handleConfirmAdd}
            variant="contained"
            color="primary"
            disabled={!selectedHead || totalReadyToAdd === 0}
            startIcon={<PlaylistAddIcon />}
            sx={{ fontWeight: 800 }}
          >
            Add {totalReadyToAdd} Entries to Payroll
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
