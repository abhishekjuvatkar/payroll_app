from typing import Optional, Dict, Any, List, Set
from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.models import Employee, SalaryHead, PayrollEntry


# ---------------- Employees ---------------- #

def is_bad_employee_code(code: Optional[str]) -> bool:
    """
    Returns True if the code is a Samarth National Portal UID (e.g. VATLHY00090648, VAKADH00009432, VAININ00379986)
    or an uncleaned full name rather than an authentic Institute Employee Code.
    """
    if not code:
        return True
    c = str(code).strip()
    if not c or c.upper() == "NONE" or c.upper() == "NAN":
        return True
    # Samarth national portal UID (starts with VA and length >= 10, or contains letters+000)
    if (c.upper().startswith("VA") and len(c) >= 10) or "0000" in c or "0009" in c:
        return True
    # If code is actually a person name with spaces
    if " " in c or len(c) > 15:
        return True
    return False


def generate_clean_employee_code(
    emp_name: str,
    emp_type: Optional[str],
    nature: Optional[str],
    ou: Optional[str],
    desig: Optional[str],
    doj: Optional[str],
    existing_codes: set
) -> str:
    """
    Generates standard, official IIT Dharwad style employee codes (e.g. AS1801, TS2403, EE2001, CS2301, SC2602, VF2301).
    """
    import re
    from app.comparison.excel_parser import normalize_employee_name

    # Check official master mapping first
    try:
        from app.sync_official_master import RAW_DATA
        norm_target = normalize_employee_name(emp_name)
        for line in RAW_DATA.strip().split("\n")[1:]:
            parts = [p.strip() for p in line.split("\t")]
            if len(parts) >= 3:
                c_id = parts[0]
                n_parts = [parts[2], parts[3] if len(parts)>3 else "", parts[4] if len(parts)>4 else ""]
                f_name = " ".join([p for p in n_parts if p])
                if normalize_employee_name(f_name) == norm_target:
                    return c_id
    except Exception:
        pass

    prefix = "EM"
    t = (emp_type or "").lower()
    n = (nature or "").lower()
    o = (ou or "").lower()
    d = (desig or "").lower()

    if "visiting" in d or "visiting" in t or "visiting" in n:
        prefix = "VF"
    elif "adhoc" in t or "ad-hoc" in t or "adjunct" in d:
        prefix = "AF"
    elif "contract" in n or "contract" in t or "temporary" in n:
        prefix = "SC"
    elif "technical" in d or "technical" in t or "technician" in d or "computer" in o:
        prefix = "TS"
    elif "teaching" in t or "professor" in d or "faculty" in t or "dr." in (emp_name or "").lower() or "prof." in (emp_name or "").lower():
        if "computer" in o or "cse" in o:
            prefix = "CS"
        elif "electrical" in o or "eece" in o or "electronics" in o:
            prefix = "EE"
        elif "mechanical" in o or "me" in o:
            prefix = "ME"
        elif "civil" in o:
            prefix = "CE"
        elif "chemical" in o:
            prefix = "CH"
        elif "physics" in o:
            prefix = "PH"
        elif "chemistry" in o:
            prefix = "CY"
        elif "mathematics" in o or "math" in o:
            prefix = "MA"
        elif "humanities" in o or "hss" in o:
            prefix = "HS"
        elif "bioscience" in o or "bio" in o:
            prefix = "BS"
        else:
            prefix = "FA"
    elif "non-teaching" in t or "admin" in o or "assistant" in d or "registrar" in d or "superintendent" in d or "office" in o:
        prefix = "AS"
    else:
        prefix = "ST"

    # Year from DOJ
    year_str = "24"
    if doj:
        m = re.search(r'(20\d\d|19\d\d)', str(doj))
        if m:
            year_str = m.group(1)[-2:]
        else:
            m2 = re.search(r'[-/](\d{2})[-/]?$', str(doj))
            if m2:
                year_str = m2.group(1)

    base = f"{prefix}{year_str}"
    for seq in range(1, 100):
        code = f"{base}{seq:02d}"
        if code.upper() not in existing_codes:
            existing_codes.add(code.upper())
            return code

    for seq in range(101, 999):
        code = f"{base}{seq:03d}"
        if code.upper() not in existing_codes:
            existing_codes.add(code.upper())
            return code

    return f"{prefix}{year_str}99"


