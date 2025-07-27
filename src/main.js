const { app, BrowserWindow, Tray, Menu, dialog, Notification, ipcMain, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

// Set appUserModelId for correct notification sender branding on Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('Copilot Desktop');
}

// Settings management
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
let appSettings = {
  showTrayNotification: true,
  startWithWindows: false,
  globalHotkey: 'CommandOrControl+Shift+C'
};

// Track if tray notification has been shown this session
let trayNotificationShown = false;

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      appSettings = { ...appSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

function setupGlobalHotkey() {
  // Clear existing hotkey
  globalShortcut.unregisterAll();
  
  if (appSettings.globalHotkey) {
    try {
      globalShortcut.register(appSettings.globalHotkey, () => {
        if (win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        }
      });
    } catch (error) {
      console.error('Error registering global hotkey:', error);
    }
  }
}

function setupAutoStart() {
  if (process.platform === 'win32' || process.platform === 'darwin') {
    app.setLoginItemSettings({
      openAtLogin: appSettings.startWithWindows
    });
  }
}

function showSettingsChoiceDialog() {
  if (!win) return;
  
  dialog.showMessageBox(win, {
    type: 'question',
    title: 'Open Settings',
    message: 'Which settings would you like to open?',
    buttons: ['Copilot Settings', 'Copilot Desktop Settings', 'Cancel'],
    defaultId: 0,
    cancelId: 2
  }).then((result) => {
    if (result.response === 0) {
      // Open Copilot Settings
      win.loadURL('https://github.com/settings/copilot/features');
    } else if (result.response === 1) {
      // Open Copilot Desktop Settings
      showDesktopSettingsDialog();
    }
  });
}

function showDesktopSettingsDialog() {
  if (!win) return;
  
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 400,
    parent: win,
    modal: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Create settings HTML content
  const settingsHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Copilot Desktop Settings</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 20px; 
          background: #0d1117; 
          color: #f0f6fc; 
        }
        .setting { 
          margin: 20px 0; 
          padding: 15px; 
          border: 1px solid #30363d; 
          border-radius: 6px; 
          background: #161b22; 
        }
        .setting label { 
          display: flex; 
          align-items: center; 
          cursor: pointer; 
        }
        .setting input[type="checkbox"] { 
          margin-right: 10px; 
        }
        .setting input[type="text"] { 
          width: 200px; 
          padding: 5px; 
          margin-left: 10px; 
          background: #0d1117; 
          border: 1px solid #30363d; 
          border-radius: 4px; 
          color: #f0f6fc; 
        }
        .buttons { 
          margin-top: 30px; 
          text-align: center; 
        }
        .btn { 
          padding: 8px 16px; 
          margin: 0 5px; 
          border: 1px solid #f85149; 
          border-radius: 6px; 
          background: #da3633; 
          color: white; 
          cursor: pointer; 
        }
        .btn:hover { 
          background: #f85149; 
        }
        .btn.secondary { 
          background: #21262d; 
          border-color: #30363d; 
        }
        .btn.secondary:hover { 
          background: #30363d; 
        }
        h1 { 
          color: #58a6ff; 
          margin-bottom: 20px; 
        }
        .description { 
          font-size: 12px; 
          color: #8b949e; 
          margin-top: 5px; 
        }
      </style>
    </head>
    <body>
      <h1>Copilot Desktop Settings</h1>
      
      <div class="setting">
        <label>
          <input type="checkbox" id="showTrayNotification" ${appSettings.showTrayNotification ? 'checked' : ''}>
          Show notification when minimized to tray
        </label>
        <div class="description">Display a notification when the app is minimized to the system tray (only shows once per session)</div>
      </div>
      
      <div class="setting">
        <label>
          <input type="checkbox" id="startWithWindows" ${appSettings.startWithWindows ? 'checked' : ''}>
          Start with Windows
        </label>
        <div class="description">Automatically start Copilot Desktop when Windows starts</div>
      </div>
      
      <div class="setting">
        <label>
          Global hotkey to summon app:
          <div style="display: flex; align-items: center; margin-left: 10px;">
            <button type="button" id="hotkeyButton" style="
              padding: 8px 12px; 
              background: #161b22; 
              border: 1px solid #30363d; 
              border-radius: 4px; 
              color: #f0f6fc; 
              cursor: pointer;
              min-width: 200px;
              text-align: left;
            ">${appSettings.globalHotkey}</button>
            <button type="button" id="clearHotkey" style="
              padding: 8px 12px; 
              background: #da3633; 
              border: 1px solid #f85149; 
              border-radius: 4px; 
              color: white; 
              cursor: pointer;
              margin-left: 8px;
            ">Clear</button>
          </div>
          <input type="hidden" id="globalHotkey" value="${appSettings.globalHotkey}">
        </label>
        <div class="description">Press this key combination to show and focus the app from anywhere. Click the button above and press your desired key combination.</div>
      </div>
      
      <div class="buttons">
        <button class="btn" onclick="saveSettings()">Save</button>
        <button class="btn secondary" onclick="window.close()">Cancel</button>
      </div>
      
      <script>
        let isCapturingHotkey = false;
        
        // Convert key event to Electron accelerator format
        function eventToAccelerator(event) {
          const parts = [];
          
          if (event.ctrlKey || event.metaKey) {
            parts.push('CommandOrControl');
          }
          if (event.altKey) {
            parts.push('Alt');
          }
          if (event.shiftKey) {
            parts.push('Shift');
          }
          
          // Map key codes to proper names
          let key = event.key;
          if (key === ' ') key = 'Space';
          else if (key === 'ArrowUp') key = 'Up';
          else if (key === 'ArrowDown') key = 'Down';
          else if (key === 'ArrowLeft') key = 'Left';
          else if (key === 'ArrowRight') key = 'Right';
          else if (key === 'Escape') key = 'Esc';
          else if (key === 'Delete') key = 'Delete';
          else if (key === 'Backspace') key = 'Backspace';
          else if (key === 'Tab') key = 'Tab';
          else if (key === 'Enter') key = 'Return';
          else if (/^F\d+$/.test(key)) {
            // Function keys are already in correct format
          } else if (key.length === 1) {
            key = key.toUpperCase();
          }
          
          // Don't include modifier keys as the main key
          if (['Control', 'Meta', 'Alt', 'Shift'].includes(key)) {
            return null;
          }
          
          parts.push(key);
          return parts.join('+');
        }
        
        document.getElementById('hotkeyButton').addEventListener('click', function() {
          if (isCapturingHotkey) return;
          
          isCapturingHotkey = true;
          this.textContent = 'Press key combination...';
          this.style.background = '#0969da';
          
          const handleKeyDown = (event) => {
            event.preventDefault();
            event.stopPropagation();
            
            const accelerator = eventToAccelerator(event);
            if (accelerator) {
              document.getElementById('globalHotkey').value = accelerator;
              this.textContent = accelerator;
              this.style.background = '#161b22';
              isCapturingHotkey = false;
              document.removeEventListener('keydown', handleKeyDown, true);
            }
          };
          
          document.addEventListener('keydown', handleKeyDown, true);
          
          // Cancel capture on click outside or escape
          const cancelCapture = () => {
            this.textContent = document.getElementById('globalHotkey').value;
            this.style.background = '#161b22';
            isCapturingHotkey = false;
            document.removeEventListener('keydown', handleKeyDown, true);
          };
          
          // Auto-cancel after 10 seconds
          setTimeout(() => {
            if (isCapturingHotkey) {
              cancelCapture();
            }
          }, 10000);
        });
        
        document.getElementById('clearHotkey').addEventListener('click', function() {
          document.getElementById('globalHotkey').value = '';
          document.getElementById('hotkeyButton').textContent = 'None - Click to set';
        });
        
        function saveSettings() {
          const hotkeyValue = document.getElementById('globalHotkey').value.trim();
          const settings = {
            showTrayNotification: document.getElementById('showTrayNotification').checked,
            startWithWindows: document.getElementById('startWithWindows').checked,
            globalHotkey: hotkeyValue || 'CommandOrControl+Shift+C'
          };
          
          window.electronAPI.saveSettings(settings);
          window.close();
        }
      </script>
    </body>
    </html>
  `;
  
  settingsWindow.loadURL('data:text/html,' + encodeURIComponent(settingsHTML));
}

// Load settings on startup
loadSettings();

// Single instance lock - prevent multiple instances from running
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window instead
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

// Auto-updater event handlers

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
  // No user prompt here to avoid duplicate dialogs
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  console.error('Error in auto-updater:', err);
  // Quit the app on auto-update error
  app.quitting = true;
  app.quit();
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.once('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
  if (win) {
    dialog.showMessageBox(win, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        app.quitting = true;
        autoUpdater.quitAndInstall();
      }
    });
  }
});


let tray = null;
let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    menuBarVisibility: 'visible', // Show menu bar on Alt
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Ensure external links open in the user's browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Open all non-Copilot and non-settings pages externally
    if (!url.startsWith('https://github.com/copilot') && !url.startsWith('https://github.com/settings/copilot') && !url.startsWith('https://github.com/login') && !url.startsWith('https://github.com/logout') && !url.startsWith('https://github.com/session') && !url.startsWith('https://github.com/marketplace')) {
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    // Redirect GitHub homepage clicks back to Copilot
    if (url === 'https://github.com/' || url === 'https://github.com') {
      event.preventDefault();
      win.loadURL('https://github.com/copilot');
      return;
    }
    // Allow in-app navigation for Copilot and settings pages, external otherwise
    if (!url.startsWith('https://github.com/copilot') && !url.startsWith('https://github.com/settings/copilot') && !url.startsWith('https://github.com/login') && !url.startsWith('https://github.com/logout') && !url.startsWith('https://github.com/session') && !url.startsWith('https://github.com/marketplace')) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });


  // Load GitHub Copilot web interface
  // Enable visual zoom via Ctrl+Scroll
  win.webContents.setVisualZoomLevelLimits(1, 3).catch(() => {});
  win.webContents.on('zoom-changed', (event, zoomDirection) => {
    let current = win.webContents.getZoomLevel();
    if (zoomDirection === 'in') {
      win.webContents.setZoomLevel(current + 1);
    } else if (zoomDirection === 'out') {
      win.webContents.setZoomLevel(current - 1);
    }
  });
  win.loadURL('https://github.com/copilot');


  // Set friendly app name for menubar and window
  if (process.platform === 'darwin' && app.setName) {
    app.setName('Copilot Desktop');
  }
  app.name = 'Copilot Desktop';
  // Set window title
  win.setTitle('Copilot Desktop');

  // Custom menu bar with standard and custom Help
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Chat',
          accelerator: 'CommandOrControl+N',
          click: () => {
            const focusedWin = BrowserWindow.getFocusedWindow();
            if (focusedWin) {
              focusedWin.webContents.executeJavaScript(
                'document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > aside > div.Sidebar-module__header--uOLk8 > a").click();'
              );
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings...',
          accelerator: 'CommandOrControl+P',
          click: () => {
            showSettingsChoiceDialog();
          }
        },
        {
          label: 'Settings... (Alt)',
          accelerator: 'CommandOrControl+,',
          click: () => {
            showSettingsChoiceDialog();
          }
        },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CommandOrControl+B',
          click: () => {
            const focusedWin = BrowserWindow.getFocusedWindow();
            if (focusedWin) {
              focusedWin.webContents.executeJavaScript(
                'document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > aside > div.Sidebar-module__header--uOLk8 > button").click();'
              );
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About',
              message: 'Copilot Desktop\nUnofficial GUI for GitHub Copilot.\nhttps://github.com/copilot',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify().then((result) => {
              if (result === null) {
                dialog.showMessageBox(win, {
                  type: 'info',
                  title: 'Check for Updates',
                  message: 'You are running the latest version.',
                  buttons: ['OK']
                });
              }
            }).catch((error) => {
              console.error('Error checking for updates:', error);
              dialog.showMessageBox(win, {
                type: 'error',
                title: 'Update Check Failed',
                message: 'Failed to check for updates. Please try again later.',
                buttons: ['OK']
              });
              // Quit the app on manual update failure
              app.quit();
            });
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // Inject JS to override Copilot title and show toast
  win.webContents.on('did-finish-load', () => {
    // 2. Override Copilot title
    // Get app version from package.json for toast key
    const appVersion = require(path.join(__dirname, '..', 'package.json')).version;
      win.webContents.executeJavaScript(`
      // Only override Copilot in the header using XPath and CSS path, with MutationObserver
      function overrideHeader() {
        // XPath override
        const xpath = '/html/body/div[1]/div[1]/header/div/div[1]/context-region-controller/div/nav/context-region/context-region-crumb/a/span';
        const xpathResult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const xpathNode = xpathResult.singleNodeValue;
        if (xpathNode && xpathNode.textContent && xpathNode.textContent.trim() === 'Copilot') {
          xpathNode.textContent = 'Copilot Desktop';
          // Remove href from parent link or make it reload Copilot
          const parentLink = xpathNode.closest('a');
          if (parentLink) {
            parentLink.removeAttribute('href');
            parentLink.style.cursor = 'pointer';
            parentLink.addEventListener('click', function(e) {
              e.preventDefault();
              window.location.href = '/copilot';
            }, { once: true });
          }
        }
        // CSS path override
        const cssSelector = 'html.js-focus-visible.mhmerdf.idc0_350.ftcocii body.logged-in.env-production.page-responsive.copilotImmersive div.logged-in.env-production.page-responsive.copilotImmersive div.position-relative.header-wrapper.js-header-wrapper header.AppHeader div.AppHeader-globalBar.js-global-bar div.AppHeader-globalBar-start.responsive-context-region context-region-controller.AppHeader-context.responsive-context-region div.AppHeader-context-full nav context-region context-region-crumb a#dynamic-crumb-620f6yr-copilot-link.AppHeader-context-item span.AppHeader-context-item-label';
        const cssNode = document.querySelector(cssSelector);
        if (cssNode && cssNode.textContent && cssNode.textContent.trim() === 'Copilot') {
          cssNode.textContent = 'Copilot Desktop';
          // Remove href from parent link or make it reload Copilot
          const parentLink = cssNode.closest('a');
          if (parentLink) {
            parentLink.removeAttribute('href');
            parentLink.style.cursor = 'pointer';
            parentLink.addEventListener('click', function(e) {
              e.preventDefault();
              window.location.href = '/copilot';
            }, { once: true });
          }
        }
      }
      overrideHeader();
      // Observe DOM changes to keep overriding as soon as the element appears
      const observer = new MutationObserver(() => {
        overrideHeader();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      // 3. Remove unwanted elements by selector
      function removeBySelector(sel) {
        const el = document.querySelector(sel);
        if (el) el.remove();
      }
      removeBySelector('.AppHeader-search');
      removeBySelector('.AppHeader-actions');
      removeBySelector('body > div.logged-in.env-production.page-responsive.copilotImmersive > div.position-relative.header-wrapper.js-header-wrapper > header > div > div.AppHeader-globalBar-end > notification-indicator');
      removeBySelector('body > div.logged-in.env-production.page-responsive.copilotImmersive > div.position-relative.header-wrapper.js-header-wrapper > header > div > div.AppHeader-globalBar-start.responsive-context-region > div');

      // 3.5 Override GitHub logo click to redirect to /copilot
      (function(){
        const logoLink = document.querySelector('header a[href="/"], header a[href="https://github.com/"]');
        if (logoLink) {
          logoLink.setAttribute('href', '/copilot');
          logoLink.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = '/copilot';
          });
        }
      })();

      // 4. Show GitHub-style toast only once per app version, dismissible on click
      (function() {
        try {
          // Only show toast once per version
          const versionKey = 'copilot-desktop-toast-v${appVersion}';
          if (localStorage.getItem(versionKey)) return;
          localStorage.setItem(versionKey, '1');
          const toast = document.createElement('div');
          toast.id = 'copilot-desktop-toast';
          toast.innerHTML = 'Press <span style="display:inline-block;background:#212830;color:#fff;border-radius:3px;padding:2px 8px;font-weight:bold;font-family:monospace;margin:0 2px;box-shadow:0 1px 2px rgba(0,0,0,0.08);vertical-align:middle;outline:2px solid #353b44;outline-offset:0;">Alt</span> to summon the menubar';
          toast.style.position = 'fixed';
          toast.style.bottom = '20px';
          toast.style.right = '20px';
          toast.style.background = '#161A21';
          toast.style.color = '#fff';
          toast.style.padding = '12px 24px';
          toast.style.borderRadius = '6px';
          toast.style.fontFamily = 'inherit';
          toast.style.fontSize = '16px';
          toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          toast.style.zIndex = 99999;
          toast.style.opacity = '0.98';
          toast.style.cursor = 'pointer';
          toast.title = 'Click to dismiss';
          toast.addEventListener('click', () => {
            if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
          });
          document.body.appendChild(toast);
        setTimeout(() => {
          if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
        }, 15000);
        } catch (e) {}
      })();

      // 5. Render a back button overlay when not on /copilot
      (function() {
        const btnId = 'copilot-back-button';
        if (document.getElementById(btnId)) return;
        if (!location.pathname.startsWith('/copilot')) {
          const btn = document.createElement('button');
          btn.id = btnId;
          btn.textContent = '← Back';
          btn.style.position = 'fixed';
          btn.style.bottom = '10px';
          btn.style.right = '10px';
          btn.style.padding = '6px 12px';
          btn.style.background = '#161A21';
          btn.style.color = '#fff';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.cursor = 'pointer';
          btn.style.zIndex = '100000';
          btn.addEventListener('click', () => history.back());
          document.body.appendChild(btn);
        }
      })();
    `);
  });

  // General context menu (copy/cut/paste/select all)
  win.webContents.on('context-menu', (e, params) => {
    const editMenu = Menu.buildFromTemplate([
      { role: 'copy', enabled: params.editFlags.canCopy },
      { role: 'cut', enabled: params.editFlags.canCut },
      { role: 'paste', enabled: params.editFlags.canPaste },
      { type: 'separator' },
      { role: 'selectAll' }
    ]);
    editMenu.popup({ window: win });
  });

  // Inject contextmenu listener on GitHub logo to open custom menu
  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      const logo = document.querySelector('header a[href="/"], header a[href="https://github.com/"]');
      if (logo) {
        logo.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          window.electronAPI.openLogoContextMenu();
        });
      }
    `);
  });

  // Handle Ctrl/Cmd+B to trigger sidebar button
  win.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Q: Quit app (all platforms)
    if ((input.control || input.meta) && !input.alt && !input.shift && input.key.toLowerCase() === 'q') {
      app.quitting = true;
      app.quit();
      event.preventDefault();
      return;
    }
    // Ctrl+Q/Cmd+Q: Quit the app
    if ((input.control || input.meta) && !input.alt && !input.shift && input.key.toLowerCase() === 'q') {
      app.quitting = true;
      app.quit();
      event.preventDefault();
      return;
    }
    // Ctrl+Plus/Minus/0 for zoom
    if ((input.control || input.meta) && !input.alt && !input.shift) {
      if (input.key === '=' || input.key === '+') {
        const current = win.webContents.getZoomLevel();
        win.webContents.setZoomLevel(current + 1);
        event.preventDefault();
      } else if (input.key === '-' || input.key === '_') {
        const current = win.webContents.getZoomLevel();
        win.webContents.setZoomLevel(current - 1);
        event.preventDefault();
      } else if (input.key === '0') {
        win.webContents.setZoomLevel(0);
        event.preventDefault();
      }
    }
    if (input.key.toLowerCase() === 'b' && (input.control || input.meta)) {
      win.webContents.executeJavaScript(
        'document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > aside > div.Sidebar-module__header--uOLk8 > button").click();'
      );
      event.preventDefault();
    }
    // Add Ctrl/Cmd+O to open upload dialog
    if (input.key.toLowerCase() === 'o' && (input.control || input.meta)) {
      win.webContents.executeJavaScript(`
        (function() {
        // Try header toolbar span, fallback to footer toolbar button
        let btn = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__content--s7QoY > div > div > div.NewConversation-module__main--GVJMw > div > div > div.NewConversation-module__innerContainer--gDENn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button");
        if (!btn) {
          btn = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__footer--raJHn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button");
        }
        if (btn) {
          btn.click();
            setTimeout(() => {
              const candidates = Array.from(document.querySelectorAll('button, div, span, a'));
              const upload = candidates.find(el => el.textContent && el.textContent.trim() === 'Upload from computer');
              if (upload) upload.click();
            }, 200);
          }
        })();
      `);
      event.preventDefault();
    }
  // Ctrl/Cmd+Shift+E: Open Extension...
  if (input.key.toLowerCase() === 'e' && (input.control || input.meta) && input.shift) {
    win.webContents.executeJavaScript(`
      (function() {
        // Try header toolbar span, fallback to footer toolbar button
        let span = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__content--s7QoY > div > div > div.NewConversation-module__main--GVJMw > div > div > div.NewConversation-module__innerContainer--gDENn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button > span");
        if (!span) {
          span = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__footer--raJHn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button");
        }
        if (span) {
          span.click();
          setTimeout(() => {
            const candidates = Array.from(document.querySelectorAll('button, div, span, a'));
            const ext = candidates.find(el => el.textContent && el.textContent.trim().includes('Extension'));
            if (ext) ext.click();
          }, 200);
        }
      })();
    `);
    event.preventDefault();
  }
  // '/': Only focus chat input if body is focused, otherwise let slash type normally
  if (input.key === '/' && !input.control && !input.meta && !input.shift && !input.alt) {
    win.webContents.executeJavaScript(`
      (function() {
        const ae = document.activeElement;
        if (!ae || ae === document.body) {
          const chatInput = document.querySelector('#copilot-chat-textarea');
          if (chatInput) { chatInput.focus(); return true; }
        }
        return false;
      })();
    `).then((didFocus) => {
      if (didFocus) event.preventDefault();
    });
  }
  // '`' or '~': Open Repositories... (only if not in a text input)
  if ((input.key === '`' || input.key === '~') && !input.control && !input.meta && !input.shift && !input.alt) {
    win.webContents.executeJavaScript(`
      (function() {
        const ae = document.activeElement;
        if (ae && ((ae.tagName === 'INPUT' && !ae.readOnly && ae.type !== 'checkbox' && ae.type !== 'button' && ae.type !== 'radio') || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
        // Try header toolbar span, fallback to footer toolbar button
        let span = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__content--s7QoY > div > div > div.NewConversation-module__main--GVJMw > div > div > div.NewConversation-module__innerContainer--gDENn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button > span");
        if (!span) {
          span = document.querySelector("body > div.logged-in.env-production.page-responsive.copilotImmersive > div.application-main > main > react-app > div > div > div.Layout-module__left--LHTG3 > div > div.Layout-module__footer--raJHn > div > div:nth-child(1) > form > div.ChatInput-module__toolbar--ZtCiG > div.ChatInput-module__toolbarLeft--cjV2H > button");
        }
        if (span) {
          span.click();
          setTimeout(() => {
            const candidates = Array.from(document.querySelectorAll('button, div, span, a'));
            const repos = candidates.find(el => el.textContent && el.textContent.trim().includes('Repositories'));
            if (repos) repos.click();
          }, 200);
        }
      })();
    `);
    event.preventDefault();
  }
});

  win.on('close', (event) => {
    if (!app.quitting) {
      event.preventDefault();
      win.hide();
      
      // Show notification only if enabled, and only once per session
      if (appSettings.showTrayNotification && !trayNotificationShown) {
        trayNotificationShown = true;
        const notifTitle = 'Copilot Desktop';
        let bodyMsg;
        if (process.platform === 'win32') {
          bodyMsg = `${notifTitle} is still running. You can find me in the system tray.`;
        } else if (process.platform === 'darwin') {
          bodyMsg = `${notifTitle} is still running. You can find me in the menu bar.`;
        } else {
          bodyMsg = `${notifTitle} is still running. You can find me in the tray.`;
        }
        new Notification({
          title: notifTitle,
          body: bodyMsg,
          icon: path.join(__dirname, 'icon.ico'),
        }).show();
      }
    }
  });
}

