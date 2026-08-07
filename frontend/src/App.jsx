// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Container } from "@mui/material";
import DashboardLayout from "./components/layout/DashboardLayout";

import DashboardScreen from "./screens/DashboardScreen";
import EmployeesScreen from "./screens/EmployeesScreen";
import PayrollEntryScreen from "./screens/PayrollEntryScreen";
import ExportsScreen from "./screens/ExportsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SalaryHeadsScreen from "./screens/SalaryHeadsScreen";

export default function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Container maxWidth="xl" sx={{ px: { xs: 0, md: 2 } }}>
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/employees" element={<EmployeesScreen />} />
            <Route path="/payroll" element={<PayrollEntryScreen />} />
            <Route path="/exports" element={<ExportsScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/salary-heads" element={<SalaryHeadsScreen />} />
          </Routes>
        </Container>
      </DashboardLayout>
    </BrowserRouter>
  );
}