def sanitize_all_employee_codes(db: Session) -> Dict[str, Any]:
    """
    Scans database and automatically replaces invalid/Samarth system UIDs (VATLHY00090648, etc.) or raw name codes
    with standardized institute employee codes (AS..., TS..., EE..., CS..., SC..., VF...).
    Guarantees uniqueness across all employees.
    """
    emps = db.query(Employee).order_by(Employee.id).all()
    assigned_codes = {e.employee_code.strip().upper() for e in emps if e.employee_code}
    
    updated_count = 0
    updates = []
    
    for emp in emps:
        if is_bad_employee_code(emp.employee_code):
            if emp.employee_code:
                assigned_codes.discard(emp.employee_code.strip().upper())

            new_code = generate_clean_employee_code(
                emp_name=emp.employee_name,
                emp_type=emp.employee_type,
                nature=emp.nature_of_employment,
                ou=emp.organization_unit,
                desig=emp.designation,
                doj=emp.date_of_joining,
                existing_codes=assigned_codes
            )
            old_code = emp.employee_code
            emp.employee_code = new_code
            assigned_codes.add(new_code.upper())
            updates.append({"id": emp.id, "name": emp.employee_name, "old_code": old_code, "new_code": new_code})
            updated_count += 1
            
    if updated_count > 0:
        db.commit()
        
    return {
        "total_checked": len(emps),
        "total_updated": updated_count,
        "message": f"Successfully sanitized and formatted {updated_count} employee code(s).",
        "updates": updates
    }


def update_employee(db: Session, emp_id: int, data: Dict[str, Any]) -> Optional[Employee]:
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        return None
    for k, v in data.items():
        if hasattr(emp, k) and k != "id":
            setattr(emp, k, v)
    db.commit()
    db.refresh(emp)
    return emp


def get_employees(db: Session):
    return (
        db.query(Employee)
        .order_by(Employee.employee_name)
        .all()
    )


