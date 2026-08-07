// src/screens/DashboardScreen.jsx
import React from "react";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleIcon from "@mui/icons-material/People";

export default function DashboardScreen() {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h5" fontWeight={800} mb={2}>
        Overview
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  color: "white"
                }}
              >
                <ReceiptLongIcon />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                This Month Payroll
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={800}>
              ₹ 0.00
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Total one-time entries processed this month.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #ECFEFF 0%, #E0F2FE 100%)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "secondary.main",
                  display: "grid",
                  placeItems: "center",
                  color: "white"
                }}
              >
                <PeopleIcon />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Employees with entries
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight={800}>
              0
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Count of employees having one-time payroll records.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: "linear-gradient(135deg, #FDF2FF 0%, #EDE9FE 100%)"
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "#6366F1",
                  display: "grid",
                  placeItems: "center",
                  color: "white"
                }}
              >
                <ShowChartIcon />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Quick actions
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Jump directly to payroll entry or exports.
            </Typography>
            <Button variant="contained" size="small" sx={{ mr: 1 }} href="/payroll">
              Go to Payroll Entry
            </Button>
            <Button variant="outlined" size="small" href="/exports">
              View Exports
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}