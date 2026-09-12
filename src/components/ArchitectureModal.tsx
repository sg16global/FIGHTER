import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Shield,
  Cpu,
  Download,
  Terminal,
  Layers,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { OPTION_2_NODEJS_REFERENCE } from '../engine/sovereignBiteEngine';
import { OPTION_3_PYTHON_REFERENCE } from '../security/doubleLayerShield';
import { MISTRAL_MODELS } from '../engine/mistralClient';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'blueprint' | 'option2' | 'option3';
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'blueprint',
}) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'option2' | 'option3'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (fileName: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/40 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in-up">
      <div className="w-full max-w-4xl h-[86vh] bg-[#FFFFFF] border border-[#E8DFD5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 bg-[#FCFAF7] border-b border-[#EFE7DE] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-sm text-[#1C1917]">
                Aegis Studio // Four Mistral Models Architecture Blueprint
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F2ECE3] text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="h-11 px-6 bg-[#FAF6F0] border-b border-[#EFE7DE] flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'blueprint'
                ? 'bg-[#E07A5F] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917] bg-[#FFFFFF] border border-[#E0D7CC]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Mistral Suite Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('option2')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'option2'
                ? 'bg-[#E07A5F] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917] bg-[#FFFFFF] border border-[#E0D7CC]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Codestral Auto-Healer (.JS)</span>
          </button>

          <button
            onClick={() => setActiveTab('option3')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'option3'
                ? 'bg-[#E07A5F] text-[#FFFFFF] shadow-2xs'
                : 'text-[#78716C] hover:text-[#1C1917] bg-[#FFFFFF] border border-[#E0D7CC]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Double-Layer Shield (.PY)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 select-text">
          {activeTab === 'blueprint' && (
            <div className="space-y-6 text-sm text-[#1C1917] leading-relaxed">
              {/* Four Mistral Models Grid */}
              <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE]">
                <h3 className="font-semibold text-sm text-[#1C1917] mb-2">
                  1. Multi-Model Mistral Architecture (7B, Large, Codestral, NeMo)
                </h3>
                <p className="text-xs text-[#78716C] mb-4">
                  Aegis Dev Studio integrates the full spectrum of Mistral AI models with dedicated role specialization, zero prohibited cloud telemetry, and seamless dual-mode execution:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.values(MISTRAL_MODELS).map((spec) => (
                    <div
                      key={spec.id}
                      className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8DFD5]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-[#1C1917]">
                          {spec.displayName}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF0E6] text-[#E07A5F]">
                          {spec.parameters} · {spec.contextWindow}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] mb-1 font-medium">{spec.specialization}</p>
                      <p className="text-[11px] text-[#8C827A]">{spec.recommendedUse}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online vs Offline Dual-Mode Network Architecture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE]">
                  <div className="font-semibold text-xs text-[#0D9488] mb-2 flex items-center space-x-1.5">
                    <Globe className="w-4 h-4" />
                    <span>ONLINE REMOTE API MODE</span>
                  </div>
                  <ul className="space-y-1.5 text-[#57534E] text-xs">
                    <li>• Direct HTTPS connection to <code className="text-[#E07A5F]">https://api.mistral.ai/v1</code>.</li>
                    <li>• Real-time token streaming directly into chat &amp; code editor.</li>
                    <li>• Full Codestral Fill-in-the-Middle (FIM) syntax patch generation.</li>
                    <li>• Exponential backoff and auto-retry on HTTP 429 rate limits.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE]">
                  <div className="font-semibold text-xs text-[#D97706] mb-2 flex items-center space-x-1.5">
                    <Radio className="w-4 h-4" />
                    <span>AIRGAPPED OFFLINE MODE</span>
                  </div>
                  <ul className="space-y-1.5 text-[#57534E] text-xs">
                    <li>• Zero external network egress; 100% data sovereignty.</li>
                    <li>• Deterministic AST Bite decomposition and heuristic bug isolation.</li>
                    <li>• Double-Layer Security Shield active (Sandbox jail + AST firewall).</li>
                    <li>• Strong persistence via browser Long-Term Memory Bank (LTMB).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'option2' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE]">
                <div>
                  <h3 className="font-semibold text-xs text-[#1C1917]">
                    Option 2: Standalone Codestral Auto-Healer (.JS)
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Production-ready modular Node.js engine with Remote Mistral API connection + offline fallback.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(OPTION_2_NODEJS_REFERENCE, 'opt2')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] shadow-2xs hover:bg-[#F2ECE3]"
                  >
                    {copiedKey === 'opt2' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Source</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDownload('codestral-autohealer.js', OPTION_2_NODEJS_REFERENCE)
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E07A5F] text-[#FFFFFF] text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] font-mono text-xs text-[#292524] overflow-x-auto leading-relaxed">
                {OPTION_2_NODEJS_REFERENCE}
              </pre>
            </div>
          )}

          {activeTab === 'option3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE]">
                <div>
                  <h3 className="font-semibold text-xs text-[#1C1917]">
                    Option 3: Double-Layer Security Shield (.PY)
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Outside Boundary (Sandbox path jail) + Inside Boundary (AST syscall destructive command interceptor).
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(OPTION_3_PYTHON_REFERENCE, 'opt3')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] shadow-2xs hover:bg-[#F2ECE3]"
                  >
                    {copiedKey === 'opt3' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#0D9488]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Source</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDownload('double_layer_security_shield.py', OPTION_3_PYTHON_REFERENCE)
                    }
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E07A5F] text-[#FFFFFF] text-xs font-semibold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-2xl bg-[#FAF7F3] border border-[#E8DFD5] font-mono text-xs text-[#292524] overflow-x-auto leading-relaxed">
                {OPTION_3_PYTHON_REFERENCE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
