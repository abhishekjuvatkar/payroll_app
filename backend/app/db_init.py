import sqlalchemy as sa
from app.database import engine, Base
from app.models import Employee, SalaryHead, PayrollEntry

def init_db_and_migrate():
    """
    Fast check: If tables already exist with employee records, skip heavy DDL to prevent table locks.
    """
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            res = conn.execute(sa.text("SELECT count(*) FROM employee_master;")).scalar()
            if res and res > 50:
                print(f"Database ready: {res} employee records present.", flush=True)
                return
    except Exception:
        pass

    Base.metadata.create_all(bind=engine)
    
    all_columns = [
        "title", "first_name", "middle_name", "last_name", "name_in_hindi",
        "gender", "date_of_birth", "guardian_name", "mother_name", "blood_group",
        "appointed_category", "social_category", "is_pwd", "employee_type",
        "nature_of_employment", "organization_unit", "designation", "sanctioned_ou",
        "sanctioned_designation", "date_of_joining", "date_of_superannuation", "status",
        "mobile_number", "office_phone_number", "alternate_mobile_no", "official_email",
        "personal_email", "residential_address", "residential_state", "residential_city",
        "residential_pincode", "residential_phone_number", "permanent_address",
        "permanent_state", "permanent_city", "permanent_pincode", "hometown",
        "hometown_state", "hometown_city", "hometown_pincode"
    ]
    
    cols_add_sql = ", ".join([f"ADD COLUMN IF NOT EXISTS {c} TEXT" for c in all_columns])
    
    try:
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            conn.execute(sa.text(f"ALTER TABLE employee_master {cols_add_sql};"))
            try:
                conn.execute(sa.text("ALTER TABLE employee_master ALTER COLUMN employee_code TYPE VARCHAR(255);"))
                conn.execute(sa.text("ALTER TABLE employee_master ALTER COLUMN employee_name TYPE VARCHAR(255);"))
            except Exception:
                pass
    except Exception as e:
        print("Migration notice:", e)

    try:
        from app.sync_official_master import sync_official_employees
        sync_official_employees()
    except Exception as e:
        print("Official sync notice:", e)
