import re
import io
from typing import Dict, List, Any, Optional, Tuple, Set
import openpyxl

# Category keywords for auto-detection
CATEGORY_KEYWORDS = {
    "faulty_staff": ["faulty", "faultystaff", "faulty_staff", "faculty", "facultystaff", "faculty_staff", "faculty staff", "faulty staff", "teaching"],
    "staff": ["staff", "regular_staff", "regular staff", "non_faculty", "non-faculty", "non_teaching", "non-teaching"],
    "contractual_staff": ["contract", "contractual", "contractualstaff", "contractual_staff", "contract staff", "contractual staff", "outsourced", "temporary"]
}

# Standard Category Display Names
CATEGORY_NAMES = {
    "faulty_staff": "Faulty Staff",
    "staff": "Staff",
    "contractual_staff": "Contractual Staff"
}

# Metadata columns to EXCLUDE from salary heads (Personal info, workflow, system identifiers)
METADATA_COLUMNS = {
    "S_NO.", "S NO", "SL. NO.", "SL NO", "SL.NO.", "SL NO.", "SR. NO.", "SR NO", "S.NO.", "S NO", "NO", "INDEX",
    "ID", "EMPLOYEE ID", "EMP ID", "EMPID", "NAME", "EMPLOYEE NAME", "PARTICULARS", "NAME OF EMPLOYEE", "EMPLOYEE_NAME",
    "GROUP", "REPORTING OU", "DEPARTMENT", "DESIGNATION", "CATEGORY", "EMPLOYEE TYPE", "EMPLOYEE NATURE",
    "GUARDIAN NAME", "DATE OF BIRTH", "DOB", "DATE OF JOINING", "DOJ", "DATE OF SUPERANNUATION", "DATE OF RETIREMENT",
    "DATE OF NEXT INCREMENT", "PAY MATRIX CELL", "PAY COMMISSION", "LEVEL", "LEDGER NO.", "PERSONAL EMAIL", "EMAIL",
    "BANK NAME", "IFSC CODE", "IFSC", "BANK ACCOUNT NO", "ACCOUNT NO", "PFMS ID", "PAN CARD NO", "PAN",
    "PF SUBSCRIPTION", "PF NUMBER", "FINANCIAL YEAR", "YEAR", "MONTH", "TOTAL DAYS", "SALARY MODE",
    "CREATED BY", "VERIFIED BY", "FINALIZED BY", "APPROVED BY", "GENERATED REMARKS", "VERIFIED REMARKS",
    "UN-VERIFIED REMARKS", "FINALIZED REMARKS", "UN-FINALIZED REMARKS", "APPROVED REMARKS", "CREATED DATE",
    "VERIFIED DATE", "FINALIZED DATE", "APPROVED DATE", "REMARKS"
}

# Known totals and structural columns
TOTAL_COLUMNS = {
    "TOTAL EARNINGS", "TOTAL DEDUCTIONS", "NET AMOUNT", "NET PAY", "GROSS", "GROSS SALARY",
    "GROSS WITH EMPLOYER", "GROSS (WITH EMPLOYER)", "DEDUCTIONS", "DEDUCTION WITH EMPLOYER",
    "DEDUCTIONS (WITH EMPLOYER)"
}

# Canonical Mapping Table: Maps various historical & Salary Generated names to unified (canonical_key, display_name)
CANONICAL_HEAD_MAP: Dict[str, Tuple[str, str]] = {
    # Earnings
    "BASIC PAY": ("BASIC", "Basic Pay"),
    "BASIC": ("BASIC", "Basic Pay"),
    "DEARNESS ALLOWANCE": ("DA", "Dearness Allowance (DA)"),
    "DEARNESS ALLOWANCE (DA)": ("DA", "Dearness Allowance (DA)"),
    "DA": ("DA", "Dearness Allowance (DA)"),
    "HOUSE RENT ALLOWANCE": ("HRA", "House Rent Allowance (HRA)"),
    "HOUSE RENT ALLOWANCE (HRA)": ("HRA", "House Rent Allowance (HRA)"),
    "HRA": ("HRA", "House Rent Allowance (HRA)"),
    "TRANSPORT ALLOWANCE": ("TA", "Transport Allowance (TA)"),
    "TRANSPORT ALLOWANCE (TA)": ("TA", "Transport Allowance (TA)"),
    "TPTA": ("TA", "Transport Allowance (TA)"),
    "DA ON TPTA": ("DA_ON_TA", "DA on TA"),
    "DA ON TA": ("DA_ON_TA", "DA on TA"),
    "DEAN ALLOWANCE": ("DEAN_ALLOWANCE", "Dean Allowance"),
    "WARDEN ALLOWANCE": ("WARDEN_ALLOWANCE", "Warden Allowance"),
    "LEAVE ENCASHMENT": ("LEAVE_ENCASHMENT", "Leave Encashment"),
    "ARREARS ON SALARY": ("ARREARS_SALARY", "Arrears on Salary"),
    "ARREARS": ("ARREARS_SALARY", "Arrears on Salary"),
    "CHILDREN EDUCATION ALLOWANCE": ("CEA", "Children Education Allowance"),
    "INCOME FROM CONSULTANCY PROJECT": ("CONSULTANCY", "Income from Consultancy Project"),
    "HIGHER EDUCATION INCENTIVE": ("HIGHER_EDU_INCENTIVE", "Higher Education Incentive"),
    "MOBILE CHARGE ALLOWANCE": ("MOBILE_ALLOWANCE", "Mobile Charge Allowance"),
    "OTHER EARNINGS": ("OTHER_EARNINGS", "Other Earnings"),
    
    # Deductions
    "TAX DED. AT SOURCE": ("INCOME_TAX", "Income Tax (TDS)"),
    "INCOME TAX": ("INCOME_TAX", "Income Tax (TDS)"),
    "TDS": ("INCOME_TAX", "Income Tax (TDS)"),
    "NATIONAL PENSION SCHEME": ("NPS", "National Pension Scheme (NPS)"),
    "NATIONAL PENSION SCHEME (NPS)": ("NPS", "National Pension Scheme (NPS)"),
    "NPS": ("NPS", "National Pension Scheme (NPS)"),
    "PROFESSIONAL TAX": ("PROFESSIONAL_TAX", "Professional Tax"),
    "PTAX": ("PROFESSIONAL_TAX", "Professional Tax"),
    "LICENSE FEE": ("LICENSE_FEE", "License Fee"),
    "ELECTRICITY CHRGS": ("ELECTRICITY_CHARGES", "Electricity Charges"),
    "ELECTRICITY CHARGES": ("ELECTRICITY_CHARGES", "Electricity Charges"),
    "WATER CHARGES": ("WATER_CHARGES", "Water Charge"),
    "WATER CHARGE": ("WATER_CHARGES", "Water Charge"),
    "CCTI": ("CCTI", "CCTI"),
    "IIT DH CLUB SUBSCRIPTION": ("CLUB_SUBSCRIPTION", "IIT DH Club Subscription"),
    "CLUB": ("CLUB_SUBSCRIPTION", "IIT DH Club Subscription"),
    "ELECTRICITY FIXED CHARGES": ("ELECTRICITY_FIXED", "Electricity Fixed Charges"),
    "GPF": ("GPF", "GPF"),
    "MEDICAL RECOVERY": ("MEDICAL_RECOVERY", "Medical Recovery"),
    "RECOVERY OF OFFICE": ("RECOVERY_OFFICE", "Recovery of Office"),
    "NPS RECOVERY": ("NPS_RECOVERY", "NPS Recovery"),
    "ACCOMMODATION CHARGES": ("ACCOMMODATION_CHARGES", "Accommodation Charges"),
    "OTHER DEDUCTIONS": ("OTHER_DEDUCTIONS", "Other Deductions"),
    
    # Totals
    "TOTAL EARNINGS": ("TOTAL_EARNINGS", "Gross / Total Earnings"),
    "GROSS": ("TOTAL_EARNINGS", "Gross / Total Earnings"),
    "GROSS SALARY": ("TOTAL_EARNINGS", "Gross / Total Earnings"),
    "GROSS WITH EMPLOYER": ("GROSS_WITH_EMPLOYER", "Gross with Employer"),
    "TOTAL DEDUCTIONS": ("TOTAL_DEDUCTIONS", "Total Deductions"),
    "DEDUCTIONS": ("TOTAL_DEDUCTIONS", "Total Deductions"),
    "DEDUCTION WITH EMPLOYER": ("DEDUCTION_WITH_EMPLOYER", "Deduction with Employer"),
    "NET AMOUNT": ("NET_PAY", "Net Pay"),
    "NET PAY": ("NET_PAY", "Net Pay"),
}

def normalize_text(val: Any) -> str:
    """Normalize string for matching."""
    if val is None:
        return ""
    s = str(val).strip()
    return re.sub(r"\s+", " ", s)

