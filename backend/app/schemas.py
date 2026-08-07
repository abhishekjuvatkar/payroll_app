from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    employee_name: str

    class Config:
        from_attributes = True


class SalaryHeadCreate(BaseModel):
    salary_head: str


class SalaryHeadResponse(BaseModel):
    id: int
    salary_head: str

    class Config:
        from_attributes = True


class PayrollRow(BaseModel):
    employee_id: int
    salary_head_id: int
    actual_value: Decimal
    remarks: Optional[str] = ""


class PayrollSaveRequest(BaseModel):
    month: int
    year: int
    entries: List[PayrollRow]


class PayrollResponse(BaseModel):
    id: int

    employee_id: int
    employee_name: str
    employee_code: str

    salary_head_id: int
    salary_head: str

    month: int
    year: int

    actual_value: Decimal
    remarks: Optional[str]

    class Config:
        from_attributes = True