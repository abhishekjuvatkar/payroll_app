
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

export const getEmployees = async () => {
  const res = await api.get("/employees");
  return res.data;
};

export const getSalaryHeads = async () => {
  const res = await api.get("/salary-heads");
  return res.data;
};


export const addSalaryHead = async (salaryHeadName) => {
  const res = await api.post("/add-salary-heads", {
    salary_head: salaryHeadName
  });
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
    params: { month: Number(month), year: Number(year) },
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

export default api;