def normalize_employee_name(name: str) -> str:
    """Normalize employee name (remove title prefixes, extra whitespace, uppercase)."""
    clean = normalize_text(name)
    clean = re.sub(r"^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*", "", clean, flags=re.IGNORECASE)
    clean = re.sub(r"\s+", " ", clean).strip().upper()
    return clean

def clean_numeric_value(val: Any) -> float:
    """
    Safely clean and parse numeric salary values.
    Handles None, empty strings, '-', commas, currency symbols, and text numbers.
    Blank/null defaults to 0.0.
    """
    if val is None:
        return 0.0
    
    if isinstance(val, (int, float)):
        return float(val)
    
    s = str(val).strip()
    if not s or s == "-" or s.lower() == "nil" or s.lower() == "na" or s.lower() == "n/a" or s.lower() == "null":
        return 0.0
    
    # Remove currency symbols and commas
    s = re.sub(r"[₹$,\s]", "", s)
    
    try:
        return float(s)
    except ValueError:
        return 0.0

CATEGORY_PRIORITY = ["contractual_staff", "faulty_staff", "staff"]

def detect_category(sheet_name: str, headers: List[str]) -> str:
    """
    Detects employee category from sheet name or column structure.
    Returns: 'faulty_staff', 'staff', 'contractual_staff', or 'staff' (default).
    """
    norm_sheet = normalize_text(sheet_name).lower()
    
    # 1. Match sheet name against keywords in prioritized order
    for cat_key in CATEGORY_PRIORITY:
        keywords = CATEGORY_KEYWORDS[cat_key]
        for kw in keywords:
            if kw in norm_sheet:
                return cat_key
                
    # 2. Check header clues if sheet name is generic
    norm_headers = [normalize_text(h).upper() for h in headers]
    
    # Clues for Faulty Staff (e.g. DEAN ALLOWANCE, WARDEN ALLOWANCE, IIT DH CLUB)
    if any("DEAN ALLOWANCE" in h or "WARDEN ALLOWANCE" in h or "CLUB" in h for h in norm_headers):
        return "faulty_staff"
        
    # Clues for Contractual (e.g. ACCOMMODATION CHARGES, OTHER DEDUCTIONS, few columns)
    if any("ACCOMMODATION" in h for h in norm_headers) and not any("DEAN" in h or "WARDEN" in h for h in norm_headers):
        return "contractual_staff"
        
    # Clues for Staff (e.g. GPF, HIGHER EDUCATION INCENTIVE, MOBILE CHARGE)
    if any("GPF" in h or "MOBILE CHARGE" in h or "HIGHER EDUCATION" in h for h in norm_headers):
        return "staff"
        
    return "staff"

def is_salary_generated_report(headers: List[str]) -> bool:
    """
    Detects whether the sheet/table structure is a Salary Generated (Samarth) Report.
    Indicators: Has 'Id', 'Name', 'Gross' / 'Deduction' / 'Net Pay', and Employer Contribution fields.
    """
    upper_headers = {normalize_text(h).upper() for h in headers}
    has_id_or_name = any(k in upper_headers for k in ["ID", "EMPLOYEE ID", "PFMS ID", "NAME", "EMPLOYEE NAME"])
    has_gross_or_net = any(k in upper_headers for k in ["GROSS", "DEDUCTIONS", "NET PAY", "BASIC", "DEARNESS ALLOWANCE (DA)"])
    has_employer_contrib = any("EMPLOYER CONTRIBUTION" in h for h in upper_headers)
    
    return (has_id_or_name and has_gross_or_net) or has_employer_contrib

def map_salary_head_to_canonical(raw_name: str) -> Tuple[str, str, bool, bool]:
    """
    Maps a raw header name to:
    (canonical_key, display_name, is_total, is_employer_contribution)
    """
    upper_name = normalize_text(raw_name).upper()
    is_employer_contrib = "EMPLOYER CONTRIBUTION" in upper_name
    is_total = upper_name in TOTAL_COLUMNS or "TOTAL EARNINGS" in upper_name or "TOTAL DEDUCTIONS" in upper_name
    
    if upper_name in CANONICAL_HEAD_MAP:
        c_key, d_name = CANONICAL_HEAD_MAP[upper_name]
        return c_key, d_name, is_total, is_employer_contrib
    
    # Check if header ends with (DA), (HRA), (TA), etc.
    clean_upper = re.sub(r"\s*\([^)]*\)", "", upper_name).strip()
    if clean_upper in CANONICAL_HEAD_MAP:
        c_key, d_name = CANONICAL_HEAD_MAP[clean_upper]
        return c_key, d_name, is_total, is_employer_contrib
        
    # Default fallback: sanitize name as key
    fallback_key = re.sub(r"[^A-Z0-9_]+", "_", upper_name).strip("_")
    return fallback_key, normalize_text(raw_name), is_total, is_employer_contrib

