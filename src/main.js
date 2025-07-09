const { app, BrowserWindow, Tray, Menu, dialog, Notification } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');


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


  // Load GitHub Copilot web interface
  win.loadURL('https://github.com/copilot');

  // Auto-updater logic
  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  autoUpdater.on('update-available', () => {
    if (win) {
      win.webContents.send('update_available');
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (win) {
      win.webContents.send('update_downloaded');
      dialog.showMessageBox(win, {
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart to install?',
        buttons: ['Restart', 'Later']
      }).then(result => {
        if (result.response === 0) autoUpdater.quitAndInstall();
      });
    }
  });

  // Open any non-copilot links in the user's default browser
  const { shell } = require('electron');

  // URLs that should be allowed to navigate in-app
  const allowedUrls = [
    'https://github.com/logout',
    'https://github.com/session',
    'https://github.com/login',
    'https://github.com/copilot',
  ];

  win.webContents.on('will-navigate', (event, url) => {
    if (
      !url.startsWith('https://github.com/copilot') &&
      !allowedUrls.some(allowed => url.startsWith(allowed))
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https://github.com/copilot') ||
      allowedUrls.some(allowed => url.startsWith(allowed))
    ) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Restore standard menubar and add Help
  const defaultMenu = Menu.buildFromTemplate([
    ...Menu.getApplicationMenu()?.items.map(item => item.toJSON()) || [],
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
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu));

  // Set friendly window/taskbar title
  win.setTitle('Copilot Desktop');

  // Inject JS to override Copilot title and show toast
  win.webContents.on('did-finish-load', () => {
    // 2. Override Copilot title
    win.webContents.executeJavaScript(`
      try {
        const el = document.evaluate('/html/body/div[1]/div[1]/header/div/div[1]/context-region-controller/div/nav/context-region/context-region-crumb/a/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (el) el.textContent = 'Copilot Desktop';
      } catch (e) {}
      // 3. Show GitHub-style toast
      (function() {
        if (document.getElementById('copilot-desktop-toast')) return;
        const toast = document.createElement('div');
        toast.id = 'copilot-desktop-toast';
        toast.textContent = 'Press alt to summon the menubar';
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.background = '#24292f';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '6px';
        toast.style.fontFamily = 'inherit';
        toast.style.fontSize = '16px';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        toast.style.zIndex = 99999;
        toast.style.opacity = '0.98';
        document.body.appendChild(toast);
        setTimeout(() => { toast.remove(); }, 5000);
      })();
    `);
  });

  win.on('close', (event) => {
    if (app.quitting) {
      win = null;
    } else {
      event.preventDefault();
      win.hide();
      // 4. Native notification on hide
      let msg = '';
      let notifTitle = 'Copilot Desktop';
      if (process.platform === 'win32') {
        msg = 'Copilot Desktop is still running. You can find me in the system tray.';
      } else if (process.platform === 'darwin') {
        msg = 'Copilot Desktop is still running. You can find me in the menu bar.';
      } else {
        msg = 'Copilot Desktop is still running. You can find me in the tray.';
      }
      new Notification({ title: notifTitle, body: msg }).show();
    }
  });
}


app.whenReady().then(() => {
  createWindow();
  tray = new Tray(path.join(__dirname, 'icon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => { win.show(); } },
    { label: 'Quit', click: () => {
      app.quitting = true;
      app.quit();
    } }
  ]);
  tray.setToolTip('Copilot Desktop');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    win.show();
  });
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
