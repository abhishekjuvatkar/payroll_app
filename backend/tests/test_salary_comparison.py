from app.comparison.excel_parser import clean_numeric_value, disambiguate_headers, detect_category, parse_excel_file
from app.comparison.comparator import compare_monthly_datasets, determine_status, get_comparison_months
from app.comparison.exporter import generate_comparison_excel_report
from app.comparison.sample_data import generate_sample_month_workbook, get_sample_comparison_dataset

def test_clean_numeric_value():
    assert clean_numeric_value(None) == 0.0
    assert clean_numeric_value("") == 0.0
    assert clean_numeric_value("-") == 0.0
    assert clean_numeric_value("N/A") == 0.0
    assert clean_numeric_value("50,000") == 50000.0
    assert clean_numeric_value("₹ 1,44,200.50") == 144200.5
    assert clean_numeric_value(12000) == 12000.0
    assert clean_numeric_value("  10000  ") == 10000.0

def test_disambiguate_headers():
    headers = ["Sl. No.", "Particulars", "BASIC PAY", "NPS", "GPF", "NPS"]
    disambiguated = disambiguate_headers(headers)
    assert len(disambiguated) == 6
    # Second NPS should have unique key and display name
    assert disambiguated[3][0] == "NPS" and "NPS" in disambiguated[3][1]
    assert disambiguated[5][0] == "NPS_2" and "(2)" in disambiguated[5][1]

def test_category_detection():
    assert detect_category("Faulty Staff", []) == "faulty_staff"
    assert detect_category("Faculty_Salaries", []) == "faulty_staff"
    assert detect_category("Staff_July", []) == "staff"
    assert detect_category("Contractual Staff", []) == "contractual_staff"
    assert detect_category("Sheet1", ["DEAN ALLOWANCE", "WARDEN ALLOWANCE"]) == "faulty_staff"
    assert detect_category("Sheet1", ["ACCOMMODATION CHARGES", "OTHER DEDUCTIONS"]) == "contractual_staff"

def test_sample_comparison_dataset():
    res = get_sample_comparison_dataset()
    assert res["num_months"] == 3
    assert res["months"] == ["April 2026", "May 2026", "June 2026"]
    
    summary = res["overall_summary"]
    assert summary["total_employees"] > 0
    assert summary["faulty_staff_count"] > 0
    assert summary["staff_count"] > 0
    assert summary["contractual_staff_count"] > 0
    assert summary["total_value_changes"] > 0
    
    # Verify transitions
    transitions = res["transitions_summary"]
    assert len(transitions) == 2
    assert transitions[0]["from_month"] == "April 2026"
    assert transitions[0]["to_month"] == "May 2026"
    assert transitions[1]["from_month"] == "May 2026"
    assert transitions[1]["to_month"] == "June 2026"
    
    # Verify employee changes
    emp_changes = res["employee_changes"]
    assert len(emp_changes) > 0
    
    # Verify Excel exporter
    excel_stream = generate_comparison_excel_report(res)
    excel_bytes = excel_stream.getvalue()
    assert len(excel_bytes) > 5000  # Valid openpyxl zip archive

def test_presence_changes_detection():
    # M1 has Emp A, Emp B; M2 has Emp B, Emp C (Emp A leaver, Emp C joiner)
    m1_data = {
        "staff": {
            "category_name": "Staff",
            "columns": [{"key": "BASIC", "name": "Basic Pay"}],
            "employees": [
                {"employee_id": "EMP_A", "employee_name": "Employee A", "values": {"BASIC": 50000.0}},
                {"employee_id": "EMP_B", "employee_name": "Employee B", "values": {"BASIC": 60000.0}},
            ]
        }
    }
    m2_data = {
        "staff": {
            "category_name": "Staff",
            "columns": [{"key": "BASIC", "name": "Basic Pay"}],
            "employees": [
                {"employee_id": "EMP_B", "employee_name": "Employee B", "values": {"BASIC": 60000.0}},
                {"employee_id": "EMP_C", "employee_name": "Employee C", "values": {"BASIC": 55000.0}},
            ]
        }
    }
    
    res = compare_monthly_datasets([
        {"month_index": 0, "month_label": "M1", "categories": m1_data},
        {"month_index": 1, "month_label": "M2", "categories": m2_data}
    ])
    
    presence = res["presence_changes"]
    assert len(presence) == 2
    assert any(p["employee_id"] == "EMP_A" and "Missing" in p["status_label"] for p in presence)
    assert any(p["employee_id"] == "EMP_C" and "New" in p["status_label"] for p in presence)