def disambiguate_headers(raw_headers: List[Any]) -> List[Tuple[str, str, str]]:
    """
    Disambiguates duplicate headers while preserving canonical mapping and display name.
    Returns a list of (unique_key, display_name, canonical_key).
    """
    seen_counts: Dict[str, int] = {}
    result: List[Tuple[str, str, str]] = []
    
    for idx, h in enumerate(raw_headers):
        clean_name = normalize_text(h)
        if not clean_name:
            clean_name = f"Column_{idx+1}"
            
        upper_name = clean_name.upper()
        c_key, d_name, is_tot, is_emp = map_salary_head_to_canonical(clean_name)
        
        if upper_name in seen_counts:
            seen_counts[upper_name] += 1
            count = seen_counts[upper_name]
            unique_key = f"{c_key}_{count}"
            display_name = f"{d_name} ({count})"
        else:
            seen_counts[upper_name] = 1
            unique_key = c_key
            display_name = d_name
            
        result.append((unique_key, display_name, c_key))
        
    return result

def is_particulars_column(col_name: str) -> bool:
    """Check if header represents employee name/particulars."""
    norm = normalize_text(col_name).upper()
    return norm in ["PARTICULARS", "EMPLOYEE", "EMPLOYEE NAME", "NAME", "NAME OF EMPLOYEE", "EMPLOYEE_NAME"]

def is_total_or_footer_row(row_val: str) -> bool:
    """Detect if a row is a summary/total footer row rather than an employee."""
    norm = normalize_text(row_val).upper()
    total_keywords = ["TOTAL", "GRAND TOTAL", "SUB TOTAL", "SUB-TOTAL", "SUMMARY", "TOTALS", "AVERAGE"]
    return any(norm == kw or norm.startswith(kw + " ") or norm.startswith(kw + ":") for kw in total_keywords)

