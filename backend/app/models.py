from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    DateTime,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Employee(Base):
    __tablename__ = "employee_master"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(30), unique=True, nullable=False)
    employee_name = Column(String(200), nullable=False)

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