def test_get_comparison_months():
    # Example 1: June 2026 -> April 2026, May 2026, June 2026
    m_june = get_comparison_months(2026, 6, count=3)
    assert len(m_june) == 3
    assert [m["label"] for m in m_june] == ["April 2026", "May 2026", "June 2026"]
    assert m_june[2]["is_current"] is True
    assert m_june[0]["is_current"] is False

    # Example 2: July 2026 -> May 2026, June 2026, July 2026
    m_july = get_comparison_months(2026, 7, count=3)
    assert [m["label"] for m in m_july] == ["May 2026", "June 2026", "July 2026"]

    # Example 3: January 2027 (Year boundary) -> November 2026, December 2026, January 2027
    m_jan = get_comparison_months(2027, 1, count=3)
    assert [m["label"] for m in m_jan] == ["November 2026", "December 2026", "January 2027"]
    assert m_jan[0]["year"] == 2026 and m_jan[0]["month"] == 11
    assert m_jan[1]["year"] == 2026 and m_jan[1]["month"] == 12
    assert m_jan[2]["year"] == 2027 and m_jan[2]["month"] == 1

    # Example 4: February 2026 -> December 2025, January 2026, February 2026
    m_feb = get_comparison_months(2026, 2, count=3)
    assert [m["label"] for m in m_feb] == ["December 2025", "January 2026", "February 2026"]

def test_reconciliation_and_field_mappings():
    res = get_sample_comparison_dataset(2026, 6)
    assert "field_mappings" in res
    assert len(res["field_mappings"]) > 0
    assert "reconciliation" in res
    assert len(res["reconciliation"]) > 0
    
    # Verify employer contribution classification
    emp_contribs = [f for f in res["field_mappings"] if f["is_employer_contribution"]]
    assert len(emp_contribs) > 0 or any("NPS" in f["historical_head"] for f in res["field_mappings"])
    
    # Verify reconciliation statuses
    recon_statuses = {r["status"] for r in res["reconciliation"]}
    assert "MATCH" in recon_statuses or "MISMATCH" in recon_statuses

def test_reconcile_current_with_samarth():
    from app.comparison.comparator import reconcile_current_with_samarth
    m2_bytes = generate_sample_month_workbook(1)
    samarth_bytes = generate_sample_month_workbook(2)
    
    m2_parsed = parse_excel_file(m2_bytes, "M2.xlsx")
    samarth_parsed = parse_excel_file(samarth_bytes, "Samarth.xlsx")
    
    recon_res = reconcile_current_with_samarth(
        current_categories=m2_parsed,
        samarth_categories=samarth_parsed,
        month_label="June 2026"
    )
    
    assert "summary" in recon_res
    assert recon_res["summary"]["total_records"] > 0
    assert len(recon_res["reconciliation"]) > 0
    assert "matches" in recon_res["summary"]
    assert "mismatches" in recon_res["summary"]

