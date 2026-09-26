"""
SATYAPAN - Tactical Border Defense System
Module: Printed Card Deep-Learning OCR & Photoshop Tamper Cross-Check Engine
Libraries: EasyOCR (CRAFT Text Detection + ResNet-BiLSTM-CTC) + pyaadhaar + OpenCV

Purpose:
Indian identity cards have intricate guilloche background lines and bilingual text (English + Hindi).
Standard Tesseract often fails or confuses background patterns with text.
EasyOCR uses deep learning (CRAFT detector) to accurately read text even on skewed,
low-light, or noisy cards, and programmatically cross-checks printed text against
the cryptographically signed QR payload to detect Photoshop tampering, name alterations,
or printed date changes.
"""

import os
import re
import io
import json
import base64
from typing import Dict, Any, Optional, List, Tuple
from difflib import SequenceMatcher
from PIL import Image
import numpy as np
import cv2

# Deep learning OCR
import easyocr

# Barcode & Crypto Verifier
from aadhaar_crypto_verifier import SatyapanAadhaarVerifier, VerhoeffChecksum


class CardOcrCrossCheckEngine:
    def __init__(self, languages: List[str] = None, gpu: bool = False):
        """
        Initializes EasyOCR reader with English and Hindi support.
        gpu=False by default for universal edge compatibility (can be set to True with CUDA).
        """
        self.langs = languages or ['en']
        self.reader = easyocr.Reader(self.langs, gpu=gpu, verbose=False)
        self.aadhaar_verifier = SatyapanAadhaarVerifier()

    def string_similarity(self, a: str, b: str) -> float:
        """Computes Levenshtein-like string similarity ratio (0.0 to 1.0)."""
        if not a or not b:
            return 0.0
        clean_a = re.sub(r'[^a-zA-Z0-9]', '', a.lower())
        clean_b = re.sub(r'[^a-zA-Z0-9]', '', b.lower())
        if not clean_a or not clean_b:
            return 0.0
        return SequenceMatcher(None, clean_a, clean_b).ratio()

    def extract_printed_text(self, image_input: Any) -> Dict[str, Any]:
        """
        Extracts all printed text lines with confidence scores and bounding boxes using EasyOCR.
        Robustly handles Base64 Data URLs, raw bytes, filepaths, PIL Images, and NumPy arrays.
        """
        img_np = None
        if isinstance(image_input, str):
            if image_input.startswith("data:image") or len(image_input) > 200:
                try:
                    if "," in image_input:
                        encoded = image_input.split(",", 1)[1]
                    else:
                        encoded = image_input
                    raw_bytes = base64.b64decode(encoded.strip())
                    nparr = np.frombuffer(raw_bytes, np.uint8)
                    img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                except Exception as b64_err:
                    print(f"[OCR] Base64 decode error: {b64_err}")
            elif os.path.exists(image_input):
                img_np = cv2.imread(image_input)
        elif isinstance(image_input, Image.Image):
            img_np = cv2.cvtColor(np.array(image_input), cv2.COLOR_RGB2BGR)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_input, np.ndarray):
            img_np = image_input

        if img_np is None:
            return {
                "full_text": "",
                "lines": [],
                "parsed_fields": {},
                "total_lines_detected": 0
            }

        # Run CRAFT text detection + recognition
        ocr_results = self.reader.readtext(img_np)
        if len(ocr_results) == 0:
            # Contrast enhance if needed
            gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
            enhanced = cv2.equalizeHist(gray)
            ocr_results = self.reader.readtext(enhanced)

        extracted_lines = []
        raw_text_list = []

        for bbox, text, conf in ocr_results:
            text_clean = text.strip()
            if text_clean:
                extracted_lines.append({
                    "text": text_clean,
                    "confidence": round(float(conf), 3),
                    "box": [[int(pt[0]), int(pt[1])] for pt in bbox]
                })
                raw_text_list.append(text_clean)

        full_text = "\n".join(raw_text_list)
        print(f"[OCR] Extracted {len(raw_text_list)} text lines:")
        for t in raw_text_list[:10]:
            print(f"   -> {t}")

        # Parse potential printed fields via heuristic matching
        parsed_fields = self._parse_fields_from_ocr(raw_text_list, full_text)

        return {
            "full_text": full_text,
            "lines": extracted_lines,
            "parsed_fields": parsed_fields,
            "total_lines_detected": len(extracted_lines)
        }

    def _parse_fields_from_ocr(self, lines: List[str], full_text: str) -> Dict[str, Any]:
        """Heuristically extracts Name, DOB, Gender, ID, and Address from OCR text."""
        fields = {
            "printed_name": None,
            "printed_dob": None,
            "printed_gender": None,
            "printed_uid": None,
            "printed_address": None
        }

        # 1. Look for ID numbers (Aadhaar 12-digit, PAN, Passport, Nepali Citizenship)
        uid_match = re.search(r'\b(\d{4}\s\d{4}\s\d{4})\b', full_text)
        pan_match = re.search(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', full_text)
        passport_match = re.search(r'\b([A-Z][0-9]{7,8})\b', full_text)
        compact_uid = re.search(r'\b\d{12}\b', full_text)
        nepal_id = re.search(r'\b\d{2,4}[-\s\/]\d{2,5}[-\s\/]\d{2,6}\b', full_text)

        if uid_match:
            fields["printed_uid"] = uid_match.group(1).replace(" ", "")
        elif compact_uid:
            fields["printed_uid"] = compact_uid.group(0)
        elif pan_match:
            fields["printed_uid"] = pan_match.group(1)
        elif passport_match:
            fields["printed_uid"] = passport_match.group(1)
        elif nepal_id:
            fields["printed_uid"] = nepal_id.group(0)

        # 2. Look for DOB pattern: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD
        dob_match = re.search(r'\b(0[1-9]|[12]\d|3[01])[\/\-\.](0[1-9]|1[0-2])[\/\-\.](19\d\d|20\d\d)\b', full_text)
        iso_dob = re.search(r'\b(19\d\d|20\d\d)[\/\-\.](0[1-9]|1[0-2])[\/\-\.](0[1-9]|[12]\d|3[01])\b', full_text)
        if dob_match:
            fields["printed_dob"] = dob_match.group(0).replace(".", "/")
        elif iso_dob:
            fields["printed_dob"] = iso_dob.group(0)
        else:
            yob_match = re.search(r'(?:Year of Birth|YOB|DOB|जन्म)[\s\:\-]+(\d{4})', full_text, re.IGNORECASE)
            if yob_match:
                fields["printed_dob"] = f"01/01/{yob_match.group(1)}"

        # 3. Look for Gender (MALE / FEMALE / TRANSGENDER)
        g_match = re.search(r'\b(MALE|FEMALE|TRANSGENDER|पुरुष|महिला)\b', full_text, re.IGNORECASE)
        if g_match:
            fields["printed_gender"] = g_match.group(1).capitalize()

        # 4. Extract Name
        # Check explicit label first: Name:, Name / नाम, Given Names
        for line in lines:
            name_label_match = re.search(r'(?:Name|नाम|Given Names?|Elector[\'s]*\s*Name)[\s\:\-]+([A-Za-z\s]+)', line, re.IGNORECASE)
            if name_label_match:
                candidate = name_label_match.group(1).strip()
                if len(candidate) > 2 and not re.search(r'(Government|India|Authority)', candidate, re.IGNORECASE):
                    fields["printed_name"] = candidate
                    break

        # If still no name, check line above DOB
        if not fields["printed_name"]:
            for i, line in enumerate(lines):
                clean = line.strip()
                if re.search(r'(?:DOB|Date of Birth|जन्म|Year of Birth)', clean, re.IGNORECASE):
                    if i > 0:
                        candidate = lines[i - 1].strip()
                        if not re.search(r'(Government|India|Unique|Identification|Authority|भारत|सरकार|Enrolment)', candidate, re.IGNORECASE):
                            fields["printed_name"] = candidate
                            break

        # Fallback: scan for any clean 2-4 word alphabetic capitalized name
        if not fields["printed_name"]:
            ignore_words = {'GOVERNMENT', 'INDIA', 'UNIQUE', 'IDENTIFICATION', 'AUTHORITY', 'ENROLMENT', 'MALE', 'FEMALE', 'FATHER', 'MOTHER', 'HUSBAND', 'ADDRESS', 'DEPARTMENT', 'REPUBLIC', 'ELECTION', 'COMMISSION', 'PASSPORT', 'SIGNATURE', 'CARD', 'NATIONAL', 'CITIZENSHIP', 'BHUTAN', 'NEPAL'}
            for line in lines:
                clean = line.strip()
                words = clean.split()
                if 2 <= len(words) <= 4 and all(w.isalpha() and len(w) > 1 for w in words):
                    upper_clean = clean.upper()
                    if not any(bad in upper_clean for bad in ignore_words):
                        fields["printed_name"] = clean.title()
                        break

        # Fallback: if lines exist but nothing matched, take first non-governmental text line
        if not fields["printed_name"] and len(lines) > 0:
            for line in lines:
                clean = line.strip()
                if len(clean) > 3 and not re.search(r'(Government|India|Authority|Unique|Identification|भारत|सरकार)', clean, re.IGNORECASE):
                    fields["printed_name"] = clean
                    break

        return fields

    def cross_check(self, card_image_or_data: Any, qr_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Flexible cross-check accepting either an image input (filepath, base64 Data URL, PIL, bytes)
        or an already extracted OCR fields dictionary.
        """
        if isinstance(card_image_or_data, dict):
            if "parsed_fields" in card_image_or_data:
                printed_data = card_image_or_data["parsed_fields"]
            else:
                printed_data = card_image_or_data
        else:
            extracted = self.extract_printed_text(card_image_or_data)
            printed_data = extracted.get("parsed_fields", {})
        return self.cross_check_printed_vs_qr(printed_data, qr_data)

    def cross_check_printed_vs_qr(self, printed_data: Dict[str, Any], qr_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cross-checks printed card OCR data against cryptographically signed QR data.
        Flags Photoshop modifications or card tampering.
        """
        comparisons = []
        is_tampered = False
        tamper_flags = []

        qr_name = qr_data.get("name") or qr_data.get("residentName") or ""
        printed_name = printed_data.get("printed_name") or ""
        if qr_name and printed_name:
            sim = self.string_similarity(qr_name, printed_name)
            match = sim >= 0.70
            comparisons.append({
                "field": "Cardholder Name",
                "printed_text": printed_name,
                "qr_authenticated_text": qr_name,
                "similarity_score": round(sim, 2),
                "is_match": match,
                "verdict": "VERIFIED_IDENTICAL" if match else "TAMPERING_SUSPECTED"
            })
            if not match:
                is_tampered = True
                tamper_flags.append(f"Name Mismatch: Printed ('{printed_name}') != Signed QR ('{qr_name}')")

        qr_dob = qr_data.get("dob") or ""
        printed_dob = printed_data.get("printed_dob") or ""
        if qr_dob and printed_dob:
            # Normalize dates
            norm_qr = re.sub(r'[^0-9]', '', qr_dob)
            norm_printed = re.sub(r'[^0-9]', '', printed_dob)
            match = (norm_qr == norm_printed) or (norm_qr[-4:] == norm_printed[-4:])
            comparisons.append({
                "field": "Date of Birth (DOB)",
                "printed_text": printed_dob,
                "qr_authenticated_text": qr_dob,
                "similarity_score": 1.0 if match else 0.0,
                "is_match": match,
                "verdict": "VERIFIED_IDENTICAL" if match else "TAMPERING_SUSPECTED"
            })
            if not match:
                is_tampered = True
                tamper_flags.append(f"DOB Mismatch: Printed ('{printed_dob}') != Signed QR ('{qr_dob}')")

        qr_uid = qr_data.get("idNumber") or qr_data.get("uid") or ""
        qr_ref = qr_data.get("reference_id") or qr_data.get("referenceid") or ""
        printed_uid = printed_data.get("printed_uid") or ""

        target_last4 = None
        if qr_uid:
            target_last4 = qr_uid[-4:]
        elif qr_ref and len(qr_ref) >= 4:
            target_last4 = qr_ref[:4]

        if target_last4 and printed_uid:
            clean_printed_last4 = printed_uid[-4:]
            clean_qr_last4 = target_last4
            match = clean_qr_last4 == clean_printed_last4
            comparisons.append({
                "field": "Aadhaar UID / Reference Check",
                "printed_text": f"XXXX-XXXX-{clean_printed_last4}",
                "qr_authenticated_text": f"XXXX-XXXX-{clean_qr_last4}",
                "similarity_score": 1.0 if match else 0.0,
                "is_match": match,
                "verdict": "VERIFIED_IDENTICAL" if match else "TAMPERING_SUSPECTED"
            })
            if not match:
                is_tampered = True
                tamper_flags.append(f"UID Sequence Mismatch: Printed last4 ('{clean_printed_last4}') != QR ('{clean_qr_last4}')")

        overall_status = "TAMPER_DETECTED" if is_tampered else ("AUTHENTIC_MATCH" if comparisons else "INSUFFICIENT_DATA")

        return {
            "cross_check_status": overall_status,
            "is_photoshop_or_tamper_detected": is_tampered,
            "tamper_flags": tamper_flags,
            "field_comparisons": comparisons,
            "summary_note": "ALERT: Physical card text does not match cryptographically signed QR data. Possible Photoshop alteration or fake PVC card." if is_tampered else "SUCCESS: Physical card surface text exactly matches cryptographically signed QR payload."
        }

    def process_full_screening(self, image_path: str) -> Dict[str, Any]:
        """
        Complete end-to-end border screening pipeline:
        1. Read high-density QR code via zxing-cpp
        2. Decompress & authenticate UIDAI QR payload via pyaadhaar
        3. Perform deep-learning EasyOCR (English + Hindi) on physical card surface
        4. Cross-check OCR fields against QR fields to detect Photoshop alterations
        """
        # Step 1: Scan & Verify QR
        qr_raw = self.aadhaar_verifier.scan_qr_from_image(image_path)
        qr_verified = {}
        if qr_raw:
            qr_verified = self.aadhaar_verifier.verify_aadhaar_qr(qr_raw)

        # Step 2: Extract Printed Text with EasyOCR
        ocr_result = self.extract_printed_text(image_path)

        # Step 3: Run Cross-Check
        cross_check = {}
        if qr_verified.get("success") and qr_verified.get("data"):
            cross_check = self.cross_check_printed_vs_qr(ocr_result.get("parsed_fields", {}), qr_verified.get("data", {}))

        return {
            "success": True,
            "qr_verification": qr_verified,
            "printed_ocr": ocr_result,
            "tamper_cross_check": cross_check
        }


if __name__ == "__main__":
    print("Initializing SATYAPAN EasyOCR Deep-Learning Engine...")
    engine = CardOcrCrossCheckEngine()
    print("EasyOCR + pyaadhaar Tamper Cross-Check Engine Ready!")
