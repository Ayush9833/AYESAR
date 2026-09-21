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
    def __init__(self, model_name: str = "ArcFace", distance_metric: str = "cosine", detector_backend: str = "skip"):
        """
        Initializes the 1:1 Biometric Face Matcher.
        Defaults to 'ArcFace' with 'cosine' distance metric for state-of-the-art accuracy.
        detector_backend defaults to 'skip' for direct high-speed embedding comparison of face crops.
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
                f.write(img_input)
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
            - similarity_percentage: e.g. 96.4%
            - distance: Cosine distance
            - threshold: Matching boundary (0.68)
            - model_used: ArcFace
            - verdict: 'AUTHENTIC_TRAVELER' or 'IMPERSONATION_DETECTED'
            - execution_time_ms: Verification latency
        """
        start_time = time.perf_counter()
        file1 = None
        file2 = None

        try:
            file1 = self._prepare_image(live_person_input, prefix="live")
            file2 = self._prepare_image(qr_photo_input, prefix="qr")

            # Call DeepFace 1:1 ArcFace verification
            result = DeepFace.verify(
                img1_path=file1,
                img2_path=file2,
                model_name=self.model_name,
                distance_metric=self.distance_metric,
                enforce_detection=enforce_detection,
                detector_backend=self.detector_backend
            )

            distance = float(result.get("distance", 0.0))
            thresh = float(result.get("threshold", self.threshold))
            is_verified = bool(result.get("verified", False))

            # Normalize similarity score to percentage [0% - 100%]
            # For cosine distance (0.0 = identical, 1.0 = completely different)
            sim_score = max(0.0, min(100.0, (1.0 - (distance / max(thresh * 1.5, 1.0))) * 100.0))
            sim_score = round(sim_score, 1)

            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 1)

            verdict = "AUTHENTIC_TRAVELER" if is_verified else "IMPERSONATION_DETECTED"
            summary = (
                f"1:1 Biometric Match Verified ({sim_score}% confidence). Present bearer matches document photo."
                if is_verified
                else f"CRITICAL ALERT: Impersonation Detected. Bearer similarity {sim_score}% falls below threshold {thresh}."
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
            # Fallback for synthetic/testing environments without crashing
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
            for f in [file1, file2]:
                if f and os.path.exists(f) and "satyapan_" in f:
                    try:
                        os.remove(f)
                    except Exception:
                        pass


if __name__ == "__main__":
    print("Testing SATYAPAN 1:1 Live Face Matcher Engine...")
    matcher = LiveFaceMatcherEngine()
    print("DeepFace (ArcFace) Matcher Engine Initialized Successfully!")
