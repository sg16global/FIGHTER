import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Maximize2,
  Minimize2,
  X,
  Play,
  Sparkles,
  Layers,
  Settings,
  Globe,
  Radio,
} from 'lucide-react';
import { MistralModelId, RemoteApiStatus } from '../engine/mistralClient';

interface TopTitleBarProps {
  activeModel: MistralModelId;
  onModelChange: (model: MistralModelId) => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onRunAutoHealLoop: () => void;
  isHealingLoopRunning: boolean;
  onOpenArchitectureModal: (tab?: 'blueprint' | 'option2' | 'option3') => void;
  onOpenSettingsModal: () => void;
  remoteStatus: RemoteApiStatus;
  shieldBlockedCount: number;
  activeFilePath: string;
}

export const TopTitleBar: React.FC<TopTitleBarProps> = ({
  activeModel,
  onModelChange,
  isMaximized,
  onToggleMaximize,
  onClose,
  onMinimize,
  onRunAutoHealLoop,
  isHealingLoopRunning,
  onOpenArchitectureModal,
  onOpenSettingsModal,
  remoteStatus,
  shieldBlockedCount,
  activeFilePath,
}) => {
  const isOnline = remoteStatus.mode === 'online' && remoteStatus.status === 'online';

  return (
    <header className="glass-bar h-10 w-full border-b border-[#2d2d2d] flex items-center justify-between px-3 select-none titlebar-drag shrink-0 relative z-30">
      {/* Left: Window Traffic Light Controls + App Branding */}
      <div className="flex items-center space-x-3 titlebar-no-drag">
        <div className="flex items-center space-x-2">
          <button
            onClick={onClose}
            title="Close Sovereign Window"
            aria-label="Close Sovereign Window"
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff8b84] flex items-center justify-center transition-all duration-150 hover:scale-125 hover:shadow-[0_0_10px_rgba(255,95,86,0.55)]"
          >
            <X className="w-2 h-2 text-[#4A0002] opacity-0 hover:opacity-100" />
          </button>
          <button
            onClick={onMinimize}
            title="Minimize Window"
            aria-label="Minimize Window"
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffd46f] flex items-center justify-center transition-all duration-150 hover:scale-125 hover:shadow-[0_0_10px_rgba(255,189,46,0.55)]"
          >
            <Minimize2 className="w-2 h-2 text-[#4A2D00] opacity-0 hover:opacity-100" />
          </button>
          <button
            onClick={onToggleMaximize}
            title={isMaximized ? 'Restore Normal Window' : 'Maximize Workspace'}
            aria-label={isMaximized ? 'Restore Normal Window' : 'Maximize Workspace'}
            className="w-3 h-3 rounded-full bg-[#27c93f] hover:bg-[#66e875] flex items-center justify-center transition-all duration-150 hover:scale-125 hover:shadow-[0_0_10px_rgba(39,201,63,0.55)]"
          >
            <Maximize2 className="w-2 h-2 text-[#003B0F] opacity-0 hover:opacity-100" />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[#2d2d2d]" />

        {/* Brand identity */}
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-[#00F2FE] to-[#4FACFE] flex items-center justify-center shadow-[0_0_12px_rgba(0,242,254,0.25)]">
            <Cpu className="w-3 h-3 text-[#0D0E12]" />
          </div>
          <span className="font-heading font-bold text-xs tracking-wider text-[#F3F4F6] uppercase">
            AEGIS // MISTRAL AI DEV STUDIO
          </span>
          <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#222222] border border-[#2d2d2d] text-[#00F2FE]">
            DESKTOP EDITION
          </span>
        </div>
      </div>

      {/* Center: Active Mistral Model Selector & Active Path */}
      <div className="flex items-center space-x-2 titlebar-no-drag">
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#202020] border border-[#2d2d2d] text-xs font-mono text-[#9699a3]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#F3F4F6]">{activeFilePath}</span>
        </div>

        <div className="relative flex items-center">
          <select
            value={activeModel}
            onChange={(e) => onModelChange(e.target.value as MistralModelId)}
            className="bg-[#202020] hover:bg-[#272727] text-[#00F2FE] font-mono text-xs pl-2.5 pr-7 py-1 rounded border border-[#2d2d2d] focus:outline-none focus:border-[#00F2FE] transition-colors cursor-pointer"
            aria-label="Select Mistral Model Brain"
          >
            <option value="codestral-latest">CODESTRAL 22B (Mistral AI)</option>
            <option value="mistral-large-latest">MISTRAL LARGE 2 (Mistral AI)</option>
            <option value="open-mistral-7b">MISTRAL 7B INSTRUCT (Mistral AI)</option>
            <option value="open-mistral-nemo">MISTRAL NEMO 12B (Mistral AI)</option>
          </select>
        </div>

        {/* Network & Mode status pill */}
        <button
          onClick={onOpenSettingsModal}
          className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-mono transition-colors ${
            isOnline
              ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981] hover:bg-[#10b981]/25'
              : remoteStatus.mode === 'offline'
              ? 'bg-[#ff9f1c]/15 border-[#ff9f1c]/40 text-[#ff9f1c] hover:bg-[#ff9f1c]/25'
              : 'bg-[#ff3b30]/15 border-[#ff3b30]/40 text-[#ff3b30] hover:bg-[#ff3b30]/25'
          }`}
          title="Click to configure Remote Mistral API & Network Settings"
        >
          {isOnline ? (
            <Globe className="w-3.5 h-3.5" />
          ) : (
            <Radio className="w-3.5 h-3.5" />
          )}
          <span>
            {isOnline
              ? `ONLINE (${remoteStatus.latencyMs ?? 0}ms)`
              : remoteStatus.mode === 'offline'
              ? 'AIRGAP OFFLINE'
              : 'CONNECTING…'}
          </span>
        </button>
      </div>

      {/* Right: Security Shield Indicator + Auto-Heal Trigger + Architecture Code Viewers */}
      <div className="flex items-center space-x-2 titlebar-no-drag">
        {/* Double-Layer Security Shield Status Pill */}
        <button
          onClick={() => onOpenArchitectureModal('option3')}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#192124] hover:bg-[#203037] border border-[#00F2FE]/30 text-xs transition-colors"
          title="Option 3: Strict Outside Sandbox + Inside AST Syscall Firewall"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00F2FE]" />
          <span className="font-mono text-[11px] text-[#00F2FE] hidden sm:inline">
            SHIELD: ACTIVE
          </span>
          {shieldBlockedCount > 0 && (
            <span className="px-1 py-0.2 rounded bg-[#FF3B30]/20 border border-[#FF3B30] text-[#FF3B30] text-[10px] font-mono font-bold">
              {shieldBlockedCount} BLOCKED
            </span>
          )}
        </button>

        {/* Autonomous Option 2 Auto-Heal Loop Trigger */}
        <button
          onClick={onRunAutoHealLoop}
          disabled={isHealingLoopRunning}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 ${
            isHealingLoopRunning
              ? 'bg-[#FF9F1C]/20 border border-[#FF9F1C] text-[#FF9F1C] animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-[#00F2FE]/20 to-[#4FACFE]/20 hover:from-[#00F2FE]/30 hover:to-[#4FACFE]/30 border border-[#00F2FE]/40 text-[#00F2FE]'
          }`}
          title="Option 2: Run Codestral Automated Bite Decomposer & Error-Fixing Loop"
        >
          {isHealingLoopRunning ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>HEALING BITES...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>AUTO-HEAL LOOP (OPT. 2)</span>
            </>
          )}
        </button>

        {/* Complete Reference Code Modal Trigger */}
        <button
          onClick={() => onOpenArchitectureModal('blueprint')}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2d2d2d] border border-[#2d2d2d] text-xs font-mono text-[#F3F4F6] transition-colors"
          title="Inspect Complete Option 1, Option 2 & Option 3 Modular Source Code"
        >
          <Layers className="w-3.5 h-3.5 text-[#FF9F1C]" />
          <span className="hidden md:inline">ARCHITECTURE</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettingsModal}
          className="p-1.5 rounded bg-[#202020] hover:bg-[#2d2d2d] border border-[#2d2d2d] text-[#9ca3af] hover:text-[#00f2fe] transition-colors"
          title="Remote API Network Settings & Model Config"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
