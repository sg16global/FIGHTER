import React, { useState } from 'react';
import {
  X,
  Key,
  Globe,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Layers,
  Save,
  Download,
  Upload,
} from 'lucide-react';
import {
  MistralModelId,
  MISTRAL_MODELS,
  RemoteApiConfig,
  RemoteApiStatus,
  saveRemoteApiConfig,
  testRemoteMistralConnection,
} from '../engine/mistralClient';
import { importMemoryBank, loadMemoryBank, sanitizeMemoryBank } from '../memory/ltmb';
import { validateRemoteEndpoint } from '../security/securityCore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RemoteApiConfig;
  onUpdateConfig: (newConfig: RemoteApiConfig) => void;
  activeModel: MistralModelId;
  onSelectModel: (model: MistralModelId) => void;
  remoteStatus: RemoteApiStatus;
  onRefreshStatus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  activeModel,
  onSelectModel,
  remoteStatus,
  onRefreshStatus,
}) => {
  const [localConfig, setLocalConfig] = useState<RemoteApiConfig>(config);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<RemoteApiStatus | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [endpointError, setEndpointError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testRemoteMistralConnection(localConfig, activeModel);
      setTestResult(res);
      onRefreshStatus();
    } finally {
      setIsTesting(false);
    }
  };

  // Endpoint policy is enforced HERE in the UI and again in the kernel before
  // persistence — double validation, because a modified component must not be
  // able to skip straight to saveRemoteApiConfig with a hostile URL.
  const handleSave = () => {
    const onlineIntent = localConfig.mode === 'online' && localConfig.apiKey.trim().length > 0;
    if (onlineIntent) {
      const verdict = validateRemoteEndpoint(localConfig.endpointUrl);
      if (!verdict.ok) {
        setEndpointError(verdict.reason ?? 'Endpoint rejected by the sovereign network policy.');
        // Fail closed: hand the kernel an airgapped config it can still refine.
        onUpdateConfig({ ...localConfig, mode: 'offline' });
        return;
      }
      setEndpointError(null);
      const pinned: RemoteApiConfig = { ...localConfig, endpointUrl: verdict.url };
      saveRemoteApiConfig(pinned);
      onUpdateConfig(pinned);
    } else {
      saveRemoteApiConfig(localConfig);
      onUpdateConfig(localConfig);
    }
    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      onClose();
    }, 600);
  };

  const handleExportLTMB = () => {
    const bank = loadMemoryBank();
    const blob = new Blob([JSON.stringify(bank, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-sovereign-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Imported memory is attacker-controllable input. It is schema-validated and
  // clamped before persistence, and only the restored snapshot fields are read
  // back by the workspace — never re-injected as code or paths.
  const handleImportLTMB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Memory bank rejected: file exceeds the 8 MB import limit.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const bank = sanitizeMemoryBank(parsed);
        if (!bank) {
          alert('Memory bank rejected: not a valid LTMB structure. Nothing was imported.');
        } else {
          importMemoryBank(bank);
          alert(`Long-Term Memory Bank imported: ${bank.snapshots.length} validated snapshot(s).`);
        }
      } catch {
        alert('Invalid JSON memory file. Nothing was imported.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const activeSpec = MISTRAL_MODELS[activeModel];

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/40 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in-up">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#FFFFFF] border border-[#E8DFD5] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 px-6 bg-[#FCFAF7] border-b border-[#EFE7DE] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-sm text-[#1C1917]">
                Settings &amp; Mistral API Configuration
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text text-sm text-[#1C1917]">
          {/* Operation Mode Selector: Online vs Offline Airgapped */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1C1917] flex items-center space-x-2">
                <Radio className="w-4 h-4 text-[#E07A5F]" />
                <span>STUDIO OPERATION MODE</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  localConfig.mode === 'online'
                    ? 'bg-[#0D9488]/15 text-[#0F766E]'
                    : 'bg-[#D97706]/15 text-[#B45309]'
                }`}
              >
                {localConfig.mode === 'online' ? '● Online Remote' : '● Airgapped Offline'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'online' })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localConfig.mode === 'online'
                    ? 'bg-[#FFFFFF] border-[#E07A5F] shadow-xs text-[#1C1917]'
                    : 'bg-[#FAF6F0] border-[#E8DFD5] text-[#78716C] hover:border-[#D6C8BA]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-[#1C1917]">Online Remote API</span>
                  <Globe className="w-4 h-4 text-[#0D9488]" />
                </div>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Connects directly to Mistral AI API for streaming completions, frontier reasoning, and Codestral FIM.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, mode: 'offline' })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localConfig.mode === 'offline'
                    ? 'bg-[#FFFFFF] border-[#D97706] shadow-xs text-[#1C1917]'
                    : 'bg-[#FAF6F0] border-[#E8DFD5] text-[#78716C] hover:border-[#D6C8BA]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-[#1C1917]">Airgapped Offline</span>
                  <Radio className="w-4 h-4 text-[#D97706]" />
                </div>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Zero network calls. Sovereign deterministic AST bite engine, offline security shield, and local memory.
                </p>
              </button>
            </div>
          </div>

          {/* Remote API Settings */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE] space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1C1917] flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#E07A5F]" />
                <span>MISTRAL API CONNECTION</span>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#57534E] mb-1">
                  Remote API Base URL
                </label>
                <input
                  type="text"
                  value={localConfig.endpointUrl}
                  onChange={(e) => {
                    setEndpointError(null);
                    setLocalConfig({ ...localConfig, endpointUrl: e.target.value });
                  }}
                  placeholder="https://api.mistral.ai/v1"
                  className={`w-full bg-[#FFFFFF] border rounded-xl px-3 py-2 text-xs font-mono text-[#1C1917] focus:outline-none ${
                    endpointError
                      ? 'border-[#F87171] focus:border-[#DC2626]'
                      : 'border-[#E0D7CC] focus:border-[#E07A5F]'
                  }`}
                />
                {endpointError ? (
                  <p className="mt-1.5 text-[11px] leading-snug text-[#B91C1C] flex items-start space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      <strong>Blocked by security layers (LAYER 1 endpoint policy):</strong>{' '}
                      {endpointError} Studio held in Airgapped Offline mode.
                    </span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-[10px] text-[#A8A29E]">
                    Pinned by policy: https to a sanctioned Mistral sovereign gateway, or an
                    http://localhost vLLM endpoint. Telemetry hosts are permanently denied.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#57534E]">
                    Mistral API Key (Bearer Token)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-xs text-[#E07A5F] hover:underline"
                  >
                    {showApiKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localConfig.apiKey}
                    onChange={(e) =>
                      setLocalConfig({ ...localConfig, apiKey: e.target.value })
                    }
                    placeholder="Enter your Mistral API key"
                    className="w-full bg-[#FFFFFF] border border-[#E0D7CC] rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#E07A5F]"
                  />
                  <Key className="w-4 h-4 text-[#A8A29E] absolute right-3 pointer-events-none" />
                </div>
              </div>

              <p className="text-[10px] font-mono text-[#8C827A]">
                Kernel view: {remoteStatus.status.toUpperCase()} · {remoteStatus.message}
              </p>

              {/* Diagnostic Network Ping Button */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleRunPingTest}
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F2ECE3] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] transition-colors shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Connection…' : 'Run Network Ping Test'}</span>
                </button>

                {testResult && (
                  <div className="flex items-center space-x-2 text-xs">
                    {testResult.status === 'online' ? (
                      <span className="text-[#0D9488] font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Connected ({testResult.latencyMs}ms)</span>
                      </span>
                    ) : testResult.status === 'offline' ? (
                      <span className="text-[#D97706] font-medium flex items-center space-x-1">
                        <Radio className="w-4 h-4" />
                        <span>Airgapped Mode</span>
                      </span>
                    ) : (
                      <span className="text-[#DC2626] font-medium flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{testResult.message}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mistral Multi-Model Architecture Selection */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE] space-y-3">
            <span className="font-semibold text-xs text-[#1C1917] flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#E07A5F]" />
              <span>FOUR MISTRAL ARCHITECTURES</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(MISTRAL_MODELS).map((spec) => {
                const isSelected = spec.id === activeModel;
                return (
                  <div
                    key={spec.id}
                    onClick={() => onSelectModel(spec.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-[#E07A5F] shadow-xs'
                        : 'bg-[#FFFFFF] border-[#E8DFD5] hover:border-[#D6C8BA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#1C1917]">
                        {spec.displayName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF0E6] text-[#E07A5F]">
                        {spec.parameters}
                      </span>
                    </div>

                    <div className="text-xs text-[#57534E] mb-1">{spec.specialization}</div>
                    <div className="text-[11px] text-[#8C827A]">{spec.contextWindow} context</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long-Term Memory Bank (LTMB) Backup */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#EFE7DE] flex items-center justify-between">
            <div>
              <div className="font-semibold text-xs text-[#1C1917] flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-[#0D9488]" />
                <span>LONG-TERM MEMORY BANK (LTMB)</span>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                Export or import session memory banks, execution histories, and AST bite logs.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportLTMB}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] shadow-2xs hover:bg-[#F2ECE3]"
              >
                <Download className="w-3.5 h-3.5 text-[#E07A5F]" />
                <span>Export</span>
              </button>

              <label className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#1C1917] shadow-2xs hover:bg-[#F2ECE3] cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportLTMB}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="h-14 px-6 bg-[#FCFAF7] border-t border-[#EFE7DE] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#78716C]">
            Model: <strong className="text-[#1C1917]">{activeSpec.displayName}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#FFFFFF] border border-[#E0D7CC] text-xs font-medium text-[#57534E] hover:bg-[#F2ECE3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#C9664B] text-[#FFFFFF] text-xs font-semibold transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveToast ? 'Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
