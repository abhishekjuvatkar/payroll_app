
import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const MONTHS = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

export default function MonthYearSelector({ month, year, onMonthChange, onYearChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        alignItems: "center",
        flexWrap: "wrap",
        mb: 2
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CalendarMonthIcon color="primary" />
        <Typography variant="h6">Period</Typography>
      </Box>

      <FormControl sx={{ minWidth: 180 }} size="small">
        <InputLabel id="month-select-label">Month</InputLabel>
        <Select
          labelId="month-select-label"
          label="Month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
        >
          {MONTHS.map((m, idx) => (
            <MenuItem key={m} value={idx + 1}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }} size="small">
        <InputLabel id="year-select-label">Year</InputLabel>
        <Select
          labelId="year-select-label"
          label="Year"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
        >
          {YEARS.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Chip
        label={`${MONTHS[month - 1]} ${year}`}
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 700, ml: "auto" }}
      />
    </Box>
  );
}