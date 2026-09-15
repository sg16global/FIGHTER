// ============================================================================
// SOVEREIGN BLANK EXECUTION ENGINE (offline / airgapped)
// ----------------------------------------------------------------------------
// FORMERLY: a six-branch heuristic inference core that sniffed keywords from
// the user's prompt and synthesized autonomous multi-model "reasoning" —
// app builders, master-brain orchestration, self-deciding audits. That was an
// independent thinking loop. It has been fully disconnected and stripped.
//
// NOW: a blank executor. This engine holds NO behavioral preset and performs
// NO intent detection of its own. Its entire output is a deterministic pass
// of the operator's compiled master-algorithm blocks:
//   • ENGINE DISARMED (no enabled block) → pure STANDBY. Nothing is generated.
//   • ENGINE ARMED → each enabled block executes verbatim, in stage order.
//     `FILE <path>:` regions surface as synthesized files (still gated by
//     LAYER 1 patch policy + LAYER 2 filename policy in the caller).
//
// The KALI / SHELL / TERMINAL security layers are not reasoning and are never
// bypassed here; this engine only ever returns TEXT to the gated pipeline.
// ============================================================================

import { MistralModelId, MISTRAL_MODELS } from './mistralClient';
import { AgentId } from '../agents/agents';
import type { CodeBite } from './sovereignBiteEngine';
import {
  LogicBlock,
  STANDBY_NOTICE,
  compileDirectives,
  isEngineArmed,
} from './masterAlgorithm';

export interface OfflineInferenceResult {
  text: string;
  bites?: CodeBite[];
  latencyMs: number;
  model: MistralModelId;
  mode: 'offline-airgap';
  engineState: 'BLANK_STANDBY' | 'ARMED_DIRECTIVE_RUN';
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  generatedFile?: {
    name: string;
    path: string;
    content: string;
  };
}

/**
 * Blank-engine execution: standby unless the master algorithm is armed.
 */
export function generateOfflineMistralResponse(options: {
  modelId: MistralModelId;
  agentId: AgentId;
  prompt: string;
  filePath: string;
  fileContent: string;
  logicBlocks: LogicBlock[];
}): OfflineInferenceResult {
  const { modelId, prompt, logicBlocks } = options;
  const spec = MISTRAL_MODELS[modelId] || MISTRAL_MODELS['codestral-latest'];
  const armed = isEngineArmed(logicBlocks);

  if (!armed) {
    return {
      text: STANDBY_NOTICE,
      latencyMs: 1,
      model: modelId,
      mode: 'offline-airgap',
      engineState: 'BLANK_STANDBY',
      tokens: { prompt: Math.max(1, Math.round(prompt.length / 3.8)), completion: 0, total: Math.max(1, Math.round(prompt.length / 3.8)) },
    };
  }

  const directives = compileDirectives(logicBlocks);
  const sections: string[] = [
    `### [${spec.shortName} // BLANK ENGINE · DIRECTIVE RUN]`,
    `${directives.length} armed block${directives.length === 1 ? '' : 's'} executed verbatim under ${spec.posture} posture (no persona, no reasoning preset).`,
  ];

  let generatedFile: OfflineInferenceResult['generatedFile'];

  for (const d of directives) {
    sections.push(`\n**[${d.stage}] ${d.title}**\n\n${d.emit}`);
    // First FILE directive surfaces for the gated workspace pipeline; the
    // remaining ones are reported but held — one write per directive run keeps
    // the L1/L2 audit chain legible and prevents cascade planting.
    if (d.file && !generatedFile) {
      generatedFile = {
        name: d.file.path.split('/').pop() || d.file.path,
        path: d.file.path,
        content: d.file.content,
      };
    } else if (d.file) {
      sections.push(`\n_(additional FILE directive for \`${d.file.path}\` held: one workspace write per directive run — commit again to stage it)_`);
    }
  }

  sections.push(
    '\n---\n_Directive execution is mechanical: text above is the operator\u2019s blocks, not model reasoning. Security layers KALI/SHELL/TERMINAL remain enforced on every downstream write and run._'
  );

  const text = sections.join('\n');
  const promptTokens = Math.max(12, Math.round(prompt.length / 3.8));
  const completionTokens = Math.max(25, Math.round(text.length / 3.8));

  return {
    text,
    latencyMs: 2,
    model: modelId,
    mode: 'offline-airgap',
    engineState: 'ARMED_DIRECTIVE_RUN',
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
    generatedFile,
  };
}
