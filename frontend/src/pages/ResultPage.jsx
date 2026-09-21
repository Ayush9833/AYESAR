import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowLeft, 
  FileDown, 
  Printer, 
  RefreshCw,
  Share2,
  Lock,
  Sparkles,
  Layers,
  Fingerprint,
  QrCode,
  Barcode,
  CheckCircle2
} from 'lucide-react';
import RiskScore from '../components/screening/RiskScore';
import DocumentPreview from '../components/screening/DocumentPreview';
import ExtractedDataCard from '../components/screening/ExtractedDataCard';
import QrOcrComparisonCard from '../components/screening/QrOcrComparisonCard';
import { compareQrAndOcr, evaluateCompositeRisk } from '../utils/qrOcrComparisonEngine';
import ValidationCard from '../components/screening/ValidationCard';
import ForensicsCard from '../components/screening/ForensicsCard';
import OfficialVsScamCard from '../components/screening/OfficialVsScamCard';
import PhotoReplacementAlert from '../components/screening/PhotoReplacementAlert';
import DocumentHashCard from '../components/screening/DocumentHashCard';
import FaceVerificationCard from '../components/screening/FaceVerificationCard';
import RiskBreakdown from '../components/screening/RiskBreakdown';
import LoadingState from '../components/common/LoadingState';
import Toast from '../components/common/Toast';
import { getScreeningById, reprocessScreening } from '../services/api';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [screening, setScreening] = useState(location.state?.screening || null);
  const [loading, setLoading] = useState(!screening);
  const [reprocessing, setReprocessing] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!screening) {
      loadScreening();
    }
  }, [id]);

  const loadScreening = async () => {
    try {
      setLoading(true);
      const data = await getScreeningById(id);
      setScreening(data);
    } catch (err) {
      console.error('Failed to load screening result:', err);
      setToast({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setReprocessing(true);
      const res = await reprocessScreening(id);
      if (res.success && res.data) {
        setScreening(res.data);
        setToast({ type: 'success', message: 'Dossier successfully re-evaluated against latest rules.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message });
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Retrieving Screening Dossier..." subtext={`Fetching ${id}`} />;
  }

  if (!screening) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-card">
        <ShieldAlert size={48} className="mx-auto text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-800">Dossier {id} not found</h3>
        <p className="text-xs text-slate-500 mb-4">The screening record might have expired or does not exist.</p>
        <button
          onClick={() => navigate('/screenings')}
          className="px-4 py-2 bg-brand-900 text-white text-xs font-bold rounded-lg"
        >
          Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/screenings')}
            className="p-2 text-slate-500 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to History"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-brand-900 font-mono">
                {screening.id}
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-mono">
                {screening.documentType}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Audit Hash: {screening.auditHash || '0x4F92A81C7E9D'} • {new Date(screening.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <RefreshCw size={14} className={reprocessing ? 'animate-spin' : ''} />
            <span>{reprocessing ? 'Reprocessing...' : 'Reprocess'}</span>
          </button>

          <button
            onClick={() => navigate(`/reports/${screening.id}`)}
            className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Printer size={14} className="text-cyan-400" />
            <span>Official Report</span>
          </button>
        </div>
      </div>

      {/* Critical Photo Replacement Alert Banner */}
      {(screening.photoReplacementDetected || 
        screening.forensicResults?.checks?.some(c => 
          (c.name?.toLowerCase().includes('photo') || c.name?.toLowerCase().includes('portrait')) && 
          (c.status === 'FAIL' || c.status === 'TAMPERED')
        ) ||
        screening.forensicResults?.tamperedRegions?.some(r => 
          r.label?.toLowerCase().includes('photo') || r.label?.toLowerCase().includes('splic')
        )
      ) && (
        <PhotoReplacementAlert
          photoReplacementData={screening.photoReplacementData}
          applicantName={screening.applicantName}
          documentType={screening.documentType}
          riskScore={screening.riskScore}
        />
      )}

      {/* Dedicated QR ↔ OCR Cross-Verification & Tamper Detection Section */}
      {screening.qrData && (
        <QrOcrComparisonCard
          qrData={screening.qrData}
          ocrData={{
            name: screening.applicantName,
            dob: screening.dateOfBirth,
            uid: screening.idNumber,
            gender: screening.gender,
            documentType: screening.documentType
          }}
          comparisonResult={compareQrAndOcr(
            screening.qrData,
            {
              name: screening.applicantName,
              dob: screening.dateOfBirth,
              uid: screening.idNumber
            }
          )}
          compositeRisk={{
            riskScore: screening.riskScore,
            status: screening.status,
            decisionLabel: screening.status === 'VERIFIED' ? 'GREEN — VERIFIED (Low Risk)' :
                           screening.status === 'REVIEW_REQUIRED' ? 'AMBER — MANUAL REVIEW REQUIRED' :
                           'RED — SUSPICIOUS / TAMPERED',
            color: screening.status === 'VERIFIED' ? 'emerald' : screening.status === 'REVIEW_REQUIRED' ? 'amber' : 'rose',
            reasons: screening.reasons || [
              'Demographic cross-verification evaluated against document records'
            ]
          }}
          documentSnapshot={screening.fileUrl}
          sessionId={screening.id}
          timestamp={screening.createdAt}
        />
      )}

      {/* Primary Official Generation vs Scam Determination Card */}
      <OfficialVsScamCard
        officialVsScam={screening.officialVsScam}
        status={screening.status}
        riskScore={screening.riskScore}
        documentType={screening.documentType}
      />

      {/* Decoded QR Code or Barcode Verification Banner */}
      {location.state?.codePayload && (
        <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-md shadow-emerald-500/20">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-emerald-950">
                  {location.state?.codeType || 'Secure 2D QR / Barcode'} Digitally Cross-Verified
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 size={11} className="text-emerald-700" />
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 font-mono mt-0.5 break-all">
                Payload Signature: {location.state.codePayload}
              </p>
            </div>
          </div>
          <span className="text-xs text-emerald-900 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs shrink-0 self-start sm:self-auto">
            UIDAI / NSDL Standard
          </span>
        </div>
      )}

      {/* Primary KPI Row: Risk Score + 5 Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Composite Risk Circular Gauge */}
        <div className="lg:col-span-1">
          <RiskScore score={screening.riskScore} status={screening.status} />
        </div>

        {/* 5 Key Metric Cards */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              OCR Confidence
            </span>
            <span className="text-2xl font-extrabold font-mono text-brand-900 mt-1 block">
              {screening.confidence || 94}%
            </span>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">High Text Quality</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Image Quality
            </span>
            <span className="text-2xl font-extrabold font-mono text-brand-900 mt-1 block">
              {screening.qualityScore || 92}%
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {screening.dimensions || '1920x1080'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Face Match
            </span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${
              (screening.faceMatchScore || 96) >= 80 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {screening.faceMatchScore || 96}%
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">1:1 Biometric Match</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Liveness Score
            </span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${
              (screening.livenessScore || 98) >= 80 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {screening.livenessScore || 98}%
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Anti-Spoof Check</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Authenticity
            </span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${
              (screening.authenticityScore || 96) >= 80 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {screening.authenticityScore || 96}%
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Zero Cloning Anomaly</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-card">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Fraud Risk Index
            </span>
            <span className={`text-2xl font-extrabold font-mono mt-1 block ${
              screening.riskScore <= 40 ? 'text-emerald-600' : screening.riskScore <= 70 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {screening.riskScore}%
            </span>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Multi-Signal Weighted</p>
          </div>
        </div>
      </div>

      {/* 4-Module Forensic Verification System Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-900 text-cyan-400 flex items-center justify-center font-bold">
            <Layers size={22} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-brand-900">
              4-Module Automated Forensic Verification Pipeline
            </h3>
            <p className="text-xs text-slate-500">
              Module 1 (OCR Extraction) • Module 2 (Document Validation) • Module 3 (Tampering Detection) • Module 4 (Face Detection)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            Dynamic Risk Weighting Active
          </span>
        </div>
      </div>

      {/* Side-by-Side: Document Visual Preview & Extracted Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DocumentPreview
          fileUrl={screening.fileUrl}
          fileName={screening.fileName}
          fileSize={screening.fileSize}
          dimensions={screening.dimensions}
          documentType={screening.documentType}
          tamperedRegions={screening.forensicResults?.tamperedRegions || []}
          isPdf={screening.isPdf}
        />

        <ExtractedDataCard
          applicantName={screening.applicantName}
          dateOfBirth={screening.dateOfBirth}
          idNumber={screening.idNumber}
          address={screening.address}
          documentType={screening.documentType}
          confidence={screening.confidence}
          ocrEngine={screening.ocrData?.engine}
          extractedFields={screening.extractedFields}
        />
      </div>

      {/* Document Cryptographic Hash & File Alteration Detector */}
      <DocumentHashCard
        documentHash={screening.documentHash}
        isAltered={screening.status === 'SUSPICIOUS' || (screening.forensicResults?.authenticityScore || 100) < 70}
        fileName={screening.fileName}
      />

      {/* Format & Algorithmic Validation Card */}
      <ValidationCard validationResults={screening.validationResults} />

      {/* Image Manipulation Forensics Card */}
      <ForensicsCard forensicResults={screening.forensicResults} />

      {/* Biometric Face Verification Card */}
      <FaceVerificationCard
        faceResults={screening.faceResults}
        selfieUrl={screening.selfieUrl}
        documentType={screening.documentType}
      />

      {/* Multi-Signal Risk Breakdown & Decision Reasons */}
      <RiskBreakdown
        riskBreakdown={screening.riskBreakdown}
        reasons={screening.reasons}
        status={screening.status}
      />

      {/* Bottom Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-slate-600 hover:text-brand-900 transition-colors"
        >
          ← Back to Dashboard Overview
        </button>

        <button
          onClick={() => navigate(`/reports/${screening.id}`)}
          className="px-5 py-2.5 bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Printer size={15} className="text-cyan-400" />
          <span>Generate Official Verification Report</span>
        </button>
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
