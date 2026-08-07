import React from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  InputBase,
  alpha
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default function Topbar() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "transparent",
        color: "text.primary",
        mb: 3
      }}
    >
      <Toolbar
        sx={{
          minHeight: 72,
          borderRadius: 4,
          bgcolor: "background.paper",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          px: 2,
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <Box sx={{paddingLeft: 4,paddingTop: 3, paddingBottom: 3, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography variant="h5" fontWeight={800}>
            Payroll Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage one-time payroll entries for the finance team
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 999,
              bgcolor: alpha("#64748B", 0.08),
              minWidth: 260
            }}
          >
            <SearchIcon fontSize="small" color="action" />
            <InputBase placeholder="Search..." fullWidth />
          </Box>

          <IconButton>
            <NotificationsNoneIcon />
          </IconButton>

          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>F</Avatar>

          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}