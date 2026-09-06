import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  CircularProgress,
  InputAdornment,
  Avatar,
  Stack,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilePresentIcon from "@mui/icons-material/FilePresent";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";

import {
  getEmployees,
  uploadEmployeesExcel,
  downloadEmployeeTemplate,
  exportEmployeesExcel,
  sanitizeEmployeeCodes,
  updateEmployee
} from "../services/api";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import EditIcon from "@mui/icons-material/Edit";

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sanitizing, setSanitizing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);
  const [editCodeValue, setEditCodeValue] = useState("");
  const [savingCode, setSavingCode] = useState(false);
  const [dialogTab, setDialogTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fileInputRef = useRef(null);

  const loadEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch (err) {
      setError("Failed to load employees from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadEmployeesExcel(file);
      setSnackbar({
        open: true,
        message: res.message || `Successfully uploaded employee sheet! (${res.created} added, ${res.updated} updated)`,
        severity: "success"
      });
      await loadEmployees();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || "Failed to upload employee Excel file.",
        severity: "error"
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSanitizeCodes = async () => {
    setSanitizing(true);
    try {
      const res = await sanitizeEmployeeCodes();
      setSnackbar({
        open: true,
        message: res.message || `Fixed and standardized ${res.total_updated} employee codes!`,
        severity: "success"
      });
      await loadEmployees();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to sanitize employee codes.",
        severity: "error"
      });
    } finally {
      setSanitizing(false);
    }
  };

  const handleSaveCode = async () => {
    if (!editingEmp || !editCodeValue.trim()) return;
    setSavingCode(true);
    try {
      await updateEmployee(editingEmp.id, { employee_code: editCodeValue.trim().toUpperCase() });
      setSnackbar({
        open: true,
        message: `Updated code for ${editingEmp.employee_name} to ${editCodeValue.trim().toUpperCase()}`,
        severity: "success"
      });
      setEditingEmp(null);
      await loadEmployees();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to update employee code.",
        severity: "error"
      });
    } finally {
      setSavingCode(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadEmployeeTemplate();
      setSnackbar({ open: true, message: "Downloaded official employee template.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to download template.", severity: "error" });
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      await exportEmployeesExcel();
      setSnackbar({ open: true, message: "Exported all employees to Excel.", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to export employees.", severity: "error" });
    } finally {
      setExporting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = (e.employee_name || "").toLowerCase();
      const code = (e.employee_code || "").toLowerCase();
      const desig = (e.designation || "").toLowerCase();
      const ou = (e.organization_unit || "").toLowerCase();
      const email = (e.official_email || "").toLowerCase();
      const phone = (e.mobile_number || "").toLowerCase();
      const type = (e.employee_type || "").toLowerCase();
      const nature = (e.nature_of_employment || "").toLowerCase();
      return (
        name.includes(q) ||
        code.includes(q) ||
        desig.includes(q) ||
        ou.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        type.includes(q) ||
        nature.includes(q)
      );
    });
  }, [employees, search]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter((p) => !["mr.", "dr.", "prof.", "ms.", "mrs.", "shri"].includes(p.toLowerCase()))
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  };

  const paginatedEmployees = filteredEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ mt: 1 }}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv"
        style={{ display: "none" }}
      />

      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Employee Master Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage comprehensive employee records, designations, departments, contact, and address data.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="contained"
            color="warning"
            startIcon={sanitizing ? <CircularProgress size={18} color="inherit" /> : <AutoFixHighIcon />}
            onClick={handleSanitizeCodes}
            disabled={sanitizing}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {sanitizing ? "Fixing Codes..." : "Fix & Standardize Codes"}
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilePresentIcon />}
            onClick={handleDownloadTemplate}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Download Template
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ fontWeight: 800, borderRadius: 2 }}
          >
            {uploading ? "Uploading..." : "Upload Employees (.xlsx)"}
          </Button>

          <Button
            variant="outlined"
            color="info"
            startIcon={exporting ? <CircularProgress size={18} color="inherit" /> : <FileDownloadIcon />}
            onClick={handleExportAll}
            disabled={exporting}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Export All (.xlsx)
          </Button>
        </Stack>
      </Box>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 2.5
          }}
        >
          <TextField
            placeholder="Search by name, code, designation, department, email..."
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: "100%", sm: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <Chip
            icon={<PeopleOutlinedIcon />}
            label={`${filteredEmployees.length} of ${employees.length} Employee${
              employees.length === 1 ? "" : "s"
            }`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, px: 1 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading employee master records...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 650 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(37, 99, 235, 0.04)" }}>
                    <TableCell sx={{ fontWeight: 800 }}>Employee Name & Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Designation & OU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Type & Nature</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Official Email & Mobile</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Joining & Retirement</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          No matching employee records found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedEmployees.map((emp) => (
                      <TableRow key={emp.id || emp.employee_code} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 36,
                                height: 36,
                                fontSize: 13,
                                fontWeight: 700,
                                bgcolor: "primary.main"
                              }}
                            >
                              {getInitials(emp.employee_name)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={700} fontSize="0.95rem">
                                {emp.title ? `${emp.title} ` : ""}{emp.employee_name}
                              </Typography>
                              <Stack direction="row" spacing={0.8} alignItems="center">
                                <Chip
                                  label={emp.employee_code}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, height: 22, fontSize: "0.75rem" }}
                                />
                                <Tooltip title="Edit Code">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingEmp(emp);
                                      setEditCodeValue(emp.employee_code);
                                    }}
                                    sx={{ p: 0.2, color: "action.active", "&:hover": { color: "primary.main" } }}
                                  >
                                    <EditIcon sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Tooltip>
                                {emp.name_in_hindi && (
                                  <Typography variant="caption" color="text.secondary">
                                    ({emp.name_in_hindi})
                                  </Typography>
                                )}
                              </Stack>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography fontWeight={600} fontSize="0.9rem">
                            {emp.designation || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {emp.organization_unit || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontSize="0.85rem">
                            {emp.employee_type || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {emp.nature_of_employment || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontSize="0.85rem">
                            {emp.official_email || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {emp.mobile_number || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography fontSize="0.85rem">
                            DOJ: {emp.date_of_joining || "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            DOS: {emp.date_of_superannuation || "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={emp.status || "Active"}
                            size="small"
                            color={(emp.status || "Active").toLowerCase() === "active" ? "success" : "default"}
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="View Full Employee Profile">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                setSelectedEmp(emp);
                                setDialogTab(0);
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[25, 50, 100, 200]}
              component="div"
              count={filteredEmployees.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newP) => setPage(newP)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Comprehensive Employee Detail Dialog */}
      <Dialog
        open={Boolean(selectedEmp)}
        onClose={() => setSelectedEmp(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEmp && (
          <>
            <DialogTitle sx={{ pb: 1, bgcolor: "rgba(37, 99, 235, 0.04)" }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    fontSize: 18,
                    fontWeight: 700,
                    bgcolor: "primary.main"
                  }}
                >
                  {getInitials(selectedEmp.employee_name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {selectedEmp.title ? `${selectedEmp.title} ` : ""}{selectedEmp.employee_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employee ID: <strong>{selectedEmp.employee_code}</strong> | Designation: <strong>{selectedEmp.designation || "—"}</strong>
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>

            <Tabs
              value={dialogTab}
              onChange={(_, val) => setDialogTab(val)}
              sx={{ borderBottom: 1, borderColor: "divider", px: 3, bgcolor: "rgba(37, 99, 235, 0.02)" }}
            >
              <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Personal Details" />
              <Tab icon={<WorkIcon fontSize="small" />} iconPosition="start" label="Employment & OU" />
              <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Contact & Email" />
              <Tab icon={<HomeIcon fontSize="small" />} iconPosition="start" label="Addresses" />
            </Tabs>

            <DialogContent sx={{ p: 3 }}>
              {dialogTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Full Name</Typography>
                    <Typography fontWeight={600}>{selectedEmp.title ? `${selectedEmp.title} ` : ""}{selectedEmp.employee_name}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Name in Hindi</Typography>
                    <Typography fontWeight={600}>{selectedEmp.name_in_hindi || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Gender</Typography>
                    <Typography fontWeight={600}>{selectedEmp.gender || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                    <Typography fontWeight={600}>{selectedEmp.date_of_birth || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                    <Typography fontWeight={600}>{selectedEmp.blood_group || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Father / Guardian Name</Typography>
                    <Typography fontWeight={600}>{selectedEmp.guardian_name || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Mother's Name</Typography>
                    <Typography fontWeight={600}>{selectedEmp.mother_name || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Appointed Category</Typography>
                    <Typography fontWeight={600}>{selectedEmp.appointed_category || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Social Category</Typography>
                    <Typography fontWeight={600}>{selectedEmp.social_category || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">PWD Status</Typography>
                    <Typography fontWeight={600}>{selectedEmp.is_pwd || "No"}</Typography>
                  </Grid>
                </Grid>
              )}

              {dialogTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Employee ID / Code</Typography>
                    <Typography fontWeight={600}>{selectedEmp.employee_code}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Typography fontWeight={600}>
                      <Chip label={selectedEmp.status || "Active"} size="small" color={(selectedEmp.status || "Active").toLowerCase() === "active" ? "success" : "default"} />
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Designation</Typography>
                    <Typography fontWeight={600}>{selectedEmp.designation || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Organization Unit (OU)</Typography>
                    <Typography fontWeight={600}>{selectedEmp.organization_unit || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Sanctioned Designation</Typography>
                    <Typography fontWeight={600}>{selectedEmp.sanctioned_designation || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Sanctioned Organization Unit</Typography>
                    <Typography fontWeight={600}>{selectedEmp.sanctioned_ou || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Employee Type</Typography>
                    <Typography fontWeight={600}>{selectedEmp.employee_type || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Nature of Employment</Typography>
                    <Typography fontWeight={600}>{selectedEmp.nature_of_employment || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Date of Joining (DOJ)</Typography>
                    <Typography fontWeight={600}>{selectedEmp.date_of_joining || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Date of Superannuation (DOS)</Typography>
                    <Typography fontWeight={600}>{selectedEmp.date_of_superannuation || "—"}</Typography>
                  </Grid>
                </Grid>
              )}

              {dialogTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Official Email</Typography>
                    <Typography fontWeight={600}>{selectedEmp.official_email || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">Personal Email</Typography>
                    <Typography fontWeight={600}>{selectedEmp.personal_email || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Mobile Number</Typography>
                    <Typography fontWeight={600}>{selectedEmp.mobile_number || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Office Phone Number</Typography>
                    <Typography fontWeight={600}>{selectedEmp.office_phone_number || "—"}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Alternate Mobile</Typography>
                    <Typography fontWeight={600}>{selectedEmp.alternate_mobile_no || "—"}</Typography>
                  </Grid>
                </Grid>
              )}

              {dialogTab === 3 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>Residential Address</Typography>
                    <Typography fontWeight={500}>{selectedEmp.residential_address || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      City: {selectedEmp.residential_city || "—"} | State: {selectedEmp.residential_state || "—"} | Pin: {selectedEmp.residential_pincode || "—"} | Phone: {selectedEmp.residential_phone_number || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>Permanent Address</Typography>
                    <Typography fontWeight={500}>{selectedEmp.permanent_address || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      City: {selectedEmp.permanent_city || "—"} | State: {selectedEmp.permanent_state || "—"} | Pin: {selectedEmp.permanent_pincode || "—"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}><Divider /></Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>Hometown</Typography>
                    <Typography fontWeight={500}>{selectedEmp.hometown || "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      City: {selectedEmp.hometown_city || "—"} | State: {selectedEmp.hometown_state || "—"} | Pin: {selectedEmp.hometown_pincode || "—"}
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedEmp(null)} variant="outlined">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Quick Edit Employee Code Dialog */}
      <Dialog
        open={Boolean(editingEmp)}
        onClose={() => setEditingEmp(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Employee Code</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update official Institute Employee Code for <strong>{editingEmp?.employee_name}</strong>.
          </Typography>
          <TextField
            fullWidth
            label="Institute Employee Code (e.g. AS1801, TS2403, EE2001)"
            value={editCodeValue}
            onChange={(e) => setEditCodeValue(e.target.value)}
            size="small"
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingEmp(null)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveCode}
            variant="contained"
            color="primary"
            disabled={savingCode || !editCodeValue.trim()}
          >
            {savingCode ? "Saving..." : "Save Code"}
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
    </Box>
  );
}