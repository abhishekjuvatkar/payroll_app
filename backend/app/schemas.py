from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class EmployeeResponse(BaseModel):
    id: int
    employee_code: str
    employee_name: str
    title: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    name_in_hindi: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    guardian_name: Optional[str] = None
    mother_name: Optional[str] = None
    blood_group: Optional[str] = None
    appointed_category: Optional[str] = None
    social_category: Optional[str] = None
    is_pwd: Optional[str] = None
    employee_type: Optional[str] = None
    nature_of_employment: Optional[str] = None
    organization_unit: Optional[str] = None
    designation: Optional[str] = None
    sanctioned_ou: Optional[str] = None
    sanctioned_designation: Optional[str] = None
    date_of_joining: Optional[str] = None
    date_of_superannuation: Optional[str] = None
    status: Optional[str] = "Active"
    mobile_number: Optional[str] = None
    office_phone_number: Optional[str] = None
    alternate_mobile_no: Optional[str] = None
    official_email: Optional[str] = None
    personal_email: Optional[str] = None
    residential_address: Optional[str] = None
    residential_state: Optional[str] = None
    residential_city: Optional[str] = None
    residential_pincode: Optional[str] = None
    residential_phone_number: Optional[str] = None
    permanent_address: Optional[str] = None
    permanent_state: Optional[str] = None
    permanent_city: Optional[str] = None
    permanent_pincode: Optional[str] = None
    hometown: Optional[str] = None
    hometown_state: Optional[str] = None
    hometown_city: Optional[str] = None
    hometown_pincode: Optional[str] = None

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