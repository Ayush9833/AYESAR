"""
SATYAPAN Zero-Tolerance Security Verification Suite
Tests that ANY document with ANY error, tamper, expiration, or mismatch is STRICTLY DENIED passage.
"""

import json
import base64
import urllib.request
import cv2
import numpy as np

API_URL = "http://127.0.0.1:8000/api/v1/screen-traveler"

def create_card_image(text_lines, title="DOCUMENT"):
    img = np.ones((400, 650, 3), dtype=np.uint8) * 245
    cv2.rectangle(img, (10, 10), (640, 390), (40, 40, 40), 2)
    cv2.rectangle(img, (10, 10), (640, 60), (30, 60, 120), -1)
    cv2.putText(img, title, (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # Face portrait
    cv2.rectangle(img, (30, 90), (190, 290), (180, 180, 180), -1)
    cv2.circle(img, (110, 160), 45, (220, 200, 180), -1)
    cv2.circle(img, (95, 150), 6, (60, 40, 30), -1)
    cv2.circle(img, (125, 150), 6, (60, 40, 30), -1)
    cv2.ellipse(img, (110, 185), (20, 10), 0, 0, 180, (60, 40, 30), 2)
    
    y = 110
    for line in text_lines:
        cv2.putText(img, line, (220, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 20), 2)
        y += 35
        
    _, buf = cv2.imencode(".jpg", img)
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode("ascii")


def test_scenario(name, card_b64, corridor="UNIVERSAL", selfie_b64=None, expected_decision=None):
    payload = {
        "card_front_image": card_b64,
        "qr_code_image": card_b64,
        "live_webcam_frame": selfie_b64,
        "checkpoint_id": "ICP_ZERO_TOLERANCE_TEST",
        "officer_id": "SSB_CHIEF_INSPECTOR",
        "border_corridor": corridor
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            decision = res.get("gate_decision")
            action = res.get("action_required")
            status = res.get("data", {}).get("status")
            risk = res.get("data", {}).get("riskScore")
            
            # Zero-Tolerance assertion: It MUST NOT be ALLOW_PASSAGE and MUST NOT be VERIFIED
            is_blocked = (decision != "ALLOW_PASSAGE" and status != "VERIFIED")
            
            print(f"\n========================================================")
            print(f" [TEST ERROR DEFENSE] {name}")
            print(f"  Gate Clearance:     {decision}")
            print(f"  Status Label:       {status}")
            print(f"  Risk Score:         {risk}/100")
            print(f"  Action / Reason:    {action}")
            print(f"  ZERO-TOLERANCE:     {'[PASSED] VISITOR STRICTLY BLOCKED' if is_blocked else '[FAILED] VISITOR WAS MISTAKENLY ALLOWED'}")
            print(f"========================================================")
            return is_blocked
    except Exception as e:
        print(f"Error testing {name}: {e}")
        return False


if __name__ == "__main__":
    print("Testing Zero-Tolerance Error Defense in SATYAPAN Border System...\n")
    results = []

    # 1. Expired Passport
    expired_passport = create_card_image([
        "PASSPORT - REPUBLIC OF INDIA",
        "Given Name: VIKRAM",
        "Surname: SINGH",
        "Passport No: Z9012345",
        "DOB: 12/04/1990",
        "Expiry: 11/04/2021"  # EXPIRED!
    ], "PASSPORT - REPUBLIC OF INDIA")
    results.append(test_scenario("1. Expired Indian Passport (Expired 2021)", expired_passport))

    # 2. Expired Driving Licence
    expired_dl = create_card_image([
        "DRIVING LICENCE",
        "DL No: DL-0420110019999",
        "Name: ROHAN SHARMA",
        "DOB: 15/08/1988",
        "Valid Till: 14/08/2020"  # EXPIRED!
    ], "DRIVING LICENCE")
    results.append(test_scenario("2. Expired Driving Licence (Expired 2020)", expired_dl))

    # 3. Invalid PAN Card Format (Malformed ID number)
    bad_pan = create_card_image([
        "INCOME TAX DEPARTMENT",
        "GOVT. OF INDIA",
        "Permanent Account Number",
        "12345ABCDE",  # MALFORMED! (Starts with numbers instead of letters)
        "Name: RAHUL MEHRA",
        "Date of Birth: 22/07/1985"
    ], "INCOME TAX DEPARTMENT")
    results.append(test_scenario("3. Malformed PAN Card (12345ABCDE)", bad_pan))

    # 4. Invalid Bhutan Citizen ID (Only 8 digits instead of statutory 11)
    short_cid = create_card_image([
        "ROYAL GOVERNMENT OF BHUTAN",
        "CITIZEN IDENTITY CARD",
        "CID No: 11502001",  # INVALID LENGTH!
        "Name: DORJI WANGCHUK",
        "DOB: 18/06/1991"
    ], "ROYAL GOVERNMENT OF BHUTAN")
    results.append(test_scenario("4. Invalid Bhutan CID (8 digits)", short_cid, corridor="INDO_BHUTAN"))

    # 5. Invalid Aadhaar Number (Fails Verhoeff D5 Checksum)
    bad_aadhaar = create_card_image([
        "GOVERNMENT OF INDIA",
        "AADHAAR - MERA AADHAAR MERI PEHCHAN",
        "Name: SUNIL KUMAR",
        "DOB: 05/09/1998",
        "9876 5432 1098"  # FAILS VERHOEFF CHECKSUM!
    ], "AADHAAR CARD")
    results.append(test_scenario("5. Aadhaar with Invalid Verhoeff Checksum", bad_aadhaar))

    # 6. Third-Country Visitor to Bhutan Without Visa
    foreign_doc = create_card_image([
        "PASSPORT - UNITED STATES OF AMERICA",
        "Given Name: ROBERT",
        "Surname: TAYLOR",
        "Passport No: 789123456",
        "Nationality: USA",
        "Expiry: 2032-10-15"
    ], "PASSPORT - UNITED STATES")
    results.append(test_scenario("6. Third-Country Passport at Bhutan Gate (No Visa)", foreign_doc, corridor="INDO_BHUTAN"))

    # 7. Third-Country Visitor to Nepal Without Visa
    results.append(test_scenario("7. Third-Country Passport at Nepal Gate (No Visa)", foreign_doc, corridor="INDO_NEPAL"))

    # 8. Inadmissible Document: Indian Citizen attempting Bhutan Border with PAN Card
    pan_doc = create_card_image([
        "INCOME TAX DEPARTMENT",
        "GOVT. OF INDIA",
        "Permanent Account Number",
        "ABCPS1234F",
        "Name: ARUN SHARMA",
        "Date of Birth: 22/07/1985"
    ], "INCOME TAX DEPARTMENT")
    results.append(test_scenario("8. Indian Citizen attempting Bhutan Border with PAN Card", pan_doc, corridor="INDO_BHUTAN"))

    # 9. Inadmissible Document: Indian Citizen attempting Nepal Border with Driving Licence
    dl_doc = create_card_image([
        "DRIVING LICENCE",
        "DL No: DL-0420110012345",
        "Name: VIKRAMADITYA SINGH",
        "DOB: 15/08/1992",
        "Valid Till: 14/08/2032"
    ], "DRIVING LICENCE")
    results.append(test_scenario("9. Indian Citizen attempting Nepal Border with Driving Licence", dl_doc, corridor="INDO_NEPAL"))

    print(f"\n========================================================")
    print(f" ZERO-TOLERANCE SUITE SUMMARY:")
    print(f" Total Tests Run:    {len(results)}")
    print(f" Blocked & Denied:   {sum(1 for r in results if r)}")
    print(f" Mistakenly Allowed: {sum(1 for r in results if not r)}")
    print(f" Success Rate:       {sum(1 for r in results if r) / len(results) * 100:.1f}%")
    print(f"========================================================")
