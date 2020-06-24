const { app, BrowserWindow } = require('electron');
let mainWindow = null; // #A

//app 负责管理Electron应用的生命周期
app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false, //#A.1首次创建窗口，先隐藏
        webPreferences: {
            nodeIntegration: true
        }
    }
    );

    //#A.2 需要长时间加载的页面
    mainWindow.loadURL(`${__dirname}/index.html`); // #A

    //#A.3:一次性时间监听器，DOM就绪后再显示窗口，避免在窗口中显示白屏
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
});



app.on('closed', () => {
    mainWindow = null;
});