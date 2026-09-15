import React, { useRef, useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Split,
  Sparkles,
  FileCode,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { WorkspaceFile } from '../workspace/defaultFiles';
import { MistralModelId, MISTRAL_MODELS } from '../engine/mistralClient';
import { parseCodeIntoBites } from '../engine/sovereignBiteEngine';

interface PinterestCodeStudioProps {
  files: WorkspaceFile[];
  activeFile: WorkspaceFile;
  onSelectFile: (fileId: string) => void;
  onCodeChange: (newContent: string) => void;
  onRunCurrentScript: () => void;
  onTriggerAutoHealLoop: () => void;
  isHealingLoopRunning: boolean;
  onResetSampleBug: () => void;
  onCreateNewFile: (name: string) => void;
  activeModel: MistralModelId;
}

export const PinterestCodeStudio: React.FC<PinterestCodeStudioProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCodeChange,
  onRunCurrentScript,
  onTriggerAutoHealLoop,
  isHealingLoopRunning,
  onResetSampleBug,
  onCreateNewFile,
  activeModel,
}) => {
  const [showDiff, setShowDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const lines = activeFile.content.split('\n');
  const bites = parseCodeIntoBites(activeFile.content, activeFile.path);
  const modelSpec = MISTRAL_MODELS[activeModel] || MISTRAL_MODELS['codestral-latest'];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateNewFile(newFileName.trim());
    setNewFileName('');
    setIsCreatingFile(false);
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-6 overflow-hidden select-none">
      <div className="flex-1 pinterest-card flex flex-col bg-[#FFFFFF] overflow-hidden shadow-md">
        {/* Top Studio Controls Bar */}
        <div className="h-12 px-4 border-b border-[#EFE7DE] flex items-center justify-between shrink-0 bg-[#FCFAF7]">
          {/* File Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {files.map((file) => {
              const isActive = file.id === activeFile.id;
              return (
                <button
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#FFFFFF] text-[#1C1917] font-semibold shadow-xs border border-[#E8DFD5]'
                      : 'text-[#78716C] hover:bg-[#F2ECE3] hover:text-[#1C1917]'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-[#E07A5F]" />
                  <span>{file.name}</span>
                  {file.hasKnownBug && (
                    <span className="w-2 h-2 rounded-full bg-[#D97706]" title="Contains bug demo" />
                  )}
                  {file.lastRunStatus === 'HEALED' && (
                    <span className="w-2 h-2 rounded-full bg-[#0D9488]" title="Healed by Codestral" />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setIsCreatingFile(true)}
              className="p-1 rounded-lg text-[#8C827A] hover:text-[#1C1917] hover:bg-[#F0E8DC]"
              title="Add new file"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <span
              className="hidden lg:flex items-center px-2 py-1 rounded-lg bg-[#FAF6F0] border border-[#E8DFD5] text-[10px] font-mono text-[#57534E]"
              title={`${modelSpec.displayName} · patches are re-inspected by KALI GPT before applying`}
            >
              {modelSpec.shortName}
            </span>

            <button
              onClick={() => setShowDiff(!showDiff)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                showDiff
                  ? 'bg-[#FAF0E6] text-[#E07A5F] border border-[#E07A5F]/40'
                  : 'bg-[#FFFFFF] text-[#57534E] border border-[#E8DFD5] hover:border-[#D6C8BA]'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showDiff ? 'Hide AST Diff' : 'AST Patch Diff'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] text-[#57534E] border border-[#E8DFD5] hover:border-[#D6C8BA] text-xs font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#0D9488]" />
                  <span className="text-[#0D9488]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              onClick={onResetSampleBug}
              className="p-1.5 rounded-xl bg-[#FFFFFF] text-[#8C827A] hover:text-[#D97706] border border-[#E8DFD5] transition-colors"
              title="Reset sample bug on paymentProcessor.js"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Run in sandbox button */}
            <button
              onClick={onRunCurrentScript}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C1917] hover:bg-[#2E2A27] text-[#FFFFFF] text-xs font-semibold transition-all shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run in Sandbox</span>
            </button>

            {/* Auto-Heal Loop trigger button */}
            <button
              onClick={onTriggerAutoHealLoop}
              disabled={isHealingLoopRunning}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#E07A5F] hover:bg-[#C9664B] disabled:opacity-50 text-[#FFFFFF] text-xs font-semibold transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHealingLoopRunning ? 'Healing...' : 'Auto-Heal (Codestral)'}</span>
            </button>
          </div>
        </div>

        {/* New File Input Bar */}
        {isCreatingFile && (
          <form
            onSubmit={handleCreateSubmit}
            className="px-4 py-2 bg-[#FAF6F0] border-b border-[#EFE7DE] flex items-center space-x-2"
          >
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="e.g. src/authService.ts"
              className="bg-[#FFFFFF] border border-[#E0D7CC] rounded-lg px-3 py-1 text-xs text-[#1C1917] focus:outline-none focus:border-[#E07A5F] flex-1 max-w-sm"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-[#E07A5F] text-[#FFFFFF] text-xs font-semibold"
            >
              Add File
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFile(false)}
              className="px-2 py-1 text-xs text-[#8C827A] hover:text-[#1C1917]"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Editor Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden bg-[#FFFFFF]">
          {!showDiff ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Line Numbers */}
              <div className="w-12 py-4 flex flex-col items-end pr-3 select-none text-[#A8A29E] font-mono text-xs bg-[#FAF7F3] border-r border-[#EFE7DE]">
                {lines.map((_, i) => (
                  <div key={i} className="h-5 leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Native Editable Code Area */}
              <textarea
                ref={editorRef}
                value={activeFile.content}
                onChange={(e) => onCodeChange(e.target.value)}
                spellCheck={false}
                aria-label={`Edit ${activeFile.path}`}
                className="flex-1 p-4 bg-[#FFFFFF] text-[#292524] font-mono text-xs leading-5 resize-none focus:outline-none select-text overflow-auto"
              />
            </div>
          ) : (
            /* Split Diff View */
            <div className="flex-1 grid grid-cols-2 divide-x divide-[#EFE7DE] overflow-auto p-4 font-mono text-xs">
              <div>
                <div className="text-[11px] font-bold text-[#DC2626] mb-2 pb-1 border-b border-[#FEE2E2]">
                  ORIGINAL UNPROTECTED CODE
                </div>
                <pre className="text-[#57534E] whitespace-pre-wrap leading-5">
                  {activeFile.content}
                </pre>
              </div>
              <div className="pl-4">
                <div className="text-[11px] font-bold text-[#0D9488] mb-2 pb-1 border-b border-[#CCFBF1]">
                  CODESTRAL 22B AST HEALED CODE
                </div>
                <pre className="text-[#0F766E] whitespace-pre-wrap leading-5">
                  {bites.map((b) => b.healedSnippet).join('\n')}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
