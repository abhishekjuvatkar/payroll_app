from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.models import Employee, SalaryHead, PayrollEntry


# ---------------- Employees ---------------- #

def get_employees(db: Session):
    return (
        db.query(Employee)
        .order_by(Employee.employee_name)
        .all()
    )


# ---------------- Salary Heads ---------------- #

def get_salary_heads(db: Session):
    return (
        db.query(SalaryHead)
        .order_by(SalaryHead.salary_head)
        .all()
    )


# ---------------- Payroll ---------------- #

def get_payroll_entries(db: Session, month: str, year: int):

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
            PayrollEntry.month == month,
            PayrollEntry.year == year,
        )
        .order_by(Employee.employee_name)
        .all()
    )

    return [dict(row._mapping) for row in rows]


def save_payroll_entries(db: Session, month: str, year: int, entries: list):
    """
    Deletes existing records for the selected
    month/year and inserts the latest data.
    """

    db.execute(
        delete(PayrollEntry).where(
            PayrollEntry.month == month,
            PayrollEntry.year == year,
        )
    )

    for row in entries:

        payroll = PayrollEntry(
            employee_id=row.employee_id,
            salary_head_id=row.salary_head_id,
            month=month,
            year=year,
            actual_value=row.actual_value,
            remarks=row.remarks,
        )

        db.add(payroll)

    db.commit()

    return True