def parse_excel_file(file_content: bytes, file_name: str = "") -> Dict[str, Any]:
    """
    Parses an Excel workbook (supports both Category Salary Reports and Salary Generated Reports).
    Returns structured data grouped by category:
    {
       category_key: {
          "category_name": "Faulty Staff",
          "is_salary_generated": True/False,
          "detected_year": 2026,
          "detected_month": 6,
          "columns": [{"key": "BASIC", "name": "Basic Pay", "canonical_key": "BASIC", "is_total": False, "is_employer_contribution": False}],
          "employees": [
              {
                  "employee_id": "EMP123",
                  "employee_name": "Dr. Rajesh Sharma",
                  "category": "Faulty Staff",
                  "values": {"BASIC": 144200.0, ...},
                  "raw_values": {"BASIC": "1,44,200.00", ...},
                  "metadata": {"Id": "EMP123", "Designation": "Professor", ...}
              }
          ]
       }
    }
    """
    wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
    categories_data: Dict[str, Any] = {}
    
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
            
        # Find header row
        header_row_idx = -1
        raw_headers = []
        
        for idx, row in enumerate(rows):
            non_empty_cells = [c for c in row if c is not None and str(c).strip() != ""]
            if len(non_empty_cells) >= 2:
                # Check if any cell matches standard header keywords
                if any(is_particulars_column(str(c)) or "SL" in str(c).upper() or "BASIC" in str(c).upper() or "GROSS" in str(c).upper() for c in non_empty_cells):
                    header_row_idx = idx
                    raw_headers = [c for c in row]
                    break
                    
        if header_row_idx == -1:
            header_row_idx = 0
            raw_headers = list(rows[0])
            
        header_strings = [normalize_text(h) for h in raw_headers]
        is_salary_gen = is_salary_generated_report(header_strings)
        
        # Identify key column indices
        id_col_idx = -1
        name_col_idx = -1
        category_col_idx = -1
        year_col_idx = -1
        month_col_idx = -1
        
        for c_idx, h in enumerate(header_strings):
            u_h = h.upper()
            if u_h in ["ID", "EMPLOYEE ID", "EMP ID", "PFMS ID"]:
                id_col_idx = c_idx
            elif is_particulars_column(h):
                name_col_idx = c_idx
            elif u_h in ["CATEGORY", "EMPLOYEE CATEGORY", "GROUP"]:
                category_col_idx = c_idx
            elif u_h in ["YEAR"]:
                year_col_idx = c_idx
            elif u_h in ["MONTH"]:
                month_col_idx = c_idx
                
        if name_col_idx == -1:
            # Fallback to id column or first column with strings
            name_col_idx = id_col_idx if id_col_idx != -1 else 1 if len(header_strings) > 1 else 0
            
        # Disambiguate value columns
        disambiguated = disambiguate_headers(raw_headers)
        
        # Determine value columns (excluding metadata)
        val_columns = []
        for col_idx, (ukey, dname, ckey) in enumerate(disambiguated):
            upper_raw = normalize_text(raw_headers[col_idx] if col_idx < len(raw_headers) else "").upper()
            
            # Skip metadata columns from salary calculation
            if upper_raw in METADATA_COLUMNS:
                continue
                
            c_key, display_name, is_total, is_employer_contrib = map_salary_head_to_canonical(dname)
            val_columns.append({
                "index": col_idx,
                "key": ukey,
                "name": display_name,
                "canonical_key": c_key,
                "is_total": is_total,
                "is_employer_contribution": is_employer_contrib
            })
            
        # Parse data rows
        detected_year = None
        detected_month = None
        
        # Temporary bucket by category if Salary Generated file contains multiple categories in one sheet
        sheet_category_buckets: Dict[str, List[Dict[str, Any]]] = {}
        
        for r_idx in range(header_row_idx + 1, len(rows)):
            row = rows[r_idx]
            if not row or all(c is None or str(c).strip() == "" for c in row):
                continue
                
            raw_name = row[name_col_idx] if name_col_idx < len(row) else None
            emp_display_name = normalize_text(raw_name)
            if not emp_display_name or is_total_or_footer_row(emp_display_name):
                continue
                
            raw_id = row[id_col_idx] if id_col_idx != -1 and id_col_idx < len(row) else None
            emp_id_str = normalize_text(raw_id) if raw_id else normalize_employee_name(emp_display_name)
            
            # Check period in row
            if year_col_idx != -1 and year_col_idx < len(row) and row[year_col_idx]:
                try:
                    detected_year = int(clean_numeric_value(row[year_col_idx]))
                except Exception:
                    pass
            if month_col_idx != -1 and month_col_idx < len(row) and row[month_col_idx]:
                try:
                    detected_month = int(clean_numeric_value(row[month_col_idx]))
                except Exception:
                    pass
                    
            # Determine row category
            row_cat_raw = row[category_col_idx] if category_col_idx != -1 and category_col_idx < len(row) else sheet_name
            row_cat_key = detect_category(str(row_cat_raw or sheet_name), [d[1] for d in disambiguated])
            
            # Extract values
            values = {}
            raw_values = {}
            for col_info in val_columns:
                c_idx = col_info["index"]
                cell_val = row[c_idx] if c_idx < len(row) else None
                num_val = clean_numeric_value(cell_val)
                values[col_info["key"]] = num_val
                raw_values[col_info["key"]] = str(cell_val).strip() if cell_val is not None else ""
                
            emp_record = {
                "employee_id": emp_id_str or emp_display_name,
                "employee_name": emp_display_name,
                "normalized_name": normalize_employee_name(emp_display_name),
                "category": CATEGORY_NAMES.get(row_cat_key, "Staff"),
                "category_key": row_cat_key,
                "values": values,
                "raw_values": raw_values
            }
            
            if row_cat_key not in sheet_category_buckets:
                sheet_category_buckets[row_cat_key] = []
            sheet_category_buckets[row_cat_key].append(emp_record)
            
        # Put into categories_data
        for cat_key, emp_records in sheet_category_buckets.items():
            cat_display_name = CATEGORY_NAMES.get(cat_key, "Staff")
            if cat_key not in categories_data:
                categories_data[cat_key] = {
                    "category_key": cat_key,
                    "category_name": cat_display_name,
                    "is_salary_generated": is_salary_gen,
                    "detected_year": detected_year,
                    "detected_month": detected_month,
                    "columns": [{k: v for k, v in col.items() if k != "index"} for col in val_columns],
                    "employees": emp_records
                }
            else:
                categories_data[cat_key]["employees"].extend(emp_records)
                existing_col_keys = {c["key"] for c in categories_data[cat_key]["columns"]}
                for col in val_columns:
                    if col["key"] not in existing_col_keys:
                        categories_data[cat_key]["columns"].append({k: v for k, v in col.items() if k != "index"})
                        existing_col_keys.add(col["key"])
                        
    return categories_data
