// ============================================================================
// AEGIS SOVEREIGN SHELL // PRELOAD — deliberately inert
// ============================================================================
// The preload exposes a frozen, read-only build identity and nothing else.
// There is no file system bridge, no shell bridge, no network bridge, and no
// generic invoke channel, so a compromised renderer has nothing to call into.
// If a future capability is ever needed here, it must be allowlisted by the
// Double-Layer Shield security kernel and auditable through the LAYER 1 ledger.
// ============================================================================

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('aegisSovereignShell', Object.freeze({
  product: 'Aegis AI Dev Studio',
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  capabilities: Object.freeze([]),
}));
