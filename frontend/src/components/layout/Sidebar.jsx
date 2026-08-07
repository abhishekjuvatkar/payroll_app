// src/components/layout/Sidebar.jsx
import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DownloadIcon from "@mui/icons-material/Download";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLocation, useNavigate } from "react-router-dom";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";

const navItems = [
  //   { label: "Dashboard", icon: <DashboardIcon fontSize="small" />, path: "/" },
  {
    label: "Employees",
    icon: <PeopleIcon fontSize="small" />,
    path: "/employees",
  },
  {
    label: "Salary Heads",
    icon: <PaidOutlinedIcon fontSize="small" />,
    path: "/salary-heads",
  },
  {
    label: "Payroll Entry",
    icon: <ReceiptLongIcon fontSize="small" />,
    path: "/payroll",
  },
    { label: "Exports", icon: <DownloadIcon fontSize="small" />, path: "/exports" },
    { label: "Basic Salary", icon: <DownloadIcon fontSize="small" />, path: "/update-basic" },
    // { label: "Settings", icon: <SettingsIcon fontSize="small" />, path: "/settings" }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        bgcolor: "#1E293B",
        color: "white",
        minHeight: "100vh",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo / title */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          px: 1,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "grid",
            placeItems: "center",
          }}
        >
          <AccountBalanceIcon />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} lineHeight={1}>
            Payroll
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
            Finance Panel
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

      {/* Navigation list */}
      <List sx={{ px: 0, flex: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1,
                borderRadius: 2,
                color: active ? "#fff" : "rgba(255,255,255,0.75)",
                bgcolor: active ? "rgba(37, 99, 235, 0.35)" : "transparent",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
              <ChevronRightIcon fontSize="small" />
            </ListItemButton>
          );
        })}
      </List>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 3,
          bgcolor: "rgba(255,255,255,0.06)",
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          One Time Payroll
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Month-based entry and export
        </Typography>
      </Box>
    </Box>
  );
}