def upload_employees_from_excel(db: Session, file_content: bytes, filename: str = "employees.xlsx"):
    """
    Parses and imports Employee Master records from Excel (.xlsx) or CSV with 40+ comprehensive fields.
    Upserts records matching employee_code or employee_name. Sanitizes Samarth UIDs automatically.
    """
    import io
    import openpyxl
    import csv

    rows_data = []

    if filename.lower().endswith(".csv"):
        text = file_content.decode("utf-8", errors="ignore")
        reader = csv.reader(io.StringIO(text))
        rows_data = list(reader)
    else:
        wb = openpyxl.load_workbook(io.BytesIO(file_content), data_only=True)
        ws = wb.active
        rows_data = list(ws.iter_rows(values_only=True))

    if not rows_data or len(rows_data) < 2:
        return {"total_processed": 0, "created": 0, "updated": 0, "message": "No data rows found in file."}

    # Header normalization
    raw_headers = [str(c or "").strip() for c in rows_data[0]]
    norm_headers = [h.lower().replace(" ", "_").replace("-", "_").replace(".", "") for h in raw_headers]

    # Map column index to standard field (with priority)
    col_map = {}
    for idx, h in enumerate(norm_headers):
        if h in ["institute_id", "institute_emp_id", "official_emp_id", "employee_code", "emp_code", "short_code", "payroll_code"]:
            col_map["employee_code"] = idx
        elif "employee_code" not in col_map and h in ["employee_id", "empid", "emp_id", "id", "code"]:
            col_map["employee_code"] = idx
        elif h in ["title", "salutation", "prefix"]:
            col_map["title"] = idx
        elif h in ["first_name", "firstname", "fname"]:
            col_map["first_name"] = idx
        elif h in ["middle_name", "middlename", "mname"]:
            col_map["middle_name"] = idx
        elif h in ["last_name", "lastname", "lname", "surname"]:
            col_map["last_name"] = idx
        elif h in ["employee_name", "name", "full_name", "fullname"]:
            col_map["employee_name"] = idx
        elif h in ["name_in_hindi", "hindi_name", "name_hindi"]:
            col_map["name_in_hindi"] = idx
        elif h in ["employee_type", "emp_type", "type"]:
            col_map["employee_type"] = idx
        elif h in ["nature_of_employment", "employment_nature", "nature"]:
            col_map["nature_of_employment"] = idx
        elif h in ["organization_unit", "org_unit", "ou", "department", "dept"]:
            col_map["organization_unit"] = idx
        elif h in ["designation", "desig", "post"]:
            col_map["designation"] = idx
        elif h in ["sanctioned_ou", "sanctioned_org_unit"]:
            col_map["sanctioned_ou"] = idx
        elif h in ["sanctioned_designation", "sanctioned_post"]:
            col_map["sanctioned_designation"] = idx
        elif h in ["guardian_name", "father_name", "father_or_guardian_name"]:
            col_map["guardian_name"] = idx
        elif h in ["mother_name"]:
            col_map["mother_name"] = idx
        elif h in ["gender", "sex"]:
            col_map["gender"] = idx
        elif h in ["appointed_category"]:
            col_map["appointed_category"] = idx
        elif h in ["social_category", "category"]:
            col_map["social_category"] = idx
        elif h in ["is_pwd", "pwd", "handicapped"]:
            col_map["is_pwd"] = idx
        elif h in ["blood_group", "bloodgroup"]:
            col_map["blood_group"] = idx
        elif h in ["date_of_birth", "dob", "birth_date"]:
            col_map["date_of_birth"] = idx
        elif h in ["date_of_joining", "doj", "joining_date"]:
            col_map["date_of_joining"] = idx
        elif h in ["date_of_superannuation", "dos", "retirement_date"]:
            col_map["date_of_superannuation"] = idx
        elif h in ["mobile_number", "mobile", "phone", "phone_number"]:
            col_map["mobile_number"] = idx
        elif h in ["office_phone_number", "office_phone", "landline"]:
            col_map["office_phone_number"] = idx
        elif h in ["alternate_mobile_no", "alt_mobile", "alt_phone"]:
            col_map["alternate_mobile_no"] = idx
        elif h in ["official_email", "email", "office_email"]:
            col_map["official_email"] = idx
        elif h in ["personal_email", "private_email"]:
            col_map["personal_email"] = idx
        elif h in ["residential_address", "res_address", "address_residential"]:
            col_map["residential_address"] = idx
        elif h in ["residential_state"]:
            col_map["residential_state"] = idx
        elif h in ["residential_city"]:
            col_map["residential_city"] = idx
        elif h in ["residential_pincode", "residential_pin"]:
            col_map["residential_pincode"] = idx
        elif h in ["residential_phone_number"]:
            col_map["residential_phone_number"] = idx
        elif h in ["permanent_address", "perm_address", "address_permanent"]:
            col_map["permanent_address"] = idx
        elif h in ["permanent_state"]:
            col_map["permanent_state"] = idx
        elif h in ["permanent_city"]:
            col_map["permanent_city"] = idx
        elif h in ["permanent_pincode", "permanent_pin"]:
            col_map["permanent_pincode"] = idx
        elif h in ["hometown"]:
            col_map["hometown"] = idx
        elif h in ["hometown_state"]:
            col_map["hometown_state"] = idx
        elif h in ["hometown_city"]:
            col_map["hometown_city"] = idx
        elif h in ["hometown_pincode", "hometown_pin"]:
            col_map["hometown_pincode"] = idx
        elif h in ["status", "emp_status"]:
            col_map["status"] = idx

    all_current_emps = db.query(Employee).all()
    existing_by_code = {e.employee_code.strip().upper(): e for e in all_current_emps}
    existing_by_name = {e.employee_name.strip().upper(): e for e in all_current_emps}
    existing_clean_codes = {e.employee_code.strip().upper() for e in all_current_emps if not is_bad_employee_code(e.employee_code)}

    created_count = 0
    updated_count = 0

    def clean_val(row, field):
        idx = col_map.get(field)
        if idx is not None and idx < len(row):
            val = row[idx]
            if val is not None:
                s = str(val).strip()
                if s and s.lower() != "none" and s.lower() != "nan":
                    return s
        return None

    for row in rows_data[1:]:
        if not row or all(c is None or str(c).strip() == "" for c in row):
            continue

        raw_code = clean_val(row, "employee_code")
        title = clean_val(row, "title")
        first_name = clean_val(row, "first_name")
        middle_name = clean_val(row, "middle_name")
        last_name = clean_val(row, "last_name")
        explicit_name = clean_val(row, "employee_name")

        # Build clean full employee name
        name_parts = [p for p in [first_name, middle_name, last_name] if p]
        if name_parts:
            full_name = " ".join(" ".join(name_parts).split())
        elif explicit_name:
            full_name = explicit_name
        else:
            full_name = raw_code or "Employee"

        if not raw_code and not full_name:
            continue

        # Find existing by code or by name
        emp = (
            (existing_by_code.get(raw_code.upper()) if raw_code else None) or
            existing_by_name.get(full_name.upper())
        )

        emp_type = clean_val(row, "employee_type")
        nature = clean_val(row, "nature_of_employment")
        ou = clean_val(row, "organization_unit")
        desig = clean_val(row, "designation")
        doj = clean_val(row, "date_of_joining")

        # Determine clean employee code
        if raw_code and not is_bad_employee_code(raw_code):
            final_code = raw_code
        elif emp and not is_bad_employee_code(emp.employee_code):
            final_code = emp.employee_code
        else:
            final_code = generate_clean_employee_code(
                emp_name=full_name,
                emp_type=emp_type,
                nature=nature,
                ou=ou,
                desig=desig,
                doj=doj,
                existing_codes=existing_clean_codes
            )

        is_new = False
        if not emp:
            emp = Employee(employee_code=final_code, employee_name=full_name)
            db.add(emp)
            db.flush()
            existing_by_code[final_code.upper()] = emp
            existing_by_name[full_name.upper()] = emp
            created_count += 1
            is_new = True
        else:
            updated_count += 1

        # Populate all fields
        emp.employee_code = final_code
        if full_name and full_name != "Employee":
            emp.employee_name = full_name
        emp.title = title
        emp.first_name = first_name
        emp.middle_name = middle_name
        emp.last_name = last_name
        emp.name_in_hindi = clean_val(row, "name_in_hindi")
        emp.employee_type = emp_type
        emp.nature_of_employment = nature
        emp.organization_unit = ou
        emp.designation = desig
        emp.sanctioned_ou = clean_val(row, "sanctioned_ou")
        emp.sanctioned_designation = clean_val(row, "sanctioned_designation")
        emp.guardian_name = clean_val(row, "guardian_name")
        emp.mother_name = clean_val(row, "mother_name")
        emp.gender = clean_val(row, "gender")
        emp.appointed_category = clean_val(row, "appointed_category")
        emp.social_category = clean_val(row, "social_category")
        emp.is_pwd = clean_val(row, "is_pwd")
        emp.blood_group = clean_val(row, "blood_group")
        emp.date_of_birth = clean_val(row, "date_of_birth")
        emp.date_of_joining = doj
        emp.date_of_superannuation = clean_val(row, "date_of_superannuation")
        emp.mobile_number = clean_val(row, "mobile_number")
        emp.office_phone_number = clean_val(row, "office_phone_number")
        emp.alternate_mobile_no = clean_val(row, "alternate_mobile_no")
        emp.official_email = clean_val(row, "official_email")
        emp.personal_email = clean_val(row, "personal_email")
        emp.residential_address = clean_val(row, "residential_address")
        emp.residential_state = clean_val(row, "residential_state")
        emp.residential_city = clean_val(row, "residential_city")
        emp.residential_pincode = clean_val(row, "residential_pincode")
        emp.residential_phone_number = clean_val(row, "residential_phone_number")
        emp.permanent_address = clean_val(row, "permanent_address")
        emp.permanent_state = clean_val(row, "permanent_state")
        emp.permanent_city = clean_val(row, "permanent_city")
        emp.permanent_pincode = clean_val(row, "permanent_pincode")
        emp.hometown = clean_val(row, "hometown")
        emp.hometown_state = clean_val(row, "hometown_state")
        emp.hometown_city = clean_val(row, "hometown_city")
        emp.hometown_pincode = clean_val(row, "hometown_pincode")
        emp.status = clean_val(row, "status") or "Active"

    db.commit()

    return {
        "total_processed": created_count + updated_count,
        "created": created_count,
        "updated": updated_count,
        "message": f"Successfully processed {created_count + updated_count} employees ({created_count} added, {updated_count} updated)."
    }



