from io import BytesIO

from openpyxl import Workbook


def generate_excel(payroll_rows):

    wb = Workbook()

    ws = wb.active

    ws.title = "Payroll"

    ws.append(
        [
            "employee_code",
            "salary_head",
            "month",
            "year",
            "actual_value",
            "extra_info_remarks",
        ]
    )

    for row in payroll_rows:

        ws.append(
            [
                row.employee.employee_code,
                row.salary_head.salary_head,
                row.month,
                row.year,
                float(row.actual_value),
                row.remarks or "",
            ]
        )

    excel = BytesIO()

    wb.save(excel)

    excel.seek(0)

    return excel