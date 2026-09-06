from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Employee(Base):
    __tablename__ = "employee_master"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(255), unique=True, nullable=False, index=True)
    employee_name = Column(String(255), nullable=False, index=True)
    
    # Personal Details
    title = Column(Text, nullable=True)
    first_name = Column(Text, nullable=True)
    middle_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    name_in_hindi = Column(Text, nullable=True)
    gender = Column(Text, nullable=True)
    date_of_birth = Column(Text, nullable=True)
    guardian_name = Column(Text, nullable=True)
    mother_name = Column(Text, nullable=True)
    blood_group = Column(Text, nullable=True)
    appointed_category = Column(Text, nullable=True)
    social_category = Column(Text, nullable=True)
    is_pwd = Column(Text, nullable=True)

    # Employment & Designation
    employee_type = Column(Text, nullable=True)
    nature_of_employment = Column(Text, nullable=True)
    organization_unit = Column(Text, nullable=True)
    designation = Column(Text, nullable=True)
    sanctioned_ou = Column(Text, nullable=True)
    sanctioned_designation = Column(Text, nullable=True)
    date_of_joining = Column(Text, nullable=True)
    date_of_superannuation = Column(Text, nullable=True)
    status = Column(Text, nullable=True, default="Active")

    # Contact & Email
    mobile_number = Column(Text, nullable=True)
    office_phone_number = Column(Text, nullable=True)
    alternate_mobile_no = Column(Text, nullable=True)
    official_email = Column(Text, nullable=True)
    personal_email = Column(Text, nullable=True)

    # Addresses
    residential_address = Column(Text, nullable=True)
    residential_state = Column(Text, nullable=True)
    residential_city = Column(Text, nullable=True)
    residential_pincode = Column(Text, nullable=True)
    residential_phone_number = Column(Text, nullable=True)

    permanent_address = Column(Text, nullable=True)
    permanent_state = Column(Text, nullable=True)
    permanent_city = Column(Text, nullable=True)
    permanent_pincode = Column(Text, nullable=True)

    hometown = Column(Text, nullable=True)
    hometown_state = Column(Text, nullable=True)
    hometown_city = Column(Text, nullable=True)
    hometown_pincode = Column(Text, nullable=True)

    payroll_entries = relationship(
        "PayrollEntry",
        back_populates="employee"
    )


class SalaryHead(Base):
    __tablename__ = "salary_head_master"

    id = Column(Integer, primary_key=True, index=True)
    salary_head = Column(String(150), unique=True, nullable=False)

    payroll_entries = relationship(
        "PayrollEntry",
        back_populates="salary_head"
    )


class PayrollEntry(Base):
    __tablename__ = "one_time_payroll_entry"

    id = Column(Integer, primary_key=True)

    employee_id = Column(
        Integer,
        ForeignKey("employee_master.id"),
        nullable=False,
    )

    salary_head_id = Column(
        Integer,
        ForeignKey("salary_head_master.id"),
        nullable=False,
    )

    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)

    actual_value = Column(
        Numeric(12, 2),
        nullable=False,
    )

    remarks = Column(String(500))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    employee = relationship(
        "Employee",
        back_populates="payroll_entries",
    )

    salary_head = relationship(
        "SalaryHead",
        back_populates="payroll_entries",
    )

    __table_args__ = (
        UniqueConstraint(
            "employee_id",
            "salary_head_id",
            "month",
            "year",
            name="uq_payroll_entry",
        ),
    )