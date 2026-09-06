from typing import List, Dict, Any, Optional, Tuple, Set
import re

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]
SHORT_MONTH_NAMES = [
    "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

def get_comparison_months(current_year: int, current_month: int, count: int = 3) -> List[Dict[str, Any]]:
    """
    Returns list of month definitions going from earliest to current.
    e.g. current_year=2026, current_month=6, count=3:
    [
        {"year": 2026, "month": 4, "label": "April 2026", "short_label": "Apr 2026", "short_month": "Apr", "is_current": False},
        {"year": 2026, "month": 5, "label": "May 2026", "short_label": "May 2026", "short_month": "May", "is_current": False},
        {"year": 2026, "month": 6, "label": "June 2026", "short_label": "Jun 2026", "short_month": "Jun", "is_current": True}
    ]
    """
    months = []
    for offset in range(-(count - 1), 1):
        total_m = current_year * 12 + (current_month - 1) + offset
        y = total_m // 12
        m = (total_m % 12) + 1
        m_name = MONTH_NAMES[m]
        s_name = SHORT_MONTH_NAMES[m]
        months.append({
            "year": y,
            "month": m,
            "label": f"{m_name} {y}",
            "short_label": f"{s_name} {y}",
            "month_name": m_name,
            "short_month": s_name,
            "is_current": (offset == 0)
        })
    return months

def get_short_month_label(full_label: str) -> str:
    """Extract short month representation like 'Apr' or 'Apr 26'."""
    parts = full_label.split()
    if not parts:
        return full_label
    first = parts[0][:3].title()
    if len(parts) > 1 and parts[1].isdigit():
        return f"{first} '{parts[1][-2:]}"
    return first

def determine_status(diff: float) -> str:
    """Classify difference as INCREASED, DECREASED, or NO_CHANGE."""
    if diff > 0.0001:
        return "INCREASED"
    elif diff < -0.0001:
        return "DECREASED"
    return "NO_CHANGE"

def calculate_percentage_change(old_val: float, new_val: float) -> Optional[float]:
    """Calculate percentage change safely without DivisionByZero / Infinity."""
    if abs(old_val) < 0.0001:
        return None
    return round(((new_val - old_val) / abs(old_val)) * 100, 2)

def compare_monthly_datasets(months_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares 2, 3, or N monthly salary datasets.
    
    months_data is a list of:
    {
       "month_index": 0,
       "month_label": "April 2026",
       "categories": { ... output of parse_excel_file ... }
    }
    """
    if not months_data or len(months_data) < 2:
        raise ValueError("At least two monthly datasets are required for comparison.")
        
    month_labels = [m["month_label"] for m in months_data]
    num_months = len(months_data)
    
    # 1. Collect all unique categories across all months
    all_categories = {}
    for m in months_data:
        for cat_key, cat_val in m["categories"].items():
            if cat_key not in all_categories:
                all_categories[cat_key] = {
                    "key": cat_key,
                    "name": cat_val["category_name"]
                }
                
    detailed_rows = []
    head_changes_map = {}  # (cat_key, col_key) -> stats
    presence_list = []
    
    total_employees_set = set()
    category_employee_counts = {cat_key: set() for cat_key in all_categories}
    
    total_val_changes = 0
    total_increases = 0
    total_decreases = 0
    total_no_change = 0
    total_increase_amount = 0.0
    total_decrease_amount = 0.0
    
    # Transition-specific counters
    transitions_stats = []
    for i in range(num_months - 1):
        short_from = get_short_month_label(month_labels[i])
        short_to = get_short_month_label(month_labels[i + 1])
        transitions_stats.append({
            "from_month": month_labels[i],
            "to_month": month_labels[i + 1],
            "transition_key": f"m{i+1}_m{i+2}",
            "transition_label": f"{month_labels[i]} → {month_labels[i+1]}",
            "short_transition_label": f"{short_from}→{short_to}",
            "changed_values": 0,
            "increased_values": 0,
            "decreased_values": 0,
            "increase_amount": 0.0,
            "decrease_amount": 0.0,
            "affected_employees": set()
        })
        
    # 2. Process each category independently
    for cat_key, cat_meta in all_categories.items():
        cat_name = cat_meta["name"]
        
        month_emp_maps = []
        month_col_maps = []
        
        for m in months_data:
            cat_data = m["categories"].get(cat_key, {})
            # Map by normalized name and employee ID
            emp_map = {}
            for e in cat_data.get("employees", []):
                emp_id_key = e["employee_id"]
                norm_name_key = e.get("normalized_name") or e["employee_name"].strip().upper()
                emp_map[emp_id_key] = e
                emp_map[norm_name_key] = e
            month_emp_maps.append(emp_map)
            
            col_map = {c["key"]: c for c in cat_data.get("columns", [])}
            month_col_maps.append(col_map)
            
        # Collect all unique employees in this category across months
        all_emp_entries = {}
        for m_idx, emp_map in enumerate(month_emp_maps):
            for k, emp_data in emp_map.items():
                emp_primary_id = emp_data["employee_id"]
                if emp_primary_id not in all_emp_entries:
                    all_emp_entries[emp_primary_id] = emp_data
                    
        # Collect all unique columns in this category
        all_cols_dict = {}
        for c_map in month_col_maps:
            for c_key, c_val in c_map.items():
                if c_key not in all_cols_dict:
                    all_cols_dict[c_key] = c_val
                    
        # 3. Detect Employee Presence Changes
        for emp_id, emp_data in all_emp_entries.items():
            emp_name = emp_data["employee_name"]
            norm_name = emp_data.get("normalized_name", emp_name.upper())
            
            present_in_months = []
            missing_in_months = []
            
            for m_idx in range(num_months):
                emp_map = month_emp_maps[m_idx]
                if emp_id in emp_map or norm_name in emp_map:
                    present_in_months.append(month_labels[m_idx])
                else:
                    missing_in_months.append(month_labels[m_idx])
                    
            # Check presence transitions
            if len(present_in_months) < num_months:
                first_present_idx = min(month_labels.index(m) for m in present_in_months)
                last_present_idx = max(month_labels.index(m) for m in present_in_months)
                
                if first_present_idx > 0:
                    status_label = f"New joined in {month_labels[first_present_idx]}"
                elif last_present_idx < num_months - 1:
                    status_label = f"Missing after {month_labels[last_present_idx]}"
                else:
                    status_label = f"Absent in {', '.join(missing_in_months)}"
                    
                presence_list.append({
                    "employee_id": emp_id,
                    "employee_name": emp_name,
                    "category": cat_name,
                    "category_key": cat_key,
                    "status_label": status_label,
                    "present_months": present_in_months,
                    "missing_months": missing_in_months
                })
                
        # 4. Compare Values for each employee and salary head
        for emp_id, emp_data in all_emp_entries.items():
            emp_display_name = emp_data["employee_name"]
            norm_name = emp_data.get("normalized_name", emp_display_name.upper())
            
            total_employees_set.add(f"{cat_key}_{emp_id}")
            category_employee_counts[cat_key].add(emp_id)
            
            for col_key, col_meta in all_cols_dict.items():
                col_name = col_meta["name"]
                is_total = col_meta.get("is_total", False)
                is_employer_contrib = col_meta.get("is_employer_contribution", False)
                
                # Extract values across all months
                month_values = []
                for m_idx in range(num_months):
                    emp_map = month_emp_maps[m_idx]
                    emp_record = emp_map.get(emp_id) or emp_map.get(norm_name)
                    if emp_record:
                        v = emp_record["values"].get(col_key, 0.0)
                    else:
                        v = 0.0
                    month_values.append(v)
                    
                # Pairwise transition diffs
                transition_diffs = []
                has_any_change = False
                
                for t_idx in range(num_months - 1):
                    old_v = month_values[t_idx]
                    new_v = month_values[t_idx + 1]
                    diff = round(new_v - old_v, 2)
                    pct_chg = calculate_percentage_change(old_v, new_v)
                    status = determine_status(diff)
                    
                    transition_diffs.append({
                        "from_month": month_labels[t_idx],
                        "to_month": month_labels[t_idx + 1],
                        "old_value": old_v,
                        "new_value": new_v,
                        "diff": diff,
                        "percentage_change": pct_chg,
                        "status": status
                    })
                    
                    if status != "NO_CHANGE":
                        has_any_change = True
                        if not is_total:
                            transitions_stats[t_idx]["changed_values"] += 1
                            transitions_stats[t_idx]["affected_employees"].add(emp_id)
                            if status == "INCREASED":
                                transitions_stats[t_idx]["increased_values"] += 1
                                transitions_stats[t_idx]["increase_amount"] += diff
                            else:
                                transitions_stats[t_idx]["decreased_values"] += 1
                                transitions_stats[t_idx]["decrease_amount"] += abs(diff)
                                
                # Overall difference (Month 1 -> Month N)
                first_v = month_values[0]
                last_v = month_values[-1]
                overall_diff = round(last_v - first_v, 2)
                overall_pct_chg = calculate_percentage_change(first_v, last_v)
                overall_status = determine_status(overall_diff)
                
                if not is_total:
                    if has_any_change:
                        total_val_changes += 1
                    if overall_status == "INCREASED":
                        total_increases += 1
                        total_increase_amount += overall_diff
                    elif overall_status == "DECREASED":
                        total_decreases += 1
                        total_decrease_amount += abs(overall_diff)
                    else:
                        total_no_change += 1
                        
                # Update Head Changes Summary Matrix
                head_map_key = (cat_key, col_key)
                if head_map_key not in head_changes_map:
                    head_changes_map[head_map_key] = {
                        "category": cat_name,
                        "category_key": cat_key,
                        "salary_head": col_name,
                        "head_key": col_key,
                        "is_total": is_total,
                        "is_employer_contribution": is_employer_contrib,
                        "transition_changes_count": [0] * (num_months - 1),
                        "overall_changes_count": 0,
                        "increased_count": 0,
                        "decreased_count": 0,
                        "net_diff": 0.0
                    }
                    
                summary_entry = head_changes_map[head_map_key]
                for t_idx, tr_diff in enumerate(transition_diffs):
                    if tr_diff["status"] != "NO_CHANGE":
                        summary_entry["transition_changes_count"][t_idx] += 1
                        
                if overall_status != "NO_CHANGE":
                    summary_entry["overall_changes_count"] += 1
                    if overall_status == "INCREASED":
                        summary_entry["increased_count"] += 1
                    else:
                        summary_entry["decreased_count"] += 1
                summary_entry["net_diff"] = round(summary_entry["net_diff"] + overall_diff, 2)
                
                # Build flat record for detailed view
                row_record = {
                    "id": f"{cat_key}_{emp_id}_{col_key}",
                    "category": cat_name,
                    "category_key": cat_key,
                    "employee_name": emp_display_name,
                    "employee_id": emp_id,
                    "salary_head": col_name,
                    "head_key": col_key,
                    "is_total": is_total,
                    "is_employer_contribution": is_employer_contrib,
                    "month_values": month_values,
                    "transitions": transition_diffs,
                    "overall_diff": overall_diff,
                    "overall_percentage_change": overall_pct_chg,
                    "overall_status": overall_status,
                    "has_change": has_any_change or (overall_status != "NO_CHANGE")
                }
                
                for m_idx, m_lbl in enumerate(month_labels):
                    row_record[f"month_{m_idx+1}"] = month_values[m_idx]
                if len(transition_diffs) >= 1:
                    row_record["diff_m1_m2"] = transition_diffs[0]["diff"]
                    row_record["status_m1_m2"] = transition_diffs[0]["status"]
                if len(transition_diffs) >= 2:
                    row_record["diff_m2_m3"] = transition_diffs[1]["diff"]
                    row_record["status_m2_m3"] = transition_diffs[1]["status"]
                    
                detailed_rows.append(row_record)
                
    # 5. Format Transition summaries
    final_transitions = []
    for t in transitions_stats:
        final_transitions.append({
            "from_month": t["from_month"],
            "to_month": t["to_month"],
            "transition_key": t["transition_key"],
            "transition_label": t["transition_label"],
            "short_transition_label": t["short_transition_label"],
            "changed_values": t["changed_values"],
            "increased_values": t["increased_values"],
            "decreased_values": t["decreased_values"],
            "increase_amount": round(t["increase_amount"], 2),
            "decrease_amount": round(t["decrease_amount"], 2),
            "affected_employees_count": len(t["affected_employees"])
        })
        
    short_first = get_short_month_label(month_labels[0])
    short_last = get_short_month_label(month_labels[-1])
    overall_transition_label = f"{month_labels[0]} → {month_labels[-1]}"
    short_overall_label = f"{short_first}→{short_last}"

    # 6. Format Head Changes Summary list
    head_changes_list = list(head_changes_map.values())
    head_changes_list.sort(key=lambda x: (x["is_total"], -x["overall_changes_count"], x["category"], x["salary_head"]))
    
    # 7. Format Overall KPI summary
    net_salary_movement = round(total_increase_amount - total_decrease_amount, 2)
    overall_kpi = {
        "total_employees": len(total_employees_set),
        "faulty_staff_count": len(category_employee_counts.get("faulty_staff", set())),
        "staff_count": len(category_employee_counts.get("staff", set())),
        "contractual_staff_count": len(category_employee_counts.get("contractual_staff", set())),
        "total_salary_heads_compared": len([h for h in head_changes_list if not h["is_total"]]),
        "total_value_changes": total_val_changes,
        "total_increases": total_increases,
        "total_decreases": total_decreases,
        "total_no_change": total_no_change,
        "total_increase_amount": round(total_increase_amount, 2),
        "total_decrease_amount": round(total_decrease_amount, 2),
        "net_salary_movement": net_salary_movement,
        "total_new_or_missing_employees": len(presence_list)
    }
    
    # 8. Field Mappings List (for Field Mapping UI)
    field_mappings_list = []
    seen_map_keys = set()
    for h in head_changes_list:
        head_name = h["salary_head"]
        if head_name not in seen_map_keys:
            seen_map_keys.add(head_name)
            field_mappings_list.append({
                "historical_head": head_name,
                "canonical_key": h["head_key"],
                "salary_generated_field": head_name,
                "is_total": h["is_total"],
                "is_employer_contribution": h["is_employer_contribution"],
                "status": "Mapped" if not h["is_employer_contribution"] else "Employer Cost"
            })
            
    # 9. Reconciliation Table (Compares Previous Month vs Current Month values)
    reconciliation_rows = []
    if num_months >= 2:
        prev_idx = num_months - 2
        curr_idx = num_months - 1
        for row in detailed_rows:
            if row["is_total"]:
                continue
            prev_v = row["month_values"][prev_idx]
            curr_v = row["month_values"][curr_idx]
            diff = round(curr_v - prev_v, 2)
            recon_status = "MATCH" if abs(diff) < 0.01 else "MISMATCH"
            reconciliation_rows.append({
                "employee_name": row["employee_name"],
                "category": row["category"],
                "salary_head": row["salary_head"],
                "historical_value": prev_v,
                "salary_generated_value": curr_v,
                "difference": diff,
                "status": recon_status
            })
            
    return {
        "months": month_labels,
        "num_months": num_months,
        "current_month": month_labels[-1],
        "comparison_period": " → ".join(month_labels),
        "overall_transition_label": overall_transition_label,
        "short_overall_label": short_overall_label,
        "overall_summary": overall_kpi,
        "transitions_summary": final_transitions,
        "head_changes_summary": head_changes_list,
        "employee_changes": detailed_rows,
        "presence_changes": presence_list,
        "field_mappings": field_mappings_list,
        "reconciliation": reconciliation_rows,
        "categories_list": [c["name"] for c in all_categories.values()]
    }

def reconcile_current_with_samarth(
    current_categories: Dict[str, Any],
    samarth_categories: Dict[str, Any],
    month_label: str = "Current Month"
) -> Dict[str, Any]:
    """
    Directly reconciles Current Month Salary Sheet against an uploaded Samarth Generated Excel sheet.
    Matches employees by ID or normalized name and compares mapped salary heads.
    """
    # 1. Collect all categories from both datasets
    all_cat_keys = set(current_categories.keys()).union(set(samarth_categories.keys()))
    
    reconciliation_list = []
    total_records = 0
    total_matches = 0
    total_mismatches = 0
    max_difference = 0.0
    net_difference = 0.0
    
    for cat_key in all_cat_keys:
        curr_cat = current_categories.get(cat_key, {})
        sam_cat = samarth_categories.get(cat_key, {})
        cat_display_name = curr_cat.get("category_name") or sam_cat.get("category_name") or "Staff"
        
        # Build employee lookup for Current Sheet
        curr_emp_map = {}
        for e in curr_cat.get("employees", []):
            emp_id_key = e["employee_id"]
            norm_name = e.get("normalized_name") or e["employee_name"].strip().upper()
            curr_emp_map[emp_id_key] = e
            curr_emp_map[norm_name] = e
            
        # Build employee lookup for Samarth Sheet
        sam_emp_map = {}
        for e in sam_cat.get("employees", []):
            emp_id_key = e["employee_id"]
            norm_name = e.get("normalized_name") or e["employee_name"].strip().upper()
            sam_emp_map[emp_id_key] = e
            sam_emp_map[norm_name] = e
            
        # Collect all unique employees
        all_emp_keys = set()
        for e in curr_cat.get("employees", []):
            all_emp_keys.add(e["employee_id"])
        for e in sam_cat.get("employees", []):
            all_emp_keys.add(e["employee_id"])
            
        # Collect all unique column definitions
        all_cols_map = {}
        for c in curr_cat.get("columns", []):
            all_cols_map[c["key"]] = c
        for c in sam_cat.get("columns", []):
            all_cols_map[c["key"]] = c
            
        # Perform comparison for each employee and head
        for emp_id in all_emp_keys:
            curr_emp = curr_emp_map.get(emp_id)
            sam_emp = sam_emp_map.get(emp_id)
            
            emp_display_name = (curr_emp or sam_emp)["employee_name"]
            
            for col_key, col_meta in all_cols_map.items():
                col_name = col_meta["name"]
                is_total = col_meta.get("is_total", False)
                if is_total:
                    continue
                    
                curr_val = curr_emp["values"].get(col_key, 0.0) if curr_emp else 0.0
                sam_val = sam_emp["values"].get(col_key, 0.0) if sam_emp else 0.0
                
                # If both are 0, skip noisy zero-zero entries
                if abs(curr_val) < 0.001 and abs(sam_val) < 0.001:
                    continue
                    
                diff = round(sam_val - curr_val, 2)
                status = "MATCH" if abs(diff) < 0.01 else "MISMATCH"
                
                total_records += 1
                if status == "MATCH":
                    total_matches += 1
                else:
                    total_mismatches += 1
                    
                diff_abs = abs(diff)
                if diff_abs > max_difference:
                    max_difference = diff_abs
                net_difference += diff
                
                reconciliation_list.append({
                    "employee_name": emp_display_name,
                    "employee_id": emp_id,
                    "category": cat_display_name,
                    "category_key": cat_key,
                    "salary_head": col_name,
                    "head_key": col_key,
                    "current_sheet_value": curr_val,
                    "samarth_value": sam_val,
                    "difference": diff,
                    "status": status,
                    "is_employer_contribution": col_meta.get("is_employer_contribution", False)
                })
                
    match_percentage = round((total_matches / total_records) * 100, 1) if total_records > 0 else 100.0
    
    return {
        "month_label": month_label,
        "summary": {
            "total_records": total_records,
            "matches": total_matches,
            "mismatches": total_mismatches,
            "match_percentage": match_percentage,
            "net_difference": round(net_difference, 2),
            "max_difference": round(max_difference, 2)
        },
        "reconciliation": reconciliation_list
    }

