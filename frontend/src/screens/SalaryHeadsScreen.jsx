import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import { getSalaryHeads, addSalaryHead } from "../services/api";

export default function SalaryHeadsScreen() {
  const [salaryHeads, setSalaryHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [newSalaryHead, setNewSalaryHead] = useState("");
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const loadSalaryHeads = async () => {
    setLoading(true);
    try {
      const data = await getSalaryHeads();
      setSalaryHeads(data || []);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to load salary heads.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalaryHeads();
  }, []);

  const filteredSalaryHeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return salaryHeads;
    return salaryHeads.filter((s) => s.salary_head.toLowerCase().includes(q));
  }, [salaryHeads, search]);

  const handleOpenDialog = () => {
    setNewSalaryHead("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setOpenDialog(false);
  };

  const handleAddSalaryHead = async () => {
    const trimmed = newSalaryHead.trim();

    if (!trimmed) {
      setSnackbar({
        open: true,
        message: "Please enter a salary head name.",
        severity: "warning"
      });
      return;
    }

    const alreadyExists = salaryHeads.some(
      (s) => s.salary_head.toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setSnackbar({
        open: true,
        message: "This salary head already exists.",
        severity: "warning"
      });
      return;
    }

    setSaving(true);
    try {
      const created = await addSalaryHead(trimmed);
      setSalaryHeads((prev) => [created, ...prev]);
      setSnackbar({
        open: true,
        message: `"${created.salary_head}" added successfully.`,
        severity: "success"
      });
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message:
          err?.response?.data?.detail?.[0]?.msg ||
          err?.response?.data?.detail ||
          "Failed to add salary head.",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Salary Heads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the list of salary heads used across payroll entries.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            borderRadius: 2.5,
            fontWeight: 700,
            textTransform: "none",
            px: 3,
            py: 1,
            boxShadow: "0 8px 18px rgba(37, 99, 235, 0.22)"
          }}
        >
          Add Salary Head
        </Button>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 3
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2
          }}
        >
          <TextField
            placeholder="Search salary head..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ maxWidth: 320 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <Chip
            icon={<PaidOutlinedIcon />}
            label={`${filteredSalaryHeads.length} salary head${
              filteredSalaryHeads.length === 1 ? "" : "s"
            }`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading salary heads...
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 700 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "rgba(37, 99, 235, 0.05)"
                    }}
                  >
                    ID
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "rgba(37, 99, 235, 0.05)"
                    }}
                  >
                    Salary Head
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSalaryHeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No salary heads found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalaryHeads.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ width: 100 }}>{item.id}</TableCell>
                      <TableCell>{item.salary_head}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Add Salary Head</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Salary Head Name"
            placeholder="e.g. Special Duty Allowance"
            value={newSalaryHead}
            onChange={(e) => setNewSalaryHead(e.target.value)}
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSalaryHead();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddSalaryHead}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            {saving ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}