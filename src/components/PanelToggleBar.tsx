import React from 'react';
import {
  FolderTree,
  MessageSquare,
  Code2,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutPanelLeft,
  LayoutPanelTop,
  Maximize2,
  Globe,
  Radio,
} from 'lucide-react';
import { StudioOperationMode } from '../engine/mistralClient';

export interface PanelVisibility {
  explorer: boolean;
  chat: boolean;
  workspace: boolean;
}

interface PanelToggleBarProps {
  visibility: PanelVisibility;
  onToggle: (panel: keyof PanelVisibility) => void;
  onShowAll: () => void;
  networkStatus: 'online' | 'offline' | 'connecting' | 'error';
  networkMessage: string;
  operationMode: StudioOperationMode;
  activeModelLabel: string;
}

const TOGGLE_BUTTONS: Array<{
  key: keyof PanelVisibility;
  label: string;
  short: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'explorer', label: 'Explorer', short: 'A', Icon: FolderTree },
  { key: 'chat', label: 'Conversation', short: 'B', Icon: MessageSquare },
  { key: 'workspace', label: 'Workspace', short: 'C', Icon: Code2 },
];

export const PanelToggleBar: React.FC<PanelToggleBarProps> = ({
  visibility,
  onToggle,
  onShowAll,
  networkStatus,
  networkMessage,
  operationMode,
  activeModelLabel,
}) => {
  const openCount = Object.values(visibility).filter(Boolean).length;
  const isOnline = operationMode === 'online' && networkStatus === 'online';
  const statusColor = isOnline
    ? '#10b981'
    : operationMode === 'offline'
    ? '#ff9f1c'
    : networkStatus === 'connecting'
    ? '#ffb020'
    : '#ff3b30';

  return (
    <div className="glass-bar h-9 w-full border-b border-[#2d2d2d] flex items-center justify-between px-2 select-none shrink-0 z-20">
      <div className="flex items-center space-x-1.5">
        <span className="hidden sm:inline text-[10px] font-mono uppercase tracking-widest text-[#666b78] px-1.5">
          Panels
        </span>

        {TOGGLE_BUTTONS.map(({ key, label, short, Icon }) => {
          const isOpen = visibility[key];
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              title={`${isOpen ? 'Hide' : 'Show'} ${label}`}
              className={`group flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all duration-200 border ${
                isOpen
                  ? 'bg-[#1f2a2e] border-[#00f2fe]/35 text-[#00f2fe] shadow-[0_0_12px_rgba(0,242,254,0.12)]'
                  : 'bg-[#1a1a1a] border-[#2d2d2d] text-[#7a7d88] hover:text-[#f3f4f6] hover:border-[#3a3a3a]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{short}</span>
              {isOpen ? (
                <PanelLeftClose className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              ) : (
                <PanelLeftOpen className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              )}
            </button>
          );
        })}

        <div className="h-4 w-px bg-[#2d2d2d] mx-1" />

        <button
          onClick={onShowAll}
          disabled={openCount === 3}
          title="Show all three panels"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-[#1a1a1a] border border-[#2d2d2d] text-[#9699a3] hover:text-[#f3f4f6] hover:border-[#3a3a3a] disabled:opacity-40 disabled:cursor-default transition-all duration-200"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="hidden sm:inline">Show All</span>
        </button>

        <div className="hidden lg:flex items-center space-x-1 ml-1 text-[10px] font-mono text-[#666b78]">
          <LayoutPanelLeft className="w-3 h-3" />
          <span>{openCount}/3 open</span>
          <LayoutPanelTop className="w-3 h-3 ml-1" />
        </div>
      </div>

      <div className="flex items-center space-x-2 min-w-0">
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#2d2d2d] text-[11px] font-mono text-[#9699a3] max-w-[280px] truncate">
          <span className="text-[#00f2fe] shrink-0">MODEL</span>
          <span className="truncate text-[#f3f4f6]">{activeModelLabel}</span>
        </div>

        <div
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono"
          style={{
            color: statusColor,
            borderColor: statusColor + '44',
            background: statusColor + '12',
          }}
          title={networkMessage}
        >
          {isOnline ? (
            <Globe className="w-3 h-3 text-[#10b981]" />
          ) : (
            <Radio className="w-3 h-3 text-[#ff9f1c]" />
          )}
          <span className="hidden sm:inline whitespace-nowrap">
            {isOnline
              ? 'MISTRAL REMOTE API'
              : operationMode === 'offline'
              ? 'AIRGAP OFFLINE'
              : networkStatus === 'connecting'
              ? 'CONNECTING…'
              : 'OFFLINE'}
          </span>
          <span className="sm:hidden uppercase">{operationMode}</span>
        </div>
      </div>
    </div>
  );
};
