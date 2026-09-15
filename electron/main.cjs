// ============================================================================
// AEGIS SOVEREIGN SHELL // HARDENED ELECTRON HOST
// ============================================================================
// The renderer (the studio UI) is treated as an UNTRUSTED surface — exactly
// like the workspace code it sandboxes. This main process is the outside
// boundary of the desktop app:
//   • no Node integration, context isolation + true sandbox on, no preload
//     capability surface beyond an inert version banner
//   • navigation is pinned to the local UI; window.open and webview are denied
//   • every permission request (camera, mic, clipboard, geolocation, …) is denied
//   • devtools / menu / keyboard shortcuts to them are removed in packaged runs
//   • single-instance lock: no second hostile window riding the profile
// ============================================================================

const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');

// Strict process sandbox before app is ready (renderer gets its own OS sandbox).
app.commandLine.appendSwitch('js-flags', '--no-experimental-fetch');
app.enableSandbox();

// Block node integration env leakage & keep telemetry-adjacent features off.
app.disableHardwareAcceleration(); // deterministic surface, fewer driver attack paths is acceptable here

const IS_DEV = !app.isPackaged;

function isTrustedInternalUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === 'file:') return true;
    // Vite dev server on loopback only.
    if (url.protocol === 'http:') {
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    }
    return false;
  } catch {
    return false;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#FAF6F0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      spellcheck: false,
      devTools: IS_DEV,
    },
  });

  // Denying everything that is not explicitly the studio UI.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // No popups ever. External https links are the only thing a user can even
    // ask for, and those open in the OS browser, outside the app.
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' && !IS_DEV) {
        void shell.openExternal(url);
      }
    } catch {
      /* denied */
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedInDev = IS_DEV && url.startsWith(process.env.AEGIS_DEV_URL || 'http://localhost:5173');
    if (!allowedInDev && !isTrustedInternalUrl(url)) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  if (!IS_DEV) {
    mainWindow.webContents.on('devtools-opened', () => mainWindow.webContents.closeDevTools());
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const blockedCombo =
        input.type === 'keyDown' &&
        ((input.control && input.shift && ['i', 'j', 'c'].includes(input.key.toLowerCase())) ||
          input.key === 'F12');
      if (blockedCombo) event.preventDefault();
    });
  }

  const indexPath = path.join(__dirname, '../dist/index.html');
  if (IS_DEV && process.env.AEGIS_DEV_URL) {
    void mainWindow.loadURL(process.env.AEGIS_DEV_URL);
  } else {
    mainWindow.loadFile(indexPath);
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) win.focus();
  });

  app.whenReady().then(() => {
    // A global hard "no menus" policy: no edit/copy/view shortcuts beyond what
    // the page itself wires up.
    Menu.setApplicationMenu(null);

    const ses = session.defaultSession;

    // Deny every permission prompt the renderer could request.
    ses.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    ses.setPermissionCheckHandler(() => false);

    // Strip framing headers we don't need and ensure the window can't be
    // embedded or embed anything: the singlefile bundle is fully local.
    ses.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'X-Frame-Options': ['DENY'],
          'Content-Security-Policy': [
            "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.mistral.ai http://localhost:* http://127.0.0.1:*; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
          ],
        },
      });
    });

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
