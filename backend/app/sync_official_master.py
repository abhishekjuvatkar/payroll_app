import sys
sys.path.insert(0, "d:/payroll_app/backend")

from app.database import engine, SessionLocal
from app.models import Employee
from app.comparison.excel_parser import normalize_employee_name

RAW_DATA = """
employee_id	title	first_name	middle_name	last_name	name_in_hindi	employee_type	nature_of_employment
AS1801	Mr.	Sandeep Pareek				Non-Teaching	Permanent
AS1901	Mr.	Giridhar Suresh Kittur			NA	Non-Teaching	Permanent
AS1903	Mr.	G Ramamurthy			NA	Non-Teaching	Permanent
AS1904	Mr.	Chetan Kumar M			NA	Non-Teaching	Permanent
AS1906	Mr.	Veda Srikanth			NA	Non-Teaching	Permanent
AS1908	Mr.	Praveen Hodlur			NA	Non-Teaching	Permanent
TS1901	Mr.	Mrutyunjay K. Siddannavar			NA	Non-Teaching	Permanent
AS1909	Mr.	Chetan Totad			NA	Non-Teaching	Permanent
AS1910	Mr.	Vinayak B Patil			NA	Non-Teaching	Permanent
AS1911	Mr.	Harsha N			NA	Non-Teaching	Permanent
TS1902	Mr.	Gonela Karthik Kumar			NA	Non-Teaching	Permanent
TS1903	Mr.	Manjunath S Koparde			NA	Non-Teaching	Permanent
TS1904	Mr.	Ravi Shivaprakash Ghalimath			NA	Non-Teaching	Permanent
TS1905	Mr.	Gundaveni Ramesh			NA	Non-Teaching	Permanent
TS1907	Ms.	Gayatri Rayar			NA	Non-Teaching	Permanent
TS1908	Mr.	Bhimsen Narayan Karadin			NA	Non-Teaching	Permanent
TS1909	Mr.	Anand Kishore			NA	Non-Teaching	Permanent
TS2001	Mr.	Chandrashekar S			NA	Non-Teaching	Permanent
TS2002	Mr.	Shrinidhi H V			NA	Non-Teaching	Permanent
TS2005	Mr.	Deepak P P			NA	Non-Teaching	Permanent
TS2006	Mr.	Ramachandran K			NA	Non-Teaching	Permanent
TS2007	Mr.	Appasaheb Vijayanand Sheelavant			NA	Non-Teaching	Permanent
TS2008	Mr.	Madhu E S			NA	Non-Teaching	Permanent
TS2009	Mr.	Mrutyunjay Chanabasappa Kadakol			NA	Non-Teaching	Permanent
TS2101	Mr.	Sundeep P			NA	Non-Teaching	Permanent
AS2301	Mr.	Arun Verma			NA	Non-Teaching	Permanent
AS2303	Mr.	Janardhan Reddy Sirigireddy			NA	Non-Teaching	Permanent
AS2304	Mr.	Sunil M Poojar			NA	Non-Teaching	Permanent
AS2305	Mr.	Laxman B Khanappanavar			NA	Non-Teaching	Permanent
AS2306	Mr.	Mallanagoud Somanagoud Patil			NA	Non-Teaching	Permanent
AS2307	Ms.	Pratibha Shankarappa Tigadi			NA	Non-Teaching	Permanent
AS2308	Mr.	Shreesha Chandran T V			NA	Non-Teaching	Permanent
AS2309	Ms.	Anita Verma			NA	Non-Teaching	Permanent
AS2310	Mr.	Abhishek Kumar			NA	Non-Teaching	Permanent
AS2311	Mr.	Shashank Banavi			NA	Non-Teaching	Permanent
AS2312	Mr.	Gowtham R			NA	Non-Teaching	Permanent
AS2313	Mr.	Ramesh Kumar Ram			NA	Non-Teaching	Permanent
AS2314	Mr.	Ravulapati Nagaraju			NA	Non-Teaching	Permanent
AS2315	Mr.	Naveen Kamanakeri			NA	Non-Teaching	Permanent
AS2316	Mr.	Halagappanavara Gireesha			NA	Non-Teaching	Permanent
AS2319	Mr.	Varun V			NA	Non-Teaching	Permanent
AS2321	Mr.	Amol Diwate			NA	Non-Teaching	Permanent
TS2301	Mr.	Praveenkumar Metri			NA	Non-Teaching	Permanent
AS2322	Mr.	Sudip Mandal			NA	Non-Teaching	Permanent
AS2323	Mr.	Khandu Ashokrao Dinde			NA	Non-Teaching	Permanent
TS2303	Mr.	Sujeendra Gowda			NA	Non-Teaching	Permanent
TS2305	Mr.	Manjunath S Gomappanavar			NA	Non-Teaching	Permanent
TS2306	Mr.	Kanchapogu Suresh			NA	Non-Teaching	Permanent
AS1907	Mr.	Prajwal M Kapileshwari			NA	Non-Teaching	Permanent
TS2308	Ms.	Chitra S Naik			NA	Non-Teaching	Permanent
TS2309	Mr.	V Subramanya Hanumanu Sai			NA	Non-Teaching	Permanent
TS2310	Mr.	Bharath G Relekar			NA	Non-Teaching	Permanent
TS2311	Mr.	PM Venkateswarlu			NA	Non-Teaching	Permanent
TS2312	Mr.	Manigandan C			NA	Non-Teaching	Permanent
AS2326	Mr.	Deepak Tiwari			NA	Non-Teaching	Permanent
AS2327	Ms.	Vishalakshi Irappa Channannavar			NA	Non-Teaching	Permanent
AS2328	Mr.	Kenchappa Sasanur			NA	Non-Teaching	Permanent
TS2314	Ms.	Deepika B G			NA	Non-Teaching	Permanent
TS2401	Mr.	Kuldeep Singh			NA	Non-Teaching	Permanent
TS2402	Mr.	Akash Pol			NA	Non-Teaching	Permanent
TS2403	Mr.	Abhishek Hadapad			NA	Non-Teaching	Permanent
TS1906	Dr.	Keerthi Kumar M			NA	Non-Teaching	Permanent
TS2405	Mr.	Rahul			NA	Non-Teaching	Permanent
TS2406	Mr.	Jeevanandharaj S D			NA	Non-Teaching	Permanent
AS2401	Mr.	Inderpal			NA	Non-Teaching	Permanent
TS2407	Mr.	Ammanola Praveen Kumar			NA	Non-Teaching	Permanent
TS2408	Mr.	Gurumurthy N			NA	Non-Teaching	Permanent
AS2501	Dr.	Kalyan Kumar Bhattacharjee			NA	Non-Teaching	Permanent
AS2502	Mr.	Shravan Kumar Amancha			NA	Non-Teaching	Permanent
TS2501	Mr.	Karthick S			NA	Non-Teaching	Permanent
TS2502	Dr.	Reddivari Muniramaiah			NA	Non-Teaching	Permanent
AS2503	Mr.	Guruprasada T			NA	Non-Teaching	Permanent
AS2504	Mr.	Ajay kumar Thuppathi			NA	Non-Teaching	Permanent
AS2505	Mr.	Praddumn Dwivedi			NA	Non-Teaching	Permanent
AS2506	Mr.	Srikanth Sambu			NA	Non-Teaching	Permanent
TS2503	Mr.	Bishwanath Gorai			NA	Non-Teaching	Permanent
AS2507	Mr.	Manjunatha U B			NA	Non-Teaching	Permanent
RF1701	Prof.	Tejas Prakash Gotkhindi			NA	Teaching	Permanent
RF1702	Prof.	Ameer Kalandar Mulla			NA	Teaching	Permanent
RF1703	Prof.	Sudheer Siddapureddy			NA	Teaching	Permanent
RF1704	Prof.	Rajeswara Rao Malakalapalli			NA	Teaching	Permanent
RF1705	Prof.	Ramchandra Phawade			NA	Teaching	Permanent
RF1706	Prof.	Ridhima Tewari			NA	Teaching	Permanent
RF1707	Prof.	R. Prabhu			रा प्रभु 	Teaching	Permanent
RF1708	Prof.	Amlan Kusum Barua			NA	Teaching	Permanent
RF1709	Prof.	Sudhanshu Kumar Shukla			NA	Teaching	Permanent
RF1710	Prof.	Ruma Ghosh			रुमा घोष	Teaching	Permanent
RF1711	Prof.	Dhiraj V. Patil			NA	Teaching	Permanent
RF1712	Prof.	Bharath B. N.			NA	Teaching	Permanent
RF1801	Prof.	Sandeep R. B.			NA	Teaching	Permanent
RF1802	Prof.	Rajshekar K.			NA	Teaching	Permanent
RF1803	Prof.	Naveen Kadayinti			NA	Teaching	Permanent
RF1804	Prof.	Sangamesh Deepak R.			NA	Teaching	Permanent
RF1805	Prof.	Koushik Saha			NA	Teaching	Permanent
RF1806	Prof.	Shrikanth V.			NA	Teaching	Contractual
RF1807	Prof.	Pratyasa Bhui			NA	Teaching	Permanent
RF1808	Prof.	Naveen Mysore Balasubramanya			NA	Teaching	Permanent
RF1809	Prof.	Sagnik Sen			NA	Teaching	Permanent
RF1810	Prof.	Jolly Thomas			NA	Teaching	Permanent
RF1811	Prof.	Gayathri Ananthanarayanan			NA	Teaching	Permanent
RF1812	Prof.	Gopal Sharan Parashari			NA	Teaching	Permanent
RF1813	Prof.	Nilkamal Mahanta			NA	Teaching	Permanent
RF1814	Prof.	Kedar	Vithal	Khandeparkar	केदार विठ्ठल खांडेपारकर	Teaching	Permanent
RF1901	Prof.	Satish Naik Banavath			NA	Teaching	Permanent
RF1902	Prof.	Samarth Raut			NA	Teaching	Permanent
RF1903	Prof.	Somashekara M. A.			NA	Teaching	Permanent
RF1904	Prof.	Amar Gaonkar			NA	Teaching	Permanent
RF1905	Prof.	Surya Prakash Ramesh			NA	Teaching	Permanent
RF1906	Prof.	Shreedevi Masuti			NA	Teaching	Permanent
RF1908	Prof.	Dhriti Ranjan Dolai			NA	Teaching	Permanent
RF1909	Prof.	Rajshekhar Vishweshwar Bhat			NA	Teaching	Permanent
RF1910	Prof.	Siba Narayan Swain			NA	Teaching	Permanent
RF1911	Prof.	Nikhil Devaratha Hegde			निखिल देवराथ हेगड़े	Teaching	Permanent
RF1912	Prof.	Keerthi M. C.			NA	Teaching	Permanent
RF1913	Prof.	Surya Pratap Singh			सूर्य प्रताप सिंह	Teaching	Permanent
RF1914	Prof.	Kavita Devi			NA	Teaching	Permanent
RF2001	Prof.	Tamal		Das	तमल दास 	Teaching	Permanent
RF2002	Prof.	Abhijit Kshirsagar			NA	Teaching	Permanent
RF2003	Prof.	S. R. Mahadeva Prasanna			NA	Teaching	Permanent
RF2004	Prof.	Rahul Jashvantbhai Pandya			NA	Teaching	Permanent
RF2005	Prof.	Meenatchidevi Murugesan			NA	Teaching	Permanent
RF2101	Prof.	Santosh Kumar			NA	Teaching	Permanent
RF2102	Prof.	Koteswararao Kondepu			NA	Teaching	Permanent
RF2103	Prof.	Rakesh Lingam			NA	Teaching	Permanent
RF2104	Prof.	Hiranya Deka			NA	Teaching	Permanent
RF2105	Prof.	Mohana Rao Balaga			NA	Teaching	Permanent
RF2106	Prof.	Saroj Mondal			NA	Teaching	Permanent
RF2201	Prof.	Nagaveni S.			NA	Teaching	Permanent
RF2202	Prof.	Satyapriya Gupta			NA	Teaching	Permanent
RF2203	Prof.	Vigneshwara Raja P.			NA	Teaching	Permanent
RF2204	Prof.	Giridhar Rajesh Bande			NA	Teaching	Permanent
RF2205	Prof.	Aniket Vasantrao Kataware			NA	Teaching	Permanent
RF2207	Prof.	Venkappayya R. Desai			NA	Teaching	Permanent
RF2208	Prof.	Sudhir Kumar Sahoo			NA	Teaching	Permanent
RF2302	Prof.	Dhriti	Sundar	Ghosh	धृति सुंदर घोष	Teaching	Permanent
RF2303	Prof.	Veekesh Kumar			NA	Teaching	Permanent
RF2305	Prof.	Sontti Somasekhara Goud			NA	Teaching	Permanent
RF2306	Prof.	Suvamay Jana			NA	Teaching	Permanent
RF2307	Prof.	Ravi Chandra Dutta			NA	Teaching	Permanent
RF2308	Prof.	Hemanth Kumar Chinthapalli			NA	Teaching	Permanent
RF2309	Prof.	Konjengbam Anand			NA	Teaching	Permanent
RF2310	Prof.	Ramesh Nayaka			NA	Teaching	Permanent
RF2311	Prof.	Shraddha Srivastava			NA	Teaching	Permanent
RF2313	Prof.	Amarnath Hegde			NA	Teaching	Permanent
RF2314	Prof.	Gopal Krishna Kamath M.			NA	Teaching	Permanent
RF2315	Prof.	Vijeth Jinachandra Kotagi			NA	Teaching	Permanent
RF2316	Prof.	Sushanta Kumar Sethi			NA	Teaching	Permanent
RF2317	Prof.	Vandana Bharti			NA	Teaching	Contractual
RF2318	Prof.	Anbukkarasi Rajendran			NA	Teaching	Permanent
RF2319	Prof.	Swananda Vishvas Marathe			NA	Teaching	Permanent
RF2320	Prof.	Omkar Baswaraj Bembalge			NA	Teaching	Permanent
RF2321	Prof.	Sairam Boggavarapu			NA	Teaching	Permanent
RF2322	Prof.	Achyut Mani Tripathi			NA	Teaching	Permanent
RF2323	Prof.	Vyom Sharma			NA	Teaching	Permanent
RF2324	Prof.	Subhash Mehto			NA	Teaching	Permanent
RF2325	Prof.	Punnag Chatterjee			NA	Teaching	Permanent
RF2326	Prof.	Samatha Benedict			NA	Teaching	Permanent
RF2327	Prof.	Animesh	Kumar	Sahoo	NA	Teaching	Permanent
RF2328	Prof.	Shashaank Aswatha Mattur			NA	Teaching	Permanent
RF2329	Prof.	Debalina Chakravarty			NA	Teaching	Permanent
RF2330	Prof.	Samba Raju Chiluveru			NA	Teaching	Permanent
RF2331	Prof.	Dileep A. D.			NA	Teaching	Permanent
RF2332	Prof.	Ramjee		Repaka	रामजी रेपाका	Teaching	Permanent
RF2402	Prof.	Kundan Kumar Singh Sagar			NA	Teaching	Permanent
RF2403	Prof.	Mahesh Gudem			NA	Teaching	Permanent
RF2405	Prof.	Bal Krishna Chaube			NA	Teaching	Permanent
RF2406	Prof.	Amarkumar Ayodhyasingh Kushwaha			NA	Teaching	Contractual
RF2407	Prof.	Ashok	Kumar	Ummireddi	Ashok Kumar Ummireddi	Teaching	Permanent
RF2501	Prof.	Ravikumar Chettiannan			NA	Teaching	Permanent
RF2502	Prof.	Varaha Jayarama Krishna Jonnalagedda			NA	Teaching	Permanent
RF2503	Prof.	Shashwata Ghosh			NA	Teaching	Permanent
RS2301	Mr.	K V Sarma				Non-Teaching	Contractual
AS2508	Mr.	Mallesh		Gunari		Non-Teaching	Permanent
TS2504	Ms.	Shreya		S		Non-Teaching	Permanent
PP2204	Dr.	Sanatkumar				Teaching	Guest
PP2301	Dr.	Prahlad		Joshi	NA	Teaching	Guest
VF1801		D. Narasimha			NA	Teaching	Guest
VF2303		K V Jayakumar			NA	Teaching	Guest
VF2306		Sreepathi L K			NA	Teaching	Guest
VF2304	Dr.	Somil		Yadav	NA	Teaching	Guest
VF2307		Shivaprasad S. M.			NA	Teaching	Guest
AF2401	Prof.	Ambarish		Kulkarni		Teaching	Guest
SC2501	Mr.	Y. S. Dixit			NA	Non-Teaching	Contractual
SC2506	Mr.	Akash		Nitture	NA	Non-Teaching	Contractual
SC2508	Dr.	Geeta		Bagewadi	NA	Non-Teaching	Contractual
SC2509	Ms.	Shoba		Mulimani	NA	Non-Teaching	Contractual
SC2510	Ms.	Anuradha		Biserotti	NA	Non-Teaching	Contractual
SC2511	Ms.	Rudramma		Tegur	NA	Non-Teaching	Contractual
SC2602	Mr.	Abhishek Ramakrishna		Juvatkar	NA	Non-Teaching	Contractual
SC2514	Mr.	Ujjawal Kumar		Jha	NA	Non-Teaching	Contractual
SC2515	Dr.	D Harish Kumar			NA	Non-Teaching	Contractual
SC2601	Ms.	Kavith G R			NA	Non-Teaching	Contractual
RS2302	Dr.	D. Lakshmanan			NA	Non-Teaching	Contractual
TS2505	Mr.	Daripalli Srinivasa Rao			NA	Non-Teaching	Permanent
FF2503	Mr.	Anmol Kumar				Teaching	Contractual
FF2504	Ms.	Rimi Banerjee				Teaching	Contractual
FF2502	Dr.	Supriya Rej			 सुप्रियो रेज	Teaching	Contractual
FF2501	Dr.	Badri Nath Dubey				Teaching	Contractual
SC2603	Mr.	Sameer		Joshi		Non-Teaching	Contractual
AS2601	Ms.	Yeragurappagari Sireesha				Non-Teaching	Permanent
SC2604	Shri.	Balaji	C	Hakari		Non-Teaching	Contractual
SC2605	Shri.	Garikipati Veera Venkata Anil Kumar				Non-Teaching	Contractual
SC2606	Shri.	Kanaka Suresh Macherla				Non-Teaching	Contractual
VF2601	Dr.	Shankey Kumar			NA	Teaching	Guest
VF2602	Dr.	Harikrishnan K. S.			NA	Teaching	Guest
VF2603	Dr.	Ankur Dwivedi			NA	Teaching	Guest
VF2604	Dr.	Shesh Narayan Dhuranadhar			NA	Teaching	Guest
VF2605	Dr.	Suman Dutta			NA	Teaching	Guest
VF2606	Dr.	Pravin Kumar Natwariya			NA	Teaching	Guest
VF2607	Dr.	Vivek Anand			NA	Teaching	Guest
VF2608	Dr.	Subharthi Sarkar			NA	Teaching	Guest
VF2609	Dr.	Arko Das			NA	Teaching	Guest
AS2602	Mr.	Shameerhussain N				Non-Teaching	Permanent
VF2612	Dr.	Piyush Kumar Verma				Teaching	Guest
VF2611	Dr.	Aikta		Arya		Teaching	Guest
"""

