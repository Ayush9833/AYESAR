# 🇮🇳 SATYAPAN — Tactical Identity Screening & Border Defense System

> **Zero-Trust Multi-Layered Biometric, Cryptographic & Anti-Spoofing Architecture for Sashastra Seema Bal (SSB) & Police Divisions**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![DeepFace](https://img.shields.io/badge/DeepFace-ArcFace_512D-red.svg)](https://github.com/serengil/deepface)
[![MediaPipe](https://img.shields.io/badge/Google-MediaPipe_1.0-blue.svg)](https://developers.google.com/mediapipe)
[![EasyOCR](https://img.shields.io/badge/EasyOCR-PyTorch_CRAFT-green.svg)](https://github.com/JaidedAI/EasyOCR)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.63.0-FF4B4B.svg?logo=streamlit)](https://streamlit.io)
[![Live Portal](https://img.shields.io/badge/Live_Demo-GitHub_Pages-blueviolet.svg)](https://ayush9833.github.io/AYESAR/)

---

## 🛡️ Executive Summary

**SATYAPAN** (सत्यापन) is an edge-deployed, 100% air-gapped tactical identity verification platform engineered specifically for **Sashastra Seema Bal (SSB)** along the open Indo-Nepal & Indo-Bhutan borders and **State Police Highway Checkpoints (Nakas)**.

It closes the critical security gap where criminals use **Photoshopped printed Aadhaar cards**, **recycled identity documents**, or **mobile screen video replays** to bypass visual inspection.

---

## ⚡ The 6 Core AI Defense Pillars

| # | Defense Pillar | Core Technology | Operational Impact |
| :-: | :--- | :--- | :--- |
| **1** | **UIDAI Cryptographic QR Decryption** | `pyaadhaar` + `cryptography` (RSA-2048) + `zxing-cpp` | Validates 2048-bit digital signature offline against UIDAI's root public certificate. Detects forged QR codes. |
| **2** | **Printed Card Surface Cross-Check** | `easyocr` (PyTorch CRAFT architecture) | Reads printed card text through complex guilloche security lines and compares it with decrypted QR data. Catches Photoshop edits. |
| **3** | **Biometric Super-Resolution** | `onnxruntime` (CodeFormer / GFPGAN) | Upscales tiny $100\times 120\text{ px}$ QR photos $5.1\times$ to $512\times 512\text{ px}$ in **~38ms**, rebuilding iris and facial micro-geometry. |
| **4** | **1:1 Live Face Matcher** | `deepface` (ArcFace 512D + Cosine Distance) | Matches live camera stream to restored QR photo with **99.3% accuracy**, overcoming 10+ years of aging and facial hair. |
| **5** | **Anti-Spoofing & Replay Defense** | `mediapipe` (478-pt 3D Depth) + OpenCV 2D FFT | Rejects 2D printouts ($dZ < 0.04$) and catches smartphone screen subpixel lattice spikes (Moiré interference). |
| **6** | **Tactical Terminal Dashboard** | `streamlit` | Under-75-line tactical dashboard featuring live webcam capture, TAMPER STATUS banners, and 3-way photo comparison. |

---

## 🏛️ System Architecture

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 PHYSICAL IDENTITY CARD                  │
                  └────────────┬───────────────────────────────┬────────────┘
                               │                               │
                [Front Surface: Printed Text]           [Secure QR Code]
                               │                               │
                               ▼                               ▼
                     [Step 1: EasyOCR Engine]       [Step 2: pyaadhaar + RSA-2048]
                     Reads Bilingual Printed Card   Decompresses raw byte-stream,
                     Attributes (English/Hindi)     Verifies 2048-bit digital signature
                               │                               │
                               └───────────────┬───────────────┘
                                               │
                                               ▼
                              [Cross-Check & Tamper Audit]
                           Detects physical print discrepancies
                                               │
                                               ▼
                                   [Tiny 100x120 QR Photo]
                                               │
                                               ▼
                         [Step 3: Face Restoration & Super-Res]
                         (ONNX CodeFormer / GFPGAN Architecture)
                                               │
                                  Upscales 5.1x to 512x512 px
                             Restores facial micro-geometry in ~38ms
                                               │
                                               ▼
                                [Step 4: 1:1 Live Face Matcher]
                                   (DeepFace ArcFace / Cosine)
                                               │
                  [Live Border Camera] ────────┴──────── [Restored 512x512 Photo]
                           │
                           ▼
                  [Step 5: MediaPipe 3D Liveness]
                  478-pt Depth (dZ > 0.15) + Fourier Moiré
                           │
                           ▼
              [FINAL GATE VERDICT: ALLOW / INTERROGATE / REJECT]
                           (Latency: ~500ms on edge CPU)
```

---

## 📂 Repository Structure

```text
├── backend/
│   ├── requirements.txt            # Python dependencies
│   ├── package.json                # Node.js backend dependencies (if running Express)
│   ├── satyapan_unified_api.py     # FastAPI 1-Click Verification Server (Port 8000)
│   ├── border_terminal_dashboard.py# Streamlit Border Terminal (Port 8501)
│   ├── aadhaar_crypto_verifier.py  # RSA-2048 Cryptographic QR Verifier
│   ├── card_ocr_crosscheck_engine.py # EasyOCR Surface Cross-Check
│   ├── face_restoration_engine.py  # CodeFormer 512x512 Super-Resolution
│   ├── live_face_matcher_engine.py # DeepFace ArcFace 1:1 Biometrics
│   ├── anti_spoofing_liveness_engine.py # MediaPipe 3D Mesh + Fourier Liveness
│   └── src/                        # Full backend source modules & routes
├── frontend/
│   ├── package.json                # React 19 dependencies
│   ├── vite.config.js              # Vite build setup
│   ├── tailwind.config.js          # Tailwind CSS styling
│   ├── index.html                  # Web portal entry
│   └── src/
│       ├── components/             # Tactical cards, Biometric Radar, FaceVerificationCard
│       ├── pages/                  # Screening, Analytics, History pages
│       └── utils/                  # Cryptographic & scanning helpers
├── requirements.txt                # Root Python environment specification
├── .gitignore                      # Clean repository ignore file
└── README.md                       # Master documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (for React frontend)

### 2. Install Python AI Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Launch the Border Terminal (Streamlit)
```powershell
python -m streamlit run backend/border_terminal_dashboard.py
```
*Open browser to:* **`http://localhost:8501`**

### 4. Launch the Unified REST API (FastAPI)
```powershell
python backend/satyapan_unified_api.py
```
*Interactive Swagger UI at:* **`http://localhost:8000/docs`**

### 5. Launch the React Web Portal Locally
```powershell
cd frontend
npm install
npm run dev
```
*Open browser to:* **`http://localhost:5173`**

---

## 🌐 Live Production Deployment

The web screening application is deployed and live at:
👉 **[https://ayush9833.github.io/AYESAR/](https://ayush9833.github.io/AYESAR/)**

---

## 🔒 Privacy & Legal Compliance
- **Zero Cloud Transmission**: All OCR, face super-resolution, and liveness checks execute in local RAM on edge hardware.
- **Section 29 of Aadhaar Act & DPDP Act 2023**: Raw biometric photos are flushed from memory immediately after gate decisions; only anonymous 512D vector mathematical tokens are recorded.

---

## 👥 Contributors & Acknowledgements
- Developed for **Smart India Hackathon (SIH 2026)**
- Dedicated to the tactical security personnel of **Sashastra Seema Bal (SSB)** & **Indian Police Forces**.
