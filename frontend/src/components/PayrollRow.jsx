
import React, { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  IconButton,
  TableCell,
  TableRow,
  TextField,
  CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import { getEmployees, getSalaryHeads } from "../services/api";

export default function PayrollRow({ row, onChange, onDelete, disableDelete }) {
  const [allEmployees, setAllEmployees] = useState([]);
  const [allSalaryHeads, setAllSalaryHeads] = useState([]);
  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingHead, setLoadingHead] = useState(false);
  const [empInput, setEmpInput] = useState("");
  const [headInput, setHeadInput] = useState("");

  useEffect(() => {
    setLoadingEmp(true);
    getEmployees()
      .then(setAllEmployees)
      .finally(() => setLoadingEmp(false));
  }, []);

  useEffect(() => {
    setLoadingHead(true);
    getSalaryHeads()
      .then(setAllSalaryHeads)
      .finally(() => setLoadingHead(false));
  }, []);

  const employeeLabel = useMemo(
    () => (opt) => (opt ? `${opt.employee_name} (${opt.employee_code})` : ""),
    []
  );

  const salaryHeadLabel = useMemo(
    () => (opt) => (opt ? opt.salary_head : ""),
    []
  );

  const filteredEmployees = useMemo(() => {
    const q = empInput.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter(
      (e) =>
        e.employee_name.toLowerCase().includes(q) ||
        e.employee_code.toLowerCase().includes(q)
    );
  }, [allEmployees, empInput]);

  const filteredSalaryHeads = useMemo(() => {
    const q = headInput.trim().toLowerCase();
    if (!q) return allSalaryHeads;
    return allSalaryHeads.filter((h) => h.salary_head.toLowerCase().includes(q));
  }, [allSalaryHeads, headInput]);

  return (
    <TableRow
      hover
      sx={{
        "&:hover": {
          backgroundColor: "rgba(37, 99, 235, 0.03)"
        }
      }}
    >
      <TableCell sx={{ minWidth: 350 }}>
        <Autocomplete
          options={filteredEmployees}
          loading={loadingEmp}
          value={row.employee}
          getOptionLabel={employeeLabel}
          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
          onInputChange={(_, val) => setEmpInput(val)}
          onChange={(_, val) => onChange({ ...row, employee: val })}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search Employee"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PersonIcon 
                      sx={{ color: "text.secondary", mr: 1 }}
                      fontSize="small"
                    />
                    {params.InputProps?.startAdornment || null}
                  </>
                ),
                endAdornment: (
                  <>
                    {loadingEmp ? <CircularProgress size={16} /> : null}
                    {params.InputProps?.endAdornment || null}
                  </>
                )
              }}
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ minWidth: 300}}>
        <Autocomplete
          options={filteredSalaryHeads}
          loading={loadingHead}
          value={row.salaryHead}
          getOptionLabel={salaryHeadLabel}
          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
          onInputChange={(_, val) => setHeadInput(val)}
          onChange={(_, val) => onChange({ ...row, salaryHead: val })}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Search Salary Head"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <PaidOutlinedIcon
                      sx={{ color: "text.secondary", mr: 1 }}
                      fontSize="small"
                    />
                    {params.InputProps?.startAdornment || null}
                  </>
                ),
                endAdornment: (
                  <>
                    {loadingHead ? <CircularProgress size={16} /> : null}
                    {params.InputProps?.endAdornment || null}
                  </>
                )
              }}
            />
          )}
        />
      </TableCell>

      <TableCell sx={{ minWidth: 160 }}>
        <TextField
          type="number"
          placeholder="Amount"
          value={row.amount ?? ""}
          onChange={(e) =>
            onChange({
              ...row,
              amount: e.target.value === "" ? "" : Number(e.target.value)
            })
          }
          inputProps={{ min: 0, step: "0.01" }}
        />
      </TableCell>

      <TableCell align="center" sx={{ minWidth: 80 }}>
        <IconButton color="error" onClick={onDelete} disabled={disableDelete}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
