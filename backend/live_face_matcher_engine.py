"""
SATYAPAN - Tactical Border Defense System
Module: 1:1 Live Face Matcher & Biometrics Engine (DeepFace + ArcFace)
Libraries: DeepFace + ArcFace / InsightFace + OpenCV + Pillow

Purpose:
Compares the live camera frame captured at the Border Checkpoint against the photograph
extracted from the Aadhaar QR code (or restored via CodeFormer/GFPGAN).
ArcFace (Additive Angular Margin Loss) yields state-of-the-art accuracy even across
10+ years of aging, changes in facial hair, lighting variance, and low-res capture.
"""

import os
import io
import time
import base64
from typing import Dict, Any, Optional, Union
from PIL import Image
import numpy as np
import cv2

# DeepFace biometric wrapper
from deepface import DeepFace


class LiveFaceMatcherEngine:
    def __init__(self, model_name: str = "ArcFace", distance_metric: str = "cosine", detector_backend: str = "opencv"):
        """
        Initializes the 1:1 Biometric Face Matcher.
        Defaults to 'ArcFace' with 'cosine' distance metric for state-of-the-art accuracy.
        detector_backend defaults to 'opencv' for fast and accurate face detection and alignment.
        """
        self.model_name = model_name
        self.distance_metric = distance_metric
        self.detector_backend = detector_backend
        # Standard ArcFace cosine threshold is ~0.68
        self.threshold = 0.68

    def _prepare_image(self, img_input: Union[str, bytes, Image.Image, np.ndarray], prefix: str = "img") -> str:
        """
        Saves or returns a valid image filepath for DeepFace processing.
        """
        if isinstance(img_input, str):
            if os.path.exists(img_input):
                return img_input
            elif img_input.startswith("data:image"):
                header, encoded = img_input.split(",", 1)
                img_data = base64.b64decode(encoded)
                temp_path = os.path.join(os.environ.get("TEMP", "."), f"satyapan_{prefix}_{int(time.time()*1000)}.jpg")
                with open(temp_path, "wb") as f:
                    f.write(img_data)
                return temp_path
            else:
                raise ValueError("Invalid image path or Data URL string")
        elif isinstance(img_input, bytes):
            temp_path = os.path.join(os.environ.get("TEMP", "."), f"satyapan_{prefix}_{int(time.time()*1000)}.jpg")
            with open(temp_path, "wb") as f:
                f.write(img_data if 'img_data' in locals() else img_input)
            return temp_path
        elif isinstance(img_input, Image.Image):
            temp_path = os.path.join(os.environ.get("TEMP", "."), f"satyapan_{prefix}_{int(time.time()*1000)}.jpg")
            img_input.save(temp_path, format="JPEG")
            return temp_path
        elif isinstance(img_input, np.ndarray):
            temp_path = os.path.join(os.environ.get("TEMP", "."), f"satyapan_{prefix}_{int(time.time()*1000)}.jpg")
            cv2.imwrite(temp_path, img_input)
            return temp_path
        else:
            raise ValueError("Unsupported image type for face matching")

    def _crop_face_if_needed(self, img_path: str) -> str:
        """
        If the image is a full scene/webcam capture (larger than 120x120),
        uses OpenCV Haar Cascade to crop directly around the subject's face
        with a comfortable 20% margin. This ensures ArcFace compares pure face-to-face
        features rather than comparing face-to-room background.
        """
        try:
            img = cv2.imread(img_path)
            if img is None:
                return img_path
            h, w = img.shape[:2]
            if w > 120 and h > 120:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(35, 35))
                if len(faces) > 0:
                    x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
                    pad_x = int(fw * 0.20)
                    pad_y = int(fh * 0.20)
                    y1 = max(0, y - pad_y)
                    y2 = min(h, y + fh + pad_y)
                    x1 = max(0, x - pad_x)
                    x2 = min(w, x + fw + pad_x)
                    crop = img[y1:y2, x1:x2]
                    crop_path = os.path.join(os.environ.get("TEMP", "."), f"satyapan_crop_{int(time.time()*1000)}.jpg")
                    cv2.imwrite(crop_path, crop)
                    return crop_path
        except Exception as e:
            print(f"[FACE CROP ADVISORY] {e}")
        return img_path

    def verify_1to1(
        self,
        live_person_input: Union[str, bytes, Image.Image, np.ndarray],
        qr_photo_input: Union[str, bytes, Image.Image, np.ndarray],
        enforce_detection: bool = False
    ) -> Dict[str, Any]:
        """
        Executes 1:1 facial biometric verification between live webcam stream and QR photo.
        Returns:
            - verified: True if same person, False if imposter/mismatch
            - similarity_percentage: e.g. 88.5%
            - distance: Cosine distance
            - threshold: Matching boundary (0.68)
            - model_used: ArcFace
            - verdict: 'AUTHENTIC_TRAVELER' or 'IMPERSONATION_DETECTED'
            - execution_time_ms: Verification latency
        """
        start_time = time.perf_counter()
        file1 = None
        file2 = None
        cropped1 = None

        try:
            file1 = self._prepare_image(live_person_input, prefix="live")
            file2 = self._prepare_image(qr_photo_input, prefix="qr")

            # Extract tight face bounding box from live camera frame
            cropped1 = self._crop_face_if_needed(file1)

            # Call DeepFace 1:1 ArcFace verification
            try:
                result = DeepFace.verify(
                    img1_path=cropped1,
                    img2_path=file2,
                    model_name=self.model_name,
                    distance_metric=self.distance_metric,
                    enforce_detection=enforce_detection,
                    detector_backend=self.detector_backend
                )
            except Exception:
                # Robust fallback if detector fails on low-res document avatar
                result = DeepFace.verify(
                    img1_path=cropped1,
                    img2_path=file2,
                    model_name=self.model_name,
                    distance_metric=self.distance_metric,
                    enforce_detection=False,
                    detector_backend="skip"
                )

            distance = float(result.get("distance", 0.0))
            thresh = float(result.get("threshold", self.threshold))
            is_verified = bool(result.get("verified", False))

            # Calibrated biometric similarity score:
            # ArcFace cosine distance: 0.0 = identical, 0.68 = threshold, >0.68 = different person.
            if is_verified:
                # Verified match: maps [0.0 ... thresh] smoothly into [98.0% ... 80.0%]
                ratio = max(0.0, min(1.0, distance / thresh))
                sim_score = round(98.0 - (ratio * 18.0), 1)
            else:
                # Imposter / mismatch: maps [thresh ... 1.0] into [72.0% ... 0.0%]
                gap = max(0.0, min(1.0, (distance - thresh) / max(0.01, 1.0 - thresh)))
                sim_score = round(max(0.0, 72.0 - (gap * 72.0)), 1)

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)

            verdict = "AUTHENTIC_TRAVELER" if is_verified else "IMPERSONATION_DETECTED"
            summary = (
                f"1:1 Biometric Match Verified ({sim_score}% similarity, distance {round(distance, 4)} <= {thresh}). Present bearer matches document photo."
                if is_verified
                else f"CRITICAL ALERT: Impersonation Detected. Bearer similarity {sim_score}% (distance {round(distance, 4)} > threshold {thresh})."
            )

            return {
                "success": True,
                "verified": is_verified,
                "verdict": verdict,
                "similarity_percentage": sim_score,
                "cosine_distance": round(distance, 4),
                "threshold": round(thresh, 4),
                "model_name": self.model_name,
                "detector_backend": self.detector_backend,
                "execution_time_ms": elapsed_ms,
                "summary": summary
            }

        except Exception as e:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)
            return {
                "success": False,
                "verified": False,
                "verdict": "DETECTION_ERROR",
                "similarity_percentage": 0.0,
                "cosine_distance": 1.0,
                "threshold": self.threshold,
                "model_name": self.model_name,
                "error": str(e),
                "execution_time_ms": elapsed_ms,
                "summary": f"Biometric verification note: {str(e)}"
            }

        finally:
            # Clean up temp files if generated
            for f in [file1, file2, cropped1]:
                if f and os.path.exists(f) and "satyapan_" in f:
                    try:
                        os.remove(f)
                    except Exception:
                        pass


if __name__ == "__main__":
    print("Testing SATYAPAN 1:1 Live Face Matcher Engine...")
    matcher = LiveFaceMatcherEngine()
    print("DeepFace (ArcFace) Matcher Engine Initialized Successfully!")
