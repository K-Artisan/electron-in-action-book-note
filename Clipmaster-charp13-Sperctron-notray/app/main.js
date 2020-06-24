const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
let mainWindow = null; // #A

app.on('ready', () => {
  mainWindow = createWindow();

  const createClipping = globalShortcut.register('CommandOrControl+!', () => {
    mainWindow.webContents.send('create-new-clipping');
  });

  const writeClipping = globalShortcut.register('CmdOrCtrl+Alt+@', () => {
    mainWindow.webContents.send('write-to-clipboard');
  });

  const publishClipping = globalShortcut.register('CmdOrCtrl+Alt+#', () => {
    mainWindow.webContents.send('publish-clipping');
  });

  if (!createClipping) { console.error('Registration failed', 'createClipping'); }
  if (!writeClipping) { console.error('Registration failed', 'writeClipping'); }
  if (!publishClipping) { console.error('Registration failed', 'publishClipping'); }

});

const createWindow = () => {
  let newWindow = new BrowserWindow({
    show: false, //#A.1首次创建窗口，先隐藏
    webPreferences: {
      nodeIntegration: true
    }
  });

  //#A.2 需要长时间加载的页面
  newWindow.loadURL(`${__dirname}/index.html`); // #A

  //#A.3:一次性时间监听器，DOM就绪后再显示窗口，避免在窗口中显示白屏
  newWindow.once('ready-to-show', () => {
    newWindow.show();
    //mainWindow.webContents.openDevTools();
  });

  newWindow.on('closed', () => {
    newWindow = null;
  })

  return newWindow;
}