def sync_official_employees():
    import psycopg2
    import psycopg2.extras
    from app.config import settings

    print("Starting fast official employee sync with execute_batch...", flush=True)
    lines = [l.strip() for l in RAW_DATA.strip().split("\n") if l.strip()]
    print(f"Loaded {len(lines)-1} official records from raw data.", flush=True)

    conn = psycopg2.connect(settings.DATABASE_URL)
    cur = conn.cursor()
    try:
        # Step 1: Temporarily set all codes to avoid unique constraint collision
        cur.execute("UPDATE employee_master SET employee_code = CONCAT('_T_', id);")
        
        # Step 2: Fetch existing records
        cur.execute("SELECT id, employee_name FROM employee_master;")
        existing_rows = cur.fetchall()

        by_norm_name = {}
        for r in existing_rows:
            emp_id_db, name = r[0], r[1]
            norm = normalize_employee_name(name)
            if norm:
                by_norm_name[norm] = emp_id_db

        update_tuples = []
        insert_tuples = []

        for line in lines[1:]:
            parts = [p.strip() for p in line.split("\t")]
            if not parts or not parts[0]:
                continue
            while len(parts) < 8:
                parts.append("")

            emp_id = parts[0]
            title = parts[1]
            first_name = parts[2]
            middle_name = parts[3]
            last_name = parts[4]
            name_in_hindi = parts[5] if parts[5] != "NA" else ""
            emp_type = parts[6]
            nature = parts[7]

            name_parts = [p for p in [first_name, middle_name, last_name] if p]
            full_name = " ".join(name_parts)
            norm_name = normalize_employee_name(full_name)

            db_pk = by_norm_name.get(norm_name)

            if db_pk:
                update_tuples.append((
                    emp_id, full_name, title, first_name, middle_name, last_name, name_in_hindi, emp_type, nature, db_pk
                ))
            else:
                insert_tuples.append((
                    emp_id, full_name, title, first_name, middle_name, last_name, name_in_hindi, emp_type, nature
                ))

        if update_tuples:
            psycopg2.extras.execute_batch(
                cur,
                """
                UPDATE employee_master 
                SET employee_code = %s,
                    employee_name = %s,
                    title = %s,
                    first_name = %s,
                    middle_name = %s,
                    last_name = %s,
                    name_in_hindi = %s,
                    employee_type = %s,
                    nature_of_employment = %s
                WHERE id = %s;
                """,
                update_tuples,
                page_size=200
            )

        if insert_tuples:
            psycopg2.extras.execute_batch(
                cur,
                """
                INSERT INTO employee_master (employee_code, employee_name, title, first_name, middle_name, last_name, name_in_hindi, employee_type, nature_of_employment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                """,
                insert_tuples,
                page_size=200
            )

        # Step 3: Revert any remaining _T_ codes
        cur.execute("UPDATE employee_master SET employee_code = CONCAT('EM', id) WHERE employee_code LIKE '_T_%';")

        conn.commit()
        print(f"Successfully synced {len(update_tuples) + len(insert_tuples)} official employees ({len(insert_tuples)} added, {len(update_tuples)} updated)!", flush=True)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    sync_official_employees()