def generate_employee_template_excel():
    """
    Generates a formatted blank Excel template with all 41 employee master columns and a sample row.
    """
    import io
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Employee_Master"

    headers = [
        "employee_id", "title", "first_name", "middle_name", "last_name", "name_in_hindi",
        "employee_type", "nature_of_employment", "organization_unit", "designation",
        "sanctioned_ou", "sanctioned_designation", "guardian_name", "mother_name", "gender",
        "appointed_category", "social_category", "is_pwd", "blood_group", "date_of_birth",
        "date_of_joining", "date_of_superannuation", "mobile_number", "office_phone_number",
        "alternate_mobile_no", "official_email", "personal_email", "residential_address",
        "residential_state", "residential_city", "residential_pincode", "residential_phone_number",
        "permanent_address", "permanent_state", "permanent_city", "permanent_pincode",
        "hometown", "hometown_state", "hometown_city", "hometown_pincode", "status"
    ]

    ws.append(headers)

    # Sample row
    sample_row = [
        "AS1801", "Mr.", "Sandeep", "", "Pareek", "",
        "Non-Teaching", "Permanent", "General Administration Section", "Deputy Registrar",
        "Indian Institute of Technology Dharwad", "Deputy Registrar", "", "", "Male",
        "Unreserved", "", "No", "", "11-07-1982",
        "31-01-2024", "31-07-2042", "9829296888", "",
        "", "spareek@iitdh.ac.in", "pareek.sandeep0291@gmail.com", "",
        "", "", "", "",
        "", "", "", "",
        "", "", "", "", "Active"
    ]
    ws.append(sample_row)

    # Style header
    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    align = Alignment(horizontal="center", vertical="center")

    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = align

    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 14)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


# ---------------- Salary Heads ---------------- #

def get_salary_heads(db: Session):
    return (
        db.query(SalaryHead)
        .order_by(SalaryHead.salary_head)
        .all()
    )


# ---------------- Payroll ---------------- #

def parse_month_int(month: Any) -> int:
    try:
        return int(month)
    except Exception:
        MONTHS = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        s = str(month).strip().lower()[:3]
        return MONTHS.get(s, 1)


def get_payroll_entries(db: Session, month: Any, year: Any):
    m_int = parse_month_int(month)
    try:
        y_int = int(year)
    except Exception:
        y_int = 2026

    rows = (
        db.query(
            PayrollEntry.id,
            Employee.id.label("employee_id"),
            Employee.employee_name,
            Employee.employee_code,
            SalaryHead.id.label("salary_head_id"),
            SalaryHead.salary_head,
            PayrollEntry.actual_value,
            PayrollEntry.remarks,
            PayrollEntry.month,
            PayrollEntry.year,
        )
        .join(Employee, PayrollEntry.employee_id == Employee.id)
        .join(SalaryHead, PayrollEntry.salary_head_id == SalaryHead.id)
        .filter(
            PayrollEntry.month == m_int,
            PayrollEntry.year == y_int,
        )
        .order_by(Employee.employee_name)
        .all()
    )

    return [dict(row._mapping) for row in rows]


def save_payroll_entries(db: Session, month: Any, year: Any, entries: list):
    """
    Deletes existing records for the selected month/year and inserts latest data.
    Automatically merges duplicate employee+salary_head entries in the payload to prevent unique constraint errors.
    """
    from decimal import Decimal
    m_int = parse_month_int(month)
    y_int = int(year) if year else 2026

    db.execute(
        delete(PayrollEntry).where(
            PayrollEntry.month == m_int,
            PayrollEntry.year == y_int,
        )
    )

    entry_map = {}

    for row in entries:
        emp_id = getattr(row, "employee_id", None) or (row.get("employee_id") if isinstance(row, dict) else None)
        head_id = getattr(row, "salary_head_id", None) or (row.get("salary_head_id") if isinstance(row, dict) else None)
        raw_val = getattr(row, "actual_value", None) if hasattr(row, "actual_value") else (row.get("actual_value") if isinstance(row, dict) else 0)
        remarks = getattr(row, "remarks", "") if hasattr(row, "remarks") else (row.get("remarks", "") if isinstance(row, dict) else "")

        if not emp_id or not head_id:
            continue

        try:
            amt = Decimal(str(raw_val or 0))
        except Exception:
            amt = Decimal("0")

        key = (int(emp_id), int(head_id))
        if key in entry_map:
            existing = entry_map[key]
            existing.actual_value += amt
            if remarks:
                existing.remarks = f"{existing.remarks}; {remarks}" if existing.remarks else remarks
        else:
            payroll = PayrollEntry(
                employee_id=int(emp_id),
                salary_head_id=int(head_id),
                month=m_int,
                year=y_int,
                actual_value=amt,
                remarks=remarks or "",
            )
            entry_map[key] = payroll
            db.add(payroll)

    db.commit()
    return True


