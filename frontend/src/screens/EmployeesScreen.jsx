import React, { useEffect, useMemo, useState } from "react";
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
  CircularProgress,
  InputAdornment,
  Avatar,
  Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import { getEmployees } from "../services/api";

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getEmployees();
        setEmployees(data || []);
      } catch (err) {
        setError("Failed to load employees.");
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(q) ||
        e.employee_code.toLowerCase().includes(q)
    );
  }, [employees, search]);

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
    <Box sx={{ mt: 1 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>
          Employees
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View employee codes and names used across payroll entries.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
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
            placeholder="Search by name or code..."
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
            icon={<PeopleOutlinedIcon />}
            label={`${filteredEmployees.length} employee${
              filteredEmployees.length === 1 ? "" : "s"
            }`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Loading employees...
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
                    Employee
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      backgroundColor: "rgba(37, 99, 235, 0.05)"
                    }}
                  >
                    Employee Code
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No employees found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              fontSize: 13,
                              fontWeight: 700,
                              bgcolor: "primary.main"
                            }}
                          >
                            {getInitials(emp.employee_name)}
                          </Avatar>
                          <Typography fontWeight={600}>
                            {emp.employee_name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={emp.employee_code}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}