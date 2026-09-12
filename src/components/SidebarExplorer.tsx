import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Plus,
  RotateCcw,
  Settings,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Trash2,
  HardDrive,
  PanelLeftClose,
  GitBranch,
  GitCommit,
  Globe,
  Radio,
} from 'lucide-react';
import { WorkspaceFile } from '../workspace/defaultFiles';
import { ShieldConfig } from '../security/doubleLayerShield';
import { MistralModelId, MISTRAL_MODELS, RemoteApiConfig } from '../engine/mistralClient';

interface SidebarExplorerProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateNewFile: (name: string) => void;
  onDeleteFile: (fileId: string) => void;
  onGitCommit: (fileIds: string[], message: string) => void;
  onResetSampleBug: () => void;
  shieldConfig: ShieldConfig;
  onUpdateShieldConfig: (config: ShieldConfig) => void;
  activeModel: MistralModelId;
  remoteConfig: RemoteApiConfig;
  onOpenSettingsModal?: () => void;
  onCollapse?: () => void;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateNewFile,
  onDeleteFile,
  onGitCommit,
  onResetSampleBug,
  shieldConfig,
  onUpdateShieldConfig,
  activeModel,
  remoteConfig,
  onOpenSettingsModal,
  onCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'FILES' | 'GIT' | 'SETTINGS' | 'SECURITY'>('FILES');
  const [isFolderExpanded, setIsFolderExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('utils/auditLedger.js');
  const [stagedFileIds, setStagedFileIds] = useState<string[]>([]);
  const [commitMessage, setCommitMessage] = useState('Update workspace files');
  const changedFiles = files.filter((file) => file.isModified);

  const activeSpec = MISTRAL_MODELS[activeModel] || MISTRAL_MODELS['codestral-latest'];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateNewFile(newFileName.trim());
    setNewFileName('');
    setIsCreating(false);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
      return <FileCode className="w-3.5 h-3.5 text-[#00F2FE] shrink-0" />;
    }
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
      return <FileCode className="w-3.5 h-3.5 text-[#FF9F1C] shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-3.5 h-3.5 text-[#10B981] shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />;
  };

  return (
    <aside className="workspace-explorer h-full bg-[#1f1f20] border-r border-[#2d2d2d] flex flex-col select-none">
      {/* Activity Sidebar Mode Switcher */}
      <div className="glass-bar flex items-center border-b border-[#2d2d2d] px-2 py-1.5 space-x-1">
        <button
          onClick={() => setActiveTab('FILES')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'FILES'
              ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/30'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>EXPLORER</span>
        </button>

        <button
          onClick={() => setActiveTab('GIT')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'GIT'
              ? 'bg-[#1A1D27] text-[#10B981] border border-[#10B981]/30'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>GIT</span>
          {changedFiles.length > 0 && (
            <span className="min-w-4 px-1 rounded-full bg-[#FF9F1C]/20 text-[#FF9F1C] text-[10px]">
              {changedFiles.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SECURITY')}
          className={`flex-1 py-1.5 rounded text-xs font-mono font-medium flex items-center justify-center space-x-1.5 transition-colors ${
            activeTab === 'SECURITY'
              ? 'bg-[#1A1D27] text-[#00F2FE] border border-[#00F2FE]/30'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-[#00F2FE]" />
          <span>SHIELD</span>
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`p-1.5 rounded text-xs transition-colors ${
            activeTab === 'SETTINGS'
              ? 'bg-[#1A1D27] text-[#FF9F1C] border border-[#FF9F1C]/30'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
          title="Mistral Studio Settings & Remote API Config"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded text-xs text-[#9CA3AF] hover:text-[#00f2fe] hover:bg-[#202020] transition-all duration-200"
            title="Hide Explorer panel"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Explorer Tab Content */}
      {activeTab === 'FILES' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Workspace Root Header */}
          <div className="px-3 py-2 border-b border-[#2d2d2d] flex items-center justify-between bg-[#202020]">
            <button
              onClick={() => setIsFolderExpanded(!isFolderExpanded)}
              className="flex items-center space-x-1.5 text-xs font-mono font-semibold tracking-wider text-[#F3F4F6] uppercase hover:text-[#00F2FE]"
            >
              {isFolderExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-[#00F2FE]" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-[#00F2FE]" />
              )}
              <span className="truncate max-w-[130px]">sovereign-project</span>
            </button>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 rounded hover:bg-[#232736] text-[#9CA3AF] hover:text-[#00F2FE] transition-colors"
                title="Create New File in Workspace"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onResetSampleBug}
                className="p-1 rounded hover:bg-[#232736] text-[#9CA3AF] hover:text-[#FF9F1C] transition-colors"
                title="Reset intentional bug in paymentProcessor.js to replay Option 2 Auto-Heal demo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* New file input row */}
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[#232736] bg-[#181B26]">
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="src/newFile.js"
                  autoFocus
                  className="w-full bg-[#0D0E12] border border-[#00F2FE] rounded px-2 py-1 text-xs font-mono text-[#F3F4F6] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded bg-[#00F2FE] text-[#0D0E12] text-xs font-bold"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          {/* Files List */}
          {isFolderExpanded && (
            <div className="py-1.5 px-1.5">
              <div className="flex items-center space-x-2 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[#9699a3]">
                <FolderOpen className="w-3 h-3 text-[#00F2FE]" />
                <span>workspace tree</span>
              </div>
              {files.map((file) => {
                const isActive = file.id === activeFileId;
                const isRootFile = !file.path.includes('/');
                return (
                  <div
                    key={file.id}
                    onClick={() => onSelectFile(file.id)}
                    className={`row-lift group flex items-center justify-between ${isRootFile ? 'pl-3' : 'pl-7'} pr-2.5 py-1.5 rounded-md cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-[#1E2333] to-[#1a1d27] border-l-2 border-[#00F2FE] text-[#F3F4F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_18px_rgba(0,242,254,0.08)]'
                        : 'text-[#9CA3AF] hover:bg-white/[0.045] hover:text-[#F3F4F6]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {getFileIcon(file.name)}
                      <span className="text-xs font-mono truncate">
                        <span className="text-[#666b78]">{isRootFile ? './' : 'src/'}</span>
                        {file.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {file.hasKnownBug && file.content.includes('payload.amount * payload.rate') && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FF9F1C]/20 border border-[#FF9F1C]/50 text-[#FF9F1C]"
                          title="Contains intentional bug on line 19 for Option 2 Auto-Heal Loop"
                        >
                          BUG DEMO
                        </span>
                      )}
                      {file.lastRunStatus === 'HEALED' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981]">
                          HEALED
                        </span>
                      )}
                      {files.length > 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteFile(file.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#FF3B30]/20 text-[#9CA3AF] hover:text-[#FF3B30] transition-opacity"
                          title="Delete File"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mistral Model & Mode Info Card */}
          <div className="mt-auto p-3 m-2 rounded-lg bg-[#181818] border border-[#2d2d2d]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-[#00F2FE] uppercase tracking-wider font-semibold flex items-center space-x-1.5">
                {remoteConfig.mode === 'online' ? (
                  <Globe className="w-3 h-3 text-[#10b981]" />
                ) : (
                  <Radio className="w-3 h-3 text-[#ff9f1c]" />
                )}
                <span>MISTRAL SUITE // {activeSpec.shortName}</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              {activeSpec.specialization}. Supporting 7B, Large, Codestral &amp; NeMo architectures in Online &amp; Offline modes.
            </p>
          </div>
        </div>
      )}

      {/* Double-Layer Security Shield Settings Tab (Option 3) */}
      {activeTab === 'SECURITY' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div className="p-3 rounded-lg bg-[#11131A] border border-[#00F2FE]/30">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-[#00F2FE]" />
              <span className="font-heading font-bold text-xs text-[#00F2FE] uppercase">
                OPTION 3 // DOUBLE-LAYER SHIELD
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Enforces hard security boundary between the AI execution loop and your host OS.
            </p>
          </div>

          {/* Outside Boundary: Sandbox Container */}
          <div className="p-3 rounded-lg bg-[#161922] border border-[#232736] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6] flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#00F2FE]" />
                <span>Layer 1: Outside Boundary</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981]">
                SANDBOX JAIL
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Root path locked to <code className="text-[#00F2FE]">/workspace/sovereign-project</code>. Outside OS modification blocked.
            </p>
            <label className="flex items-center justify-between text-xs text-[#F3F4F6] pt-1">
              <span>Enforce Sandbox Path Jail</span>
              <input
                type="checkbox"
                checked={shieldConfig.enforcePathJail}
                onChange={(e) =>
                  onUpdateShieldConfig({ ...shieldConfig, enforcePathJail: e.target.checked })
                }
                className="accent-[#00F2FE]"
              />
            </label>
          </div>

          {/* Inside Boundary: AST Syscall Scanner */}
          <div className="p-3 rounded-lg bg-[#161922] border border-[#232736] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6] flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#FF9F1C]" />
                <span>Layer 2: Inside Boundary</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00F2FE]/20 text-[#00F2FE]">
                AST FIREWALL
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Intercepts destructive syscalls (<code className="text-[#FF3B30]">rm -rf /</code>, directory wipes, fork bombs) before terminal execution.
            </p>
            <label className="flex items-center justify-between text-xs text-[#F3F4F6] pt-1">
              <span>Block Destructive Syscalls</span>
              <input
                type="checkbox"
                checked={shieldConfig.blockDestructiveSyscalls}
                onChange={(e) =>
                  onUpdateShieldConfig({
                    ...shieldConfig,
                    blockDestructiveSyscalls: e.target.checked,
                  })
                }
                className="accent-[#00F2FE]"
              />
            </label>
          </div>

          {/* Airgap Telemetry Lock */}
          <div className="p-3 rounded-lg bg-[#161922] border border-[#232736] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F3F4F6]">Strict Sovereign Enclave</span>
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            </div>
            <p className="text-[11px] text-[#9CA3AF]">
              Blocks prohibited external connections and protects developer code privacy.
            </p>
          </div>
        </div>
      )}

      {/* Local-first Source Control view */}
      {activeTab === 'GIT' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-[#10B981]" />
              <span className="font-mono text-xs text-[#F3F4F6]">main</span>
            </div>
            <span className="text-[10px] font-mono text-[#9699a3]">LOCAL REPO</span>
          </div>

          {changedFiles.length === 0 ? (
            <div className="p-3 rounded border border-[#10B981]/25 bg-[#10B981]/[0.06] text-xs text-[#10B981]">
              Working tree clean
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#9699a3]">
                <span>CHANGES ({changedFiles.length})</span>
                <button
                  onClick={() => setStagedFileIds(changedFiles.map((file) => file.id))}
                  className="text-[#00F2FE] hover:text-[#F3F4F6]"
                >
                  Stage all
                </button>
              </div>
              <div className="space-y-1">
                {changedFiles.map((file) => {
                  const staged = stagedFileIds.includes(file.id);
                  return (
                    <button
                      key={file.id}
                      onClick={() => setStagedFileIds((current) => staged ? current.filter((id) => id !== file.id) : [...current, file.id])}
                      className="w-full flex items-center justify-between p-2 rounded bg-[#161922] border border-[#232736] hover:border-[#10B981]/40 text-left"
                    >
                      <span className="truncate text-xs font-mono text-[#F3F4F6]">{file.path}</span>
                      <span className={`text-[10px] font-mono ${staged ? 'text-[#10B981]' : 'text-[#FF9F1C]'}`}>{staged ? 'A' : 'M'}</span>
                    </button>
                  );
                })}
              </div>
              <input
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
                placeholder="Commit message"
                className="w-full rounded border border-[#2d2d2d] bg-[#0D0E12] px-2 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#10B981]"
              />
              <button
                disabled={stagedFileIds.length === 0 || !commitMessage.trim()}
                onClick={() => {
                  onGitCommit(stagedFileIds, commitMessage.trim());
                  setStagedFileIds([]);
                }}
                className="w-full flex items-center justify-center space-x-2 rounded bg-[#10B981]/15 border border-[#10B981]/40 px-3 py-2 text-xs font-mono font-bold text-[#10B981] hover:bg-[#10B981]/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>COMMIT {stagedFileIds.length ? `(${stagedFileIds.length})` : ''}</span>
              </button>
            </>
          )}
          <p className="text-[11px] leading-relaxed text-[#666b78]">
            Changes are tracked inside this desktop workspace.
          </p>
        </div>
      )}

      {/* Utility Settings Tab */}
      {activeTab === 'SETTINGS' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="p-3 rounded-lg bg-[#161922] border border-[#232736] space-y-2">
            <span className="text-xs font-mono font-bold text-[#FF9F1C] uppercase block">
              MISTRAL REMOTE NETWORK CONFIG
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Active Model</span>
                <span className="font-mono text-[#F3F4F6]">{activeSpec.displayName}</span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Mode</span>
                <span className="font-mono text-[#00F2FE]">{remoteConfig.mode.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>Endpoint</span>
                <span className="font-mono text-[#F3F4F6] truncate max-w-[130px]">{remoteConfig.endpointUrl}</span>
              </div>
              <div className="flex justify-between text-[#9CA3AF]">
                <span>API Key</span>
                <span className="font-mono text-[#10B981]">{remoteConfig.apiKey ? 'Configured' : 'Airgapped (None)'}</span>
              </div>
            </div>

            {onOpenSettingsModal && (
              <button
                type="button"
                onClick={onOpenSettingsModal}
                className="w-full mt-2 py-1.5 rounded bg-[#00F2FE]/15 hover:bg-[#00F2FE]/25 border border-[#00F2FE]/40 text-[#00F2FE] text-xs font-mono font-bold"
              >
                OPEN REMOTE API SETTINGS
              </button>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#161922] border border-[#232736] space-y-2">
            <span className="text-xs font-mono font-bold text-[#00F2FE] uppercase block">
              SYSCALL AUDIT STATUS
            </span>
            <div className="flex items-center space-x-2 text-xs text-[#10B981]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF9F1C]" />
              <span>Realtime Terminal Interceptor Enabled</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