// Handle logo element context menu
ipcMain.on('logo-context-menu', (event) => {
  const menu = Menu.buildFromTemplate([
    { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
    { label: 'Exit', click: () => { app.quit(); } }
  ]);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) });
});

// Handle settings save
ipcMain.on('save-settings', (event, newSettings) => {
  appSettings = { ...appSettings, ...newSettings };
  saveSettings();
  
  // Update global hotkey
  setupGlobalHotkey();
  
  // Update auto-start
  setupAutoStart();
  
  // Ask user to restart the app for changes to fully take effect
  const settingsWindow = BrowserWindow.fromWebContents(event.sender);
  if (settingsWindow) {
    dialog.showMessageBox(settingsWindow, {
      type: 'question',
      title: 'Restart Required',
      message: 'Settings have been saved. Some changes may require a restart to take full effect.',
      detail: 'Would you like to restart Copilot Desktop now?',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      }
    });
  }
});

app.whenReady().then(() => {
  createWindow();
  
  // Setup global hotkey and auto-start
  setupGlobalHotkey();
  setupAutoStart();
  
  tray = new Tray(path.join(__dirname, 'icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { if (win) { win.show(); win.focus(); } } },
    { type: 'separator' },
    { label: 'Settings...', click: () => { showSettingsChoiceDialog(); } },
    { type: 'separator' },
    { label: 'Restart', click: () => { app.relaunch(); app.exit(0); } },
    { label: 'Clear User Data', click: () => { fs.rmSync(app.getPath('userData'), { recursive: true, force: true }); app.relaunch(); app.exit(0); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quitting = true; app.quit(); } }
  ]);
  tray.setToolTip('Copilot Desktop');
  tray.setContextMenu(contextMenu);
  // Show window on single click of the tray icon
  tray.on('click', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  // Auto-update on startup (packaged only)
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Cleanup global shortcuts
  globalShortcut.unregisterAll();
});
