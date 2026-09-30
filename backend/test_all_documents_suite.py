"""
Comprehensive Verification Suite: Tests all document types against the SATYAPAN Unified Verification API.
"""

import os
import sys
import base64
import json
import urllib.request
import urllib.parse
import numpy as np
import cv2

API_URL = "http://127.0.0.1:8000/api/v1/screen-traveler"

def create_sample_card(text_lines, doc_name="SAMPLE"):
    """Creates a synthetic ID card image with clear text and a face rectangle for testing."""
    img = np.ones((400, 650, 3), dtype=np.uint8) * 245
    # Border
    cv2.rectangle(img, (10, 10), (640, 390), (40, 40, 40), 2)
    # Header banner
    cv2.rectangle(img, (10, 10), (640, 60), (30, 60, 120), -1)
    cv2.putText(img, doc_name, (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # Face portrait placeholder (left side)
    cv2.rectangle(img, (30, 90), (190, 290), (180, 180, 180), -1)
    cv2.rectangle(img, (30, 90), (190, 290), (80, 80, 80), 2)
    # Draw simple facial features for Haar cascade
    cv2.circle(img, (110, 160), 45, (220, 200, 180), -1) # face
    cv2.circle(img, (95, 150), 6, (60, 40, 30), -1)      # left eye
    cv2.circle(img, (125, 150), 6, (60, 40, 30), -1)     # right eye
    cv2.ellipse(img, (110, 185), (20, 10), 0, 0, 180, (60, 40, 30), 2) # smile
    
    # Draw text lines
    y = 110
    for line in text_lines:
        cv2.putText(img, line, (220, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 20), 2)
        y += 35
        
    _, buf = cv2.imencode(".jpg", img)
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("ascii")


def run_test(scenario_name, card_b64, qr_b64=None, selfie_b64=None, border_corridor="UNIVERSAL"):
    payload = {
        "card_front_image": card_b64,
        "qr_code_image": qr_b64 or card_b64,
        "live_webcam_frame": selfie_b64,
        "checkpoint_id": "ICP_BORDER_TEST",
        "officer_id": "TEST_OFFICER_01",
        "border_corridor": border_corridor
    }
    
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            data_res = res.get("data", {})
            print(f"\n========================================================", flush=True)
            print(f" [TEST] {scenario_name} [Corridor: {border_corridor}]")
            print(f"  Detected Type:   {data_res.get('documentType')}")
            print(f"  Applicant:       {data_res.get('applicantName')}")
            print(f"  ID Number:       {data_res.get('idNumber')}")
            print(f"  Gate Clearance:  {res.get('gate_decision')} ({res.get('data', {}).get('status')})")
            print(f"  Action:          {res.get('action_required')}")
            print(f"  Latency:         {res.get('total_latency_ms')} ms")
            print(f"========================================================")
            return res
    except Exception as e:
        print(f"FAILED {scenario_name}: {e}")
        return None

if __name__ == "__main__":
    print("Testing All Supported Document Types Against SATYAPAN API...\n")
    
    # 1. Driving Licence
    dl_card = create_sample_card([
        "DRIVING LICENCE",
        "DL No: DL-0420110012345",
        "Name: VIKRAMADITYA SINGH",
        "S/O: RAJENDRA SINGH",
        "DOB: 15/08/1992",
        "Valid Till: 14/08/2032"
    ], "UNION OF INDIA - DRIVING LICENCE")
    run_test("1. Indian Driving Licence", dl_card)
    
    # 2. PAN Card
    pan_card = create_sample_card([
        "INCOME TAX DEPARTMENT",
        "GOVT. OF INDIA",
        "Permanent Account Number",
        "ABCPS1234F",
        "Name: ARUN SHARMA",
        "Father's Name: SURESH SHARMA",
        "Date of Birth: 22/07/1985"
    ], "INCOME TAX DEPARTMENT")
    run_test("2. Indian PAN Card", pan_card)
    
    # 3. Voter ID Card (Election Commission of India)
    voter_card = create_sample_card([
        "ELECTION COMMISSION OF INDIA",
        "ELECTOR PHOTO IDENTITY CARD",
        "EPIC NO: WBH1234567",
        "Elector's Name: PRIYA SEN",
        "Father's Name: AMIT SEN",
        "Sex: Female",
        "DOB: 10/11/1996"
    ], "ELECTION COMMISSION OF INDIA")
    run_test("3. Voter ID Card (EPIC)", voter_card)
    
    # 4. Nepali Citizenship Certificate
    nepal_card = create_sample_card([
        "NEPAL GOVERNMENT",
        "CITIZENSHIP CERTIFICATE",
        "Certificate No: 27-01-78-04512",
        "Name: DIPENDRA CHHETRI",
        "Date of Birth: 2055-04-12",
        "District: KATHMANDU"
    ], "NEPAL CITIZENSHIP")
    run_test("4. Nepali Citizenship Certificate", nepal_card)

    # 5. Border Transit Permit
    transit_card = create_sample_card([
        "SSB BORDER CHECKPOST",
        "BORDER TRANSIT PERMIT",
        "Permit No: SSB-RAX-98214",
        "Traveler: MANOJ THAPA",
        "Route: RAXAUL - BIRGUNJ",
        "Valid Till: 2026-10-15"
    ], "SSB BORDER TRANSIT PERMIT")
    run_test("5. SSB Border Transit Permit", transit_card)

    # 6. Passport (ICAO Doc 9303 MRZ)
    passport_card = create_sample_card([
        "PASSPORT - REPUBLIC OF INDIA",
        "Given Name: AARAV",
        "Surname: SHARMA",
        "Passport No: Z2094321",
        "DOB: 12/04/1995",
        "Expiry: 11/04/2035",
        "P<INDSHARMA<<AARAV<<<<<<<<<<<<<<<<<<<<<<<<<<",
        "Z2094321<4IND9504128M3504118<<<<<<<<<<<<<<<4"
    ], "PASSPORT - REPUBLIC OF INDIA")
    run_test("6. Indian Passport (ICAO Doc 9303)", passport_card)

    # 7. Aadhaar Card Front Only
    aadhaar_front_card = create_sample_card([
        "GOVERNMENT OF INDIA",
        "AADHAAR - MERA AADHAAR MERI PEHCHAN",
        "Name: ROHIT VERMA",
        "DOB: 05/09/1998",
        "Gender: Male",
        "9876 5432 1096"
    ], "UNIQUE IDENTIFICATION AUTHORITY OF INDIA")
    run_test("7. Aadhaar Card (Front Only)", aadhaar_front_card)

    # 8. Bhutanese Citizen Identity Card (CID) - India ↔ Bhutan Border
    bhutan_cid_card = create_sample_card([
        "ROYAL GOVERNMENT OF BHUTAN",
        "CITIZEN IDENTITY CARD",
        "CID: 11502001234",
        "Name: TASHI DORJI",
        "Dzongkhag: THIMPHU",
        "DOB: 18/06/1991"
    ], "ROYAL GOVERNMENT OF BHUTAN")
    run_test("8. Bhutan Citizen Identity Card (CID)", bhutan_cid_card, border_corridor="INDO_BHUTAN")

    # 9. Minor Birth Certificate - India ↔ Bhutan Border
    birth_cert_card = create_sample_card([
        "GOVERNMENT OF INDIA",
        "MUNICIPAL CORPORATION - BIRTH CERTIFICATE",
        "Registration No: B-2021-987452",
        "Name of Child: KAVYA AGARWAL",
        "Father: RAJESH AGARWAL",
        "Mother: SUNITA AGARWAL",
        "Date of Birth: 04/11/2021"
    ], "BIRTH CERTIFICATE")
    run_test("9. Indian Minor Birth Certificate", birth_cert_card, border_corridor="INDO_BHUTAN")

    # 10. Third-Country Foreign Passport (Without Visa) - India ↔ Bhutan Border
    foreign_passport_card = create_sample_card([
        "PASSPORT - UNITED KINGDOM",
        "Given Name: JOHN",
        "Surname: SMITH",
        "Passport No: 502918234",
        "Nationality: GBR",
        "P<GBRSMITH<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
        "5029182344GBR8501015M3001018<<<<<<<<<<<<<<<2"
    ], "PASSPORT - UNITED KINGDOM")
    run_test("10. Third-Country Passport (Bhutan Gate Visa Check)", foreign_passport_card, border_corridor="INDO_BHUTAN")

    # 11. Bhutan Entry Permit / e-Visa
    bhutan_visa_card = create_sample_card([
        "ROYAL GOVERNMENT OF BHUTAN",
        "DEPARTMENT OF IMMIGRATION",
        "BHUTAN ENTRY PERMIT / E-VISA",
        "Permit No: BT-PARO-2026-8812",
        "Traveler: JOHN SMITH",
        "Entry Point: PHUENTSHOLING / PARO",
        "Valid Till: 2026-11-30"
    ], "BHUTAN ENTRY PERMIT")
    run_test("11. Bhutan Entry Permit / Visa", bhutan_visa_card, border_corridor="INDO_BHUTAN")

    # 12. Indian Voter ID on India ↔ Nepal Border
    voter_nepal_card = create_sample_card([
        "ELECTION COMMISSION OF INDIA",
        "ELECTOR PHOTO IDENTITY CARD",
        "EPIC NO: UBR9876543",
        "Elector's Name: SURESH YADAV",
        "Father's Name: RAMESH YADAV",
        "DOB: 12/03/1988"
    ], "ELECTION COMMISSION OF INDIA")
    run_test("12. Indian Voter ID (Indo-Nepal Treaty)", voter_nepal_card, border_corridor="INDO_NEPAL")

    # 13. Third-Country Foreign Passport (Without Visa) - India ↔ Nepal Border
    run_test("13. Third-Country Passport (Nepal Gate Visa Check)", foreign_passport_card, border_corridor="INDO_NEPAL")

    # 14. Nepal Entry Visa / Tourist Permit
    nepal_visa_card = create_sample_card([
        "DEPARTMENT OF IMMIGRATION NEPAL",
        "ENTRY VISA - TOURIST PERMIT",
        "Visa No: NP-V-2026-3021",
        "Traveler: JOHN SMITH",
        "Port of Entry: BIRGUNJ / KATHMANDU",
        "Valid Till: 2026-12-15"
    ], "NEPAL TOURIST VISA")
    run_test("14. Nepal Tourist / Entry Visa", nepal_visa_card, border_corridor="INDO_NEPAL")
