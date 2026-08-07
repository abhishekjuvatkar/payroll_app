// src/screens/PayrollEntryScreen.jsx
import React, { useState } from "react";
import { Box, Paper } from "@mui/material";
import MonthYearSelector from "../components/MonthYearSelector";
import PayrollTable from "../components/PayrollTable";

const now = new Date();

export default function PayrollEntryScreen() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <Box sx={{ mt: 1 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFF 100%)"
        }}
      >
        <MonthYearSelector
          month={month}
          year={year}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
      </Paper>

      <PayrollTable month={month} year={year} />
    </Box>
  );
}