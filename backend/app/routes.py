from fastapi import APIRouter, Depends,HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import SalaryHead
from app.schemas import (
    EmployeeResponse,
    SalaryHeadResponse,
    PayrollSaveRequest,
    SalaryHeadCreate
)

from app import crud
from app.excel import generate_excel

router = APIRouter()


# -----------------------------
# Employees
# -----------------------------
@router.get(
    "/employees",
    response_model=list[EmployeeResponse],
)
def get_employees(
    db: Session = Depends(get_db),
):
    return crud.get_employees(db)


# -----------------------------
# Salary Heads
# -----------------------------
@router.get(
    "/salary-heads",
    response_model=list[SalaryHeadResponse],
)
def get_salary_heads(
    db: Session = Depends(get_db),
):
    return crud.get_salary_heads(db)

@router.post(
    "/add-salary-heads",
    response_model=SalaryHeadResponse
)
def add_salary_head(
    data: SalaryHeadCreate,
    db: Session = Depends(get_db)
):
    salary_head = data.salary_head.strip()

    if not salary_head:
        raise HTTPException(
            status_code=400,
            detail="Salary head cannot be empty"
        )

    # Check duplicate
    existing = (
        db.query(SalaryHead)
        .filter(SalaryHead.salary_head == salary_head)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Salary head already exists"
        )

    new_salary_head = SalaryHead(
        salary_head=salary_head
    )

    db.add(new_salary_head)
    db.commit()
    db.refresh(new_salary_head)

    return new_salary_head


# -----------------------------
# Payroll Entries
# -----------------------------
@router.get("/payroll")
def get_payroll(
    month: str,
    year: int,
    db: Session = Depends(get_db),
):
    return crud.get_payroll_entries(
        db,
        month,
        year,
    )


# -----------------------------
# Save Payroll
# -----------------------------
@router.post("/payroll/save")
def save_payroll(
    request: PayrollSaveRequest,
    db: Session = Depends(get_db),
):

    crud.save_payroll_entries(
        db,
        request.month,
        request.year,
        request.entries,
    )

    return {
        "success": True,
        "message": "Payroll saved successfully."
    }


# -----------------------------
# Export Excel
# -----------------------------
@router.get("/payroll/export")
def export_excel(
    month: str,
    year: int,
    db: Session = Depends(get_db),
):
    from io import BytesIO
    from openpyxl import Workbook
    
    rows = crud.get_payroll_entries(db, month, year)

    # Create Excel file in memory
    wb = Workbook()
    ws = wb.active
    ws.title = "Payroll"
    
    # Add headers
    headers = ["employee_code", "salary_head", "month", "year", "actual_value", "extra_info_remarks"]
    ws.append(headers)
    
    # Add data rows (access dict keys, not attributes)
    for row in rows:
        ws.append([
            row["employee_code"],
            row["salary_head"],
            row["month"],
            row["year"],
            row["actual_value"],
            row["remarks"] or ""
        ])
    
    # Save to BytesIO
    excel = BytesIO()
    wb.save(excel)
    excel.seek(0)  # Important: reset stream position
    
    filename = f"Payroll_{month}_{year}.xlsx"

    return StreamingResponse(
        excel,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )