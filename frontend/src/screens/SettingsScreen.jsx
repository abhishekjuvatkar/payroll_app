// src/screens/SettingsScreen.jsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider
} from "@mui/material";

export default function SettingsScreen() {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="h5" fontWeight={800} mb={2}>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Basic configuration for the payroll app. You can later connect these to
          backend configuration or environment flags.
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={<Switch defaultChecked />}
            label="Enable one-time payroll entries"
          />
          <FormControlLabel
            control={<Switch />}
            label="Require approval before export"
          />
          <FormControlLabel
            control={<Switch />}
            label="Show advanced salary head filters"
          />
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary">
          Add more finance-specific settings here (cut-off dates, allowed users, etc.).
        </Typography>
      </Paper>
    </Box>
  );
}