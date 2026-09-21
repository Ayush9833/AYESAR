import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../components/screening/UploadBox';
import Toast from '../components/common/Toast';
import { uploadScreening } from '../services/api';
import { ShieldCheck,
  QrCode,
  ArrowRight } from 'lucide-react';

export default function NewScreeningPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleStartScreening = async ({ documentFile, selfieFile, documentType, demoScenario }) => {
    try {
      setLoading(true);
      const response = await uploadScreening({
        documentFile,
        selfieFile,
        documentType,
        demoScenario
      });

      if (response.success && response.screeningId) {
        // Navigate to animated processing pipeline screen with screening ID
        navigate(`/screenings/process/${response.screeningId}`, {
          state: {
            screening: response.data,
            screeningId: response.screeningId
          }
        });
      } else {
        throw new Error(response.error || 'Screening initiation failed');
      }
    } catch (err) {
      console.error('Screening upload error:', err);
      setToast({
        type: 'error',
        message: err.message || 'Unable to process this document. Please upload a clear JPG, PNG or supported PDF.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-900 tracking-tight">
            Initiate Document Screening
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit an Indian identity document for 8-stage automated fraud analysis
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck size={16} className="text-emerald-600" />
          <span>AES-256 Memory Processing</span>
        </div>
      </div>

      {/* Quick Switch to Real-Document Lab */}
      <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between gap-3 text-xs text-cyan-950">
        <div className="flex items-center gap-2.5">
          <QrCode size={18} className="text-cyan-700 shrink-0" />
          <span><b>Live Real-Doc Lab:</b> Have an actual Aadhaar QR or Passport MRZ in hand? Verify it offline directly.</span>
        </div>
        <button
          onClick={() => navigate('/live-verify')}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Open Lab</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Main Upload Box */}
      <UploadBox onStartScreening={handleStartScreening} isLoading={loading} />

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
