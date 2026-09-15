import React from 'react';
import {
  Globe,
  Radio,
  ShieldCheck,
  Layers,
  Settings,
  Cpu,
  Code2,
  BrainCircuit,
} from 'lucide-react';
import { RemoteApiStatus, MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import type { AppMode } from '../engine/masterAlgorithm';

interface PinterestHeaderProps {
  /** Top-level operational routing: exactly two modules. */
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  /** Master-algorithm posture of the blank engine. */
  engineArmed: boolean;
  armedBlockCount: number;
  remoteStatus: RemoteApiStatus;
  activeModel: MistralModelId;
  onOpenSettings: () => void;
  onOpenArchitecture: () => void;
  shieldBlockedCount: number;
  onCloseWindow: () => void;
  onMinimizeWindow: () => void;
  onMaximizeWindow: () => void;
  isMaximized: boolean;
}

export const PinterestHeader: React.FC<PinterestHeaderProps> = ({
  appMode,
  onSelectMode,
  engineArmed,
  armedBlockCount,
  remoteStatus,
  activeModel,
  onOpenSettings,
  onOpenArchitecture,
  shieldBlockedCount,
  onCloseWindow,
  onMinimizeWindow,
  onMaximizeWindow,
  isMaximized,
}) => {
  const isOnline = remoteStatus.mode === 'online' && remoteStatus.status === 'online';
  const modelSpec = MISTRAL_MODELS[activeModel] || MISTRAL_MODELS['codestral-latest'];

  return (
    <header className="h-12 w-full border-b border-[#EFE7DE] bg-[#FCFAF7]/90 backdrop-blur-md flex items-center justify-between px-4 select-none shrink-0 z-30">
      {/* Left: Traffic Lights */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onCloseWindow}
          title="Close Window"
          className="w-3 h-3 rounded-full bg-[#FF5F56] hover:brightness-90 transition-all cursor-pointer"
        />
        <button
          onClick={onMinimizeWindow}
          title="Minimize Window"
          className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:brightness-90 transition-all cursor-pointer"
        />
        <button
          onClick={onMaximizeWindow}
          title={isMaximized ? 'Restore Window' : 'Maximize Window'}
          className="w-3 h-3 rounded-full bg-[#27C93F] hover:brightness-90 transition-all cursor-pointer"
        />
      </div>

            {/* Center: OPERATIONAL MODULE ROUTER — exactly two modes.
          Replaces the former Chats/Colab/Code chat-flow pills; those sub-views
          now live inside CODE MODE via the left sidebar. */}
      <div className="flex items-center p-1 rounded-full bg-[#EFE8DE] border border-[#E4DBD0] shadow-2xs">
        <button
          onClick={() => onSelectMode('CODE')}
          title="Code Mode — autonomous-free code generation, sandbox execution, workspace tooling"
          className={`flex items-center space-x-1.5 px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            appMode === 'CODE'
              ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code Mode</span>
        </button>

        <button
          onClick={() => onSelectMode('BRAIN')}
          title="Brain Mode — layer-by-layer master algorithm construction & architectural scaffolding"
          className={`flex items-center space-x-1.5 px-4 py-1 rounded-full text-xs font-semibold transition-all ${
            appMode === 'BRAIN'
              ? 'bg-[#FFFFFF] text-[#1C1917] shadow-xs'
              : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Brain Mode</span>
        </button>
      </div>

      {/* Engine posture chip: the blank engine reports its real state */}
      <span
        className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-semibold shadow-2xs ${
          engineArmed
            ? 'bg-[#E8F8F5] border-[#A3E4D7] text-[#0E6251]'
            : 'bg-[#FEF9E7] border-[#F9E79F] text-[#7D6608]'
        }`}
        title={
          engineArmed
            ? `${armedBlockCount} armed logic block(s) dictate all model behavior`
            : 'Engine is BLANK: no master algorithm armed — all generation paths stand by'
        }
      >
        <span className={`w-1.5 h-1.5 rounded-full ${engineArmed ? 'bg-[#0D9488]' : 'bg-[#D97706] animate-pulse'}`} />
        <span>{engineArmed ? `ENGINE ARMED · ${armedBlockCount} BLK` : 'ENGINE BLANK'}</span>
      </span>

      {/* Right: Remote Network & Security Indicators */}
      <div className="flex items-center space-x-2.5">
        {/* Active Mistral analysis brain */}
        <span
          className="hidden md:flex items-center space-x-1 px-2 py-1 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-[10px] font-mono text-[#57534E] shadow-2xs"
          title={`${modelSpec.displayName} · analysis only — enforcement lives in the security kernel`}
        >
          <Cpu className="w-3 h-3 text-[#8B5CF6]" />
          <span>{modelSpec.shortName}</span>
        </span>

        {/* Double-Layer Shield Indicator */}
        <button
          onClick={onOpenArchitecture}
          className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-xs text-[#57534E] hover:border-[#D6C8BA] shadow-2xs"
          title="Double-Layer Security Shield active"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
          <span className="font-medium text-[11px]">Shield Active</span>
          {shieldBlockedCount > 0 && (
            <span className="ml-1 px-1 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] text-[9px] font-bold">
              {shieldBlockedCount}
            </span>
          )}
        </button>

        {/* Online / Offline Status Pill */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all shadow-2xs ${
            isOnline
              ? 'bg-[#E8F8F5] border-[#A3E4D7] text-[#0E6251]'
              : remoteStatus.mode === 'offline'
              ? 'bg-[#FEF9E7] border-[#F9E79F] text-[#7D6608]'
              : 'bg-[#FDEDEC] border-[#F5B7B1] text-[#922B21]'
          }`}
          title="Click to configure Remote Mistral API & Network Settings"
        >
          {isOnline ? (
            <Globe className="w-3 h-3 text-[#0D9488]" />
          ) : (
            <Radio className="w-3 h-3 text-[#D97706]" />
          )}
          <span>
            {isOnline
              ? `Online (${remoteStatus.latencyMs ?? 0}ms)`
              : 'Airgap Offline'}
          </span>
        </button>

        {/* Architecture blueprint button */}
        <button
          onClick={onOpenArchitecture}
          className="p-1.5 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-[#78716C] hover:text-[#1C1917] hover:border-[#D6C8BA] transition-colors shadow-2xs"
          title="Mistral Architecture Blueprint"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-full bg-[#FFFFFF] border border-[#E8DFD5] text-[#78716C] hover:text-[#1C1917] hover:border-[#D6C8BA] transition-colors shadow-2xs"
          title="Settings & Mistral API Key"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