def test_current_vs_samarth_comparison():
    from app.comparison.current_vs_samarth import compare_current_vs_samarth, generate_current_vs_samarth_excel
    
    # 1. Generate sample workbooks
    curr_bytes = generate_sample_month_workbook(1)
    sam_bytes = generate_sample_month_workbook(2)
    
    curr_parsed = parse_excel_file(curr_bytes, "June_2026_Salary_Report.xlsx")
    sam_parsed = parse_excel_file(sam_bytes, "June_2026_Samarth_Generated.xlsx")
    
    res = compare_current_vs_samarth(
        current_categories=curr_parsed,
        samarth_categories=sam_parsed,
        current_filename="June 2026 Salary Report.xlsx",
        samarth_filename="June 2026 Samarth Salary Generated.xlsx"
    )
    
    assert "summary" in res
    assert "head_mismatch_summary" in res
    assert "employee_grouped_comparison" in res
    assert "flat_comparison_rows" in res
    
    summary = res["summary"]
    assert summary["total_employees"] > 0
    assert summary["matched_employees"] > 0
    assert summary["total_matches"] > 0
    
    # Verify Alphabetical Sorting A -> Z
    emps = res["employee_grouped_comparison"]
    emp_names = [e["employee_name"].strip().upper() for e in emps]
    assert emp_names == sorted(emp_names), "Employees must be sorted alphabetically A -> Z"
    
    # Verify difference formula: Current Month Value - Samarth Value
    for emp in emps:
        for hd in emp["heads"]:
            expected_diff = round(hd["current_value"] - hd["samarth_value"], 2)
            assert hd["difference"] == expected_diff
            if abs(expected_diff) < 0.01:
                assert hd["status"] in ("MATCH", "NOT_AVAILABLE_IN_CURRENT", "NOT_AVAILABLE_IN_SAMARTH")
            else:
                assert hd["status"] in ("MISMATCH", "NOT_AVAILABLE_IN_CURRENT", "NOT_AVAILABLE_IN_SAMARTH")
                
    # Verify One-Time Entries Generation
    assert "one_time_entries" in res
    assert len(res["one_time_entries"]) > 0
    # Ensure NO Totals are included in one_time_entries
    for ote in res["one_time_entries"]:
        assert ote["salary_head"] not in ["Gross", "Total Earnings", "Total Deductions", "Net Pay", "Gross / Total Earnings"], f"Total head {ote['salary_head']} found in one_time_entries!"
        assert ote["adjustment_amount"] > 0
        
    from app.comparison.current_vs_samarth import generate_one_time_entries_excel
    ote_excel = generate_one_time_entries_excel(res)
    assert ote_excel.getvalue() is not None
    # Verify Sync to DB and Delete All
    from app.database import SessionLocal
    from app.crud import sync_payroll_from_comparison, get_payroll_entries, save_payroll_entries
    db = SessionLocal()
    try:
        synced_count = sync_payroll_from_comparison(db, 6, 2026, res["one_time_entries"])
        assert synced_count > 0
        db_entries = get_payroll_entries(db, 6, 2026)
        assert len(db_entries) == synced_count
        
        # Test Delete All
        save_payroll_entries(db, 6, 2026, [])
        cleared_entries = get_payroll_entries(db, 6, 2026)
        assert len(cleared_entries) == 0
    finally:
        db.close()


def test_employee_master_upload_and_template():
    from app.database import SessionLocal
    from app.crud import generate_employee_template_excel, upload_employees_from_excel, get_employees
    
    # Test Template Generator
    template_buf = generate_employee_template_excel()
    assert template_buf.getvalue() is not None
    
    # Test Upload with the exact format
    db = SessionLocal()
    try:
        res = upload_employees_from_excel(db, template_buf.getvalue(), "Employee_Master_Template.xlsx")
        assert res["total_processed"] >= 1
        
        # Verify employee in database
        emps = get_employees(db)
        as1801 = next((e for e in emps if e.employee_code == "AS1801"), None)
        assert as1801 is not None
        assert "Sandeep" in as1801.employee_name
        assert as1801.designation == "Deputy Registrar"
        assert as1801.official_email == "spareek@iitdh.ac.in"
        assert as1801.mobile_number == "9829296888"
        assert as1801.employee_type == "Non-Teaching"
        assert as1801.nature_of_employment == "Permanent"
    finally:
        db.close()


if __name__ == "__main__":
    test_get_comparison_months()
    test_clean_numeric_value()
    test_disambiguate_headers()
    test_category_detection()
    test_sample_comparison_dataset()
    test_presence_changes_detection()
    test_reconciliation_and_field_mappings()
    test_reconcile_current_with_samarth()
    test_current_vs_samarth_comparison()
    test_employee_master_upload_and_template()
    print("All comparison & employee master tests passed!")
