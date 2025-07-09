const { app, BrowserWindow, Tray, Menu, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

// Set appUserModelId for correct notification sender branding on Windows
if (process.platform === 'win32') {
  app.setAppUserModelId('Copilot Desktop');
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
    if (!url.startsWith('https://github.com/copilot') && !url.startsWith('https://github.com/settings/copilot') && !url.startsWith('https://github.com/login') && !url.startsWith('https://github.com/logout') && !url.startsWith('https://github.com/session')) {
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
    if (!url.startsWith('https://github.com/copilot') && !url.startsWith('https://github.com/settings/copilot') && !url.startsWith('https://github.com/login') && !url.startsWith('https://github.com/logout') && !url.startsWith('https://github.com/session')) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });


  // Load GitHub Copilot web interface
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
          label: 'Copilot Settings',
          accelerator: 'CommandOrControl+P',
          click: () => {
            const focusedWin = BrowserWindow.getFocusedWindow();
            if (focusedWin) {
              focusedWin.loadURL('https://github.com/settings/copilot/features');
            }
          }
        },
        {
          label: 'Copilot Settings (Alt)',
          accelerator: 'CommandOrControl+,',
          click: () => {
            const focusedWin = BrowserWindow.getFocusedWindow();
            if (focusedWin) {
              focusedWin.loadURL('https://github.com/settings/copilot/features');
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
        }
        // CSS path override
        const cssSelector = 'html.js-focus-visible.mhmerdf.idc0_350.ftcocii body.logged-in.env-production.page-responsive.copilotImmersive div.logged-in.env-production.page-responsive.copilotImmersive div.position-relative.header-wrapper.js-header-wrapper header.AppHeader div.AppHeader-globalBar.js-global-bar div.AppHeader-globalBar-start.responsive-context-region context-region-controller.AppHeader-context.responsive-context-region div.AppHeader-context-full nav context-region context-region-crumb a#dynamic-crumb-620f6yr-copilot-link.AppHeader-context-item span.AppHeader-context-item-label';
        const cssNode = document.querySelector(cssSelector);
        if (cssNode && cssNode.textContent && cssNode.textContent.trim() === 'Copilot') {
          cssNode.textContent = 'Copilot Desktop';
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
          }, 5000);
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

  win.on('close', (event) => {
    if (!app.quitting) {
      event.preventDefault();
      win.hide();
      // Notify user that app is still running in tray
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
  });
}

app.whenReady().then(() => {
  createWindow();
  tray = new Tray(path.join(__dirname, 'icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => {
        if (win) {
          win.show();
          win.focus();
        }
      }
    },
    { label: 'Quit', click: () => {
        app.quitting = true;
        app.quit();
      }
    }
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
