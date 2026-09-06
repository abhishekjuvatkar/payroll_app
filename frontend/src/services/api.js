
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let _cachedEmployees = null;
let _cachedSalaryHeads = null;

export const clearMasterDataCache = () => {
  _cachedEmployees = null;
  _cachedSalaryHeads = null;
};

export const getEmployees = async (forceRefresh = false) => {
  if (_cachedEmployees && !forceRefresh) {
    return _cachedEmployees;
  }
  const res = await api.get("/employees");
  _cachedEmployees = res.data;
  return _cachedEmployees;
};

export const getSalaryHeads = async (forceRefresh = false) => {
  if (_cachedSalaryHeads && !forceRefresh) {
    return _cachedSalaryHeads;
  }
  const res = await api.get("/salary-heads");
  _cachedSalaryHeads = res.data;
  return _cachedSalaryHeads;
};

export const addSalaryHead = async (salaryHeadName) => {
  const res = await api.post("/add-salary-heads", {
    salary_head: salaryHeadName
  });
  _cachedSalaryHeads = null;
  return res.data;
};

export const savePayrollEntries = async (month, year, entries) => {
  const payload = {
    month: Number(month),
    year: Number(year),
    entries: entries.map((row) => ({
      employee_id: row.employee?.id ?? null,
      salary_head_id: row.salaryHead?.id ?? null,
      actual_value: row.amount,
      remarks: row.remarks ?? ""
    }))
  };

  const res = await api.post("/payroll/save", payload);
  return res.data;
};

export const fetchPayrollEntries = async (month, year) => {
  const res = await api.get("/payroll", {
    params: { month: Number(month), year: Number(year) }
  });
  return res.data;
};

export const exportPayrollExcel = async (month, year) => {
  const res = await api.get("/payroll/export", {
    params: { month: Number(month) || month, year: Number(year) || year },
    responseType: "blob"
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Payroll_${month}_${year}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportPayrollEntriesDirect = async (payload) => {
  const res = await api.post("/payroll/export-rows", payload, {
    responseType: "blob"
  });

  const filename = `Payroll_Entries_${payload.month || "Current"}_${payload.year || 2026}.xlsx`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// -----------------------------
// Salary Comparison Module APIs
// -----------------------------

export const compareSalaryFiles = async (formData) => {
  const res = await api.post("/salary-comparison/compare", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return res.data;
};

export const exportSalaryComparisonExcel = async (comparisonData) => {
  const res = await api.post("/salary-comparison/export", comparisonData, {
    responseType: "blob"
  });

  const months = comparisonData?.months || ["Report"];
  const filename = `Salary_Comparison_${months.join("_vs_").replace(/\s+/g, "_")}.xlsx`;

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getSampleComparisonData = async (month, year) => {
  const res = await api.get("/salary-comparison/sample", {
    params: { month: Number(month) || 6, year: Number(year) || 2026 }
  });
  return res.data;
};

export const downloadSampleExcelFile = async (monthIndex, month, year) => {
  const res = await api.get(`/salary-comparison/sample-file/${monthIndex}`, {
    params: { month: Number(month) || 6, year: Number(year) || 2026 },
    responseType: "blob"
  });

  const filename = `Salary_Sample_Month_${monthIndex + 1}.xlsx`;
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reconcileSamarthFile = async (formData) => {
  const res = await api.post("/salary-comparison/reconcile-samarth", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const compareCurrentVsSamarth = async (formData) => {
  const res = await api.post("/salary-comparison/compare-current-vs-samarth", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const getSampleCurrentVsSamarthData = async () => {
  const res = await api.get("/salary-comparison/sample-current-vs-samarth");
  return res.data;
};

export const exportCurrentVsSamarthExcel = async (comparisonData) => {
  const res = await api.post("/salary-comparison/export-current-vs-samarth", comparisonData, {
    responseType: "blob"
  });

  const filename = "Current_Month_vs_Samarth_Salary_Comparison.xlsx";
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportOneTimeEntriesExcel = async (comparisonData) => {
  const res = await api.post("/salary-comparison/export-one-time-entries", comparisonData, {
    responseType: "blob"
  });

  const filename = "One_Time_Payroll_Entries_Adjustments.xlsx";
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const syncPayrollFromComparison = async (payload) => {
  const res = await api.post("/payroll/sync-from-comparison", payload);
  return res.data;
};

export const deleteAllPayrollEntries = async (month, year) => {
  const res = await api.delete(`/payroll/delete-all?month=${month}&year=${year}`);
  return res.data;
};

export const uploadEmployeesExcel = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/employees/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
};

export const downloadEmployeeTemplate = async () => {
  const res = await api.get("/employees/template", {
    responseType: "blob"
  });
  const filename = "Employee_Master_Template.xlsx";
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const exportEmployeesExcel = async () => {
  const res = await api.get("/employees/export", {
    responseType: "blob"
  });
  const filename = "All_Employees_Master.xlsx";
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const sanitizeEmployeeCodes = async () => {
  const res = await api.post("/employees/sanitize-codes");
  return res.data;
};

export const updateEmployee = async (empId, data) => {
  const res = await api.put(`/employees/${empId}`, data);
  return res.data;
};

export default api;