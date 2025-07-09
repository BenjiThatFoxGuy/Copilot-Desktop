const { app, BrowserWindow, Tray, Menu } = require('electron');
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
    },
  });


  // Load GitHub Copilot web interface
  win.loadURL('https://github.com/copilot');

  // Open any non-copilot links in the user's default browser
  const { shell } = require('electron');

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://github.com/copilot')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://github.com/copilot')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('close', (event) => {
    if (app.quitting) {
      win = null;
    } else {
      event.preventDefault();
      win.hide();
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
