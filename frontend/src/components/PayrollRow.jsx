import React, { useMemo, useCallback } from "react";
import {
  Autocomplete,
  IconButton,
  TableCell,
  TableRow,
  TextField,
  createFilterOptions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";

// High-speed option filtering (caps at 50 results in dropdown for instant popup rendering)
const employeeFilter = createFilterOptions({
  stringify: (option) => `${option.employee_name || ""} ${option.employee_code || ""} ${option.designation || ""}`,
  limit: 50
});

const headFilter = createFilterOptions({
  stringify: (option) => option.salary_head || "",
  limit: 50
});

const getEmployeeLabel = (opt) => {
  if (!opt) return "";
  if (opt.employee_code && opt.employee_code !== opt.employee_name) {
    return `${opt.employee_name} (${opt.employee_code})`;
  }
  return opt.employee_name || opt.employee_code || "";
};

const getSalaryHeadLabel = (opt) => (opt ? opt.salary_head || "" : "");

const isEmployeeEqual = (opt, val) => {
  if (!opt || !val) return false;
  if (opt.id && val.id && opt.id === val.id) return true;
  if (opt.employee_code && val.employee_code && opt.employee_code.trim().toUpperCase() === val.employee_code.trim().toUpperCase()) return true;
  if (opt.employee_name && val.employee_name && opt.employee_name.trim().toUpperCase() === val.employee_name.trim().toUpperCase()) return true;
  return false;
};

const isHeadEqual = (opt, val) => {
  if (!opt || !val) return false;
  if (opt.id && val.id && opt.id === val.id) return true;
  if (opt.salary_head && val.salary_head && opt.salary_head.trim().toLowerCase() === val.salary_head.trim().toLowerCase()) return true;
  return false;
};

function PayrollRowComponent({
  row,
  onRowChange,
  onRowDelete,
  disableDelete,
  allEmployees = [],
  allSalaryHeads = []
}) {
  const handleEmployeeChange = useCallback(
    (_, val) => {
      onRowChange(row.id, { ...row, employee: val });
    },
    [row, onRowChange]
  );

  const handleSalaryHeadChange = useCallback(
    (_, val) => {
      onRowChange(row.id, { ...row, salaryHead: val });
    },
    [row, onRowChange]
  );

  const handleAmountChange = useCallback(
    (e) => {
      const val = e.target.value;
      onRowChange(row.id, {
        ...row,
        amount: val === "" ? "" : val
      });
    },
    [row, onRowChange]
  );

  const handleDelete = useCallback(() => {
    onRowDelete(row.id);
  }, [row.id, onRowDelete]);

  return (
    <TableRow
      hover
      sx={{
        "&:hover": {
          backgroundColor: "rgba(37, 99, 235, 0.03)"
        }
      }}
    >
      <TableCell sx={{ minWidth: 340 }}>
        <Autocomplete
          options={allEmployees}
          value={row.employee}
          getOptionLabel={getEmployeeLabel}
          filterOptions={employeeFilter}
          isOptionEqualToValue={isEmployeeEqual}
          onChange={handleEmployeeChange}
          disableClearable={false}
          autoHighlight
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search Employee"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PersonIcon
                      sx={{ color: "text.secondary", mr: 0.5 }}
                      fontSize="small"
                    />
                    {params.InputProps?.startAdornment || null}
                  </>
                )
              }}
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ minWidth: 280 }}>
        <Autocomplete
          options={allSalaryHeads}
          value={row.salaryHead}
          getOptionLabel={getSalaryHeadLabel}
          filterOptions={headFilter}
          isOptionEqualToValue={isHeadEqual}
          onChange={handleSalaryHeadChange}
          disableClearable={false}
          autoHighlight
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Search Salary Head"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PaidOutlinedIcon
                      sx={{ color: "text.secondary", mr: 0.5 }}
                      fontSize="small"
                    />
                    {params.InputProps?.startAdornment || null}
                  </>
                )
              }}
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ minWidth: 150 }}>
        <TextField
          size="small"
          type="number"
          placeholder="0.00"
          value={row.amount ?? ""}
          onChange={handleAmountChange}
          inputProps={{ min: 0, step: "0.01", style: { fontWeight: 600 } }}
          fullWidth
        />
      </TableCell>

      <TableCell align="center" sx={{ width: 70 }}>
        <IconButton color="error" size="small" onClick={handleDelete} disabled={disableDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// Custom memo comparison: only re-render the specific row that changed!
function areEqual(prevProps, nextProps) {
  if (prevProps.disableDelete !== nextProps.disableDelete) return false;
  if (prevProps.allEmployees !== nextProps.allEmployees) return false;
  if (prevProps.allSalaryHeads !== nextProps.allSalaryHeads) return false;

  const p = prevProps.row;
  const n = nextProps.row;

  if (p.id !== n.id) return false;
  if (p.amount !== n.amount) return false;
  if (p.remarks !== n.remarks) return false;

  if (p.employee !== n.employee) {
    if (!p.employee || !n.employee) return false;
    if (p.employee.id !== n.employee.id) return false;
    if (p.employee.employee_code !== n.employee.employee_code) return false;
    if (p.employee.employee_name !== n.employee.employee_name) return false;
  }

  if (p.salaryHead !== n.salaryHead) {
    if (!p.salaryHead || !n.salaryHead) return false;
    if (p.salaryHead.id !== n.salaryHead.id) return false;
    if (p.salaryHead.salary_head !== n.salaryHead.salary_head) return false;
  }

  return true;
}

export default React.memo(PayrollRowComponent, areEqual);
