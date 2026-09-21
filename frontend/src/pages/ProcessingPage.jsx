import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import ProcessingStep from '../components/screening/ProcessingStep';
import confetti from 'canvas-confetti';

const PIPELINE_STAGES = [
  { id: 1, title: 'Image Quality Check', description: 'Inspecting resolution, DPI, color gamut and blur' },
  { id: 2, title: 'Document Classification', description: 'Categorizing layout (Aadhaar, PAN, Passport, DL)' },
  { id: 3, title: 'OCR Extraction', description: 'PaddleOCR engine recognizing text and glyph fields' },
  { id: 4, title: 'Data Validation', description: 'Evaluating checksums, DOB sanity & regex consistency' },
  { id: 5, title: 'Image Forensics', description: 'Detecting copy-paste cloning, splicing, and ELA anomalies' },
  { id: 6, title: 'Face Verification', description: 'Extracting 512D facial embedding & liveness anti-spoof' },
  { id: 7, title: 'Fraud Analysis', description: 'Synthesizing multi-signal anomaly matrices' },
  { id: 8, title: 'Risk Assessment', description: 'Computing final 0-100 composite risk score' }
];

export default function ProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screeningData = location.state?.screening;

  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(12);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Total duration: ~2.8 seconds across 8 stages (approx 350ms per stage)
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 8) {
          const next = prev + 1;
          setProgress(Math.round((next / 8) * 100));
          return next;
        } else {
          clearInterval(interval);
          setIsDone(true);
          setProgress(100);

          // If verified, fire celebration confetti
          if (screeningData?.status === 'VERIFIED') {
            try {
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            } catch (e) {}
          }

          // Automatically redirect to result page after a brief moment
          setTimeout(() => {
            navigate(`/screenings/${id}`, {
              replace: true,
              state: { screening: screeningData }
            });
          }, 800);

          return 8;
        }
      });
    }, 350);

    return () => clearInterval(interval);
  }, [id, navigate, screeningData]);

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return isDone ? 'completed' : 'processing';
    return 'pending';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Top Processing Header */}
      <div className="bg-brand-900 text-white rounded-2xl p-6 sm:p-8 text-center relative overflow-hidden shadow-elevated border border-brand-800">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
          <Cpu size={28} className={isDone ? '' : 'animate-pulse'} />
        </div>

        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
          Dossier ID: {id}
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {isDone ? 'Verification Pipeline Complete!' : 'Executing Multi-Signal Inspection Pipeline...'}
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
          Simultaneously interrogating image quality, optical layout, textual checksums, and biometric signals.
        </p>

        {/* Dynamic Progress Bar */}
        <div className="mt-6 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 mb-1.5 font-bold">
            <span>Overall Pipeline Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2.5 w-full bg-brand-950 rounded-full overflow-hidden p-0.5 border border-brand-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 8-Stage Animated Step List */}
      <div className="space-y-2.5">
        {PIPELINE_STAGES.map((stage) => (
          <ProcessingStep
            key={stage.id}
            stepNumber={stage.id}
            title={stage.title}
            description={stage.description}
            status={getStepStatus(stage.id)}
          />
        ))}
      </div>

      {/* Skip directly button */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate(`/screenings/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-900 font-semibold transition-colors"
        >
          <span>View Dossier Immediately</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
