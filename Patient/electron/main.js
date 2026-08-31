import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5174';
const API_BASE = process.env.API_URL || '';
const isDev = !app.isPackaged;

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#FAFAF8',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      additionalArguments: API_BASE ? [`--api-base=${API_BASE}`] : []
    }
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media' || permission === 'audioCapture' || permission === 'videoCapture');
  });

  session.defaultSession.setPermissionCheckHandler((_webContents, permission) =>
    permission === 'media' || permission === 'audioCapture' || permission === 'videoCapture'
  );

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
