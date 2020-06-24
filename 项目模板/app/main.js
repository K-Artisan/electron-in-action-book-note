const { app, BrowserWindow } = require('electron');
let mainWindow = null; // #A

//app 负责管理Electron应用的生命周期
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    }
    );
    mainWindow.loadURL(`${__dirname}/index.html`); // #A
});