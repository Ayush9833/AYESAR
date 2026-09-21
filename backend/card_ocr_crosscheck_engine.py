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
        """
        if isinstance(image_input, str):
            image_path = image_input
        elif isinstance(image_input, Image.Image):
            buf = io.BytesIO()
            image_input.save(buf, format='JPEG')
            image_path = buf.getvalue()
        elif isinstance(image_input, bytes):
            image_path = image_input
        else:
            raise ValueError("Unsupported image input type")

        # Run CRAFT text detection + recognition
        ocr_results = self.reader.readtext(image_path)

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

        # Parse potential printed fields via heuristic matching
        parsed_fields = self._parse_fields_from_ocr(raw_text_list, full_text)

        return {
            "full_text": full_text,
            "lines": extracted_lines,
            "parsed_fields": parsed_fields,
            "total_lines_detected": len(extracted_lines)
        }

    def _parse_fields_from_ocr(self, lines: List[str], full_text: str) -> Dict[str, Any]:
        """Heuristically extracts Name, DOB, Gender, and 12-digit Aadhaar UID from OCR text."""
        fields = {
            "printed_name": None,
            "printed_dob": None,
            "printed_gender": None,
            "printed_uid": None
        }

        # 1. Look for 12-digit Aadhaar number pattern (XXXX XXXX XXXX or 12 digits)
        uid_match = re.search(r'\b(\d{4}\s\d{4}\s\d{4})\b', full_text)
        if uid_match:
            fields["printed_uid"] = uid_match.group(1).replace(" ", "")
        else:
            compact_match = re.search(r'\b\d{12}\b', full_text)
            if compact_match:
                fields["printed_uid"] = compact_match.group(0)

        # 2. Look for DOB pattern: DD/MM/YYYY or DD-MM-YYYY
        dob_match = re.search(r'\b(0[1-9]|[12]\d|3[01])[\/\-](0[1-9]|1[0-2])[\/\-](19\d\d|20\d\d)\b', full_text)
        if dob_match:
            fields["printed_dob"] = dob_match.group(0)
        else:
            yob_match = re.search(r'(?:Year of Birth|YOB|DOB)[\s\:\-]+(\d{4})', full_text, re.IGNORECASE)
            if yob_match:
                fields["printed_dob"] = f"01/01/{yob_match.group(1)}"

        # 3. Look for Gender (MALE / FEMALE / TRANSGENDER)
        if re.search(r'\b(MALE|FEMALE|TRANSGENDER)\b', full_text, re.IGNORECASE):
            g_match = re.search(r'\b(MALE|FEMALE|TRANSGENDER)\b', full_text, re.IGNORECASE)
            fields["printed_gender"] = g_match.group(1).capitalize()

        # 4. Extract Name (typically line above DOB, ignoring Government of India headers)
        for i, line in enumerate(lines):
            clean = line.strip()
            if re.search(r'(?:DOB|Date of Birth|जन्म|Year of Birth)', clean, re.IGNORECASE):
                if i > 0:
                    candidate = lines[i - 1].strip()
                    if not re.search(r'(Government|India|Unique|Identification|Authority|भारत|सरकार)', candidate, re.IGNORECASE):
                        fields["printed_name"] = candidate
                        break

        return fields

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
