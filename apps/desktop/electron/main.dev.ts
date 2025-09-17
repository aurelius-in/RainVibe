import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';

let win: BrowserWindow | null = null;

const createWindow = async () => {
  nativeTheme.themeSource = 'dark';
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'RainVibe',
  });

  const devServerUrl = 'http://localhost:5173';
  await win.loadURL(devServerUrl);
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