def sync_payroll_from_comparison(db: Session, month: Any, year: Any, entries: list):
    """
    1-Click sync of one-time adjustment entries from Salary Comparison into PayrollEntry database.
    Automatically finds or creates Employee and SalaryHead records if they don't exist yet.
    Merges any duplicate employee+salary_head rows to guarantee zero constraint violations.
    """
    from decimal import Decimal
    m_int = parse_month_int(month)
    y_int = int(year) if year else 2026
    
    # 1. Clear existing entries for this month/year
    db.execute(
        delete(PayrollEntry).where(
            PayrollEntry.month == m_int,
            PayrollEntry.year == y_int,
        )
    )
    
    # 2. Cache existing employees and heads
    import re
    def norm_key(name: str) -> str:
        if not name:
            return ""
        n = re.sub(r"^(dr\.|prof\.|mr\.|mrs\.|ms\.|shri|smt\.)\s+", "", name.strip(), flags=re.IGNORECASE)
        return re.sub(r"[\s\._-]+", " ", n).strip().upper()

    all_db_emps = db.query(Employee).all()
    emp_cache = {e.employee_name.strip().upper(): e for e in all_db_emps}
    emp_code_cache = {e.employee_code.strip().upper(): e for e in all_db_emps}
    emp_norm_cache = {norm_key(e.employee_name): e for e in all_db_emps}
    head_cache = {h.salary_head.strip().upper(): h for h in db.query(SalaryHead).all()}
    
    entry_map = {}

    for entry in entries:
        emp_name = (entry.get("employee_name") or "").strip()
        emp_code = (entry.get("employee_id") or entry.get("employee_code") or emp_name or "EMP").strip()
        head_name = (entry.get("salary_head") or "").strip()
        
        if not emp_name or not head_name:
            continue
            
        # Prioritize current sheet value
        raw_amt = entry.get("current_value")
        if raw_amt is None or raw_amt == "":
            raw_amt = entry.get("actual_value")
        if raw_amt is None or raw_amt == "":
            raw_amt = entry.get("adjustment_amount")
        if raw_amt is None or raw_amt == "":
            raw_amt = abs(float(entry.get("difference", 0.0)))
        
        try:
            amount = Decimal(str(raw_amt))
        except Exception:
            amount = Decimal("0")
        
        # Match with official Employee Master
        emp_match = (
            emp_cache.get(emp_name.upper()) or
            emp_norm_cache.get(norm_key(emp_name)) or
            emp_code_cache.get(emp_code.upper())
        )
        if not emp_match:
            emp_match = Employee(
                employee_code=emp_code,
                employee_name=emp_name
            )
            db.add(emp_match)
            db.flush()
            emp_cache[emp_name.upper()] = emp_match
            emp_norm_cache[norm_key(emp_name)] = emp_match
            emp_code_cache[emp_code.upper()] = emp_match
            
        # Find or create SalaryHead in DB master
        head_match = head_cache.get(head_name.upper())
        if not head_match:
            head_match = SalaryHead(salary_head=head_name)
            db.add(head_match)
            db.flush()
            head_cache[head_name.upper()] = head_match
            
        key = (emp_match.id, head_match.id)
        rem = entry.get("remarks") or f"Current sheet entry for {head_name}"

        if key in entry_map:
            existing = entry_map[key]
            existing.actual_value += amount
            if rem:
                existing.remarks = f"{existing.remarks}; {rem}" if existing.remarks else rem
        else:
            payroll = PayrollEntry(
                employee_id=emp_match.id,
                salary_head_id=head_match.id,
                month=m_int,
                year=y_int,
                actual_value=amount,
                remarks=rem
            )
            entry_map[key] = payroll
            db.add(payroll)
        
    db.commit()
    return len(entry_map)