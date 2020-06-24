const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');//引入Node的fs库

const windows = new Set();
let mainWindow = null; // #A

//app 负责管理Electron应用的生命周期
app.on('ready', () => {
    mainWindow = createwindow();
});

app.on('closed', () => {
    mainWindow = null;
});

app.on('window-all-closed', ()=>{
    //检测应用是否运行在 macOS系统中
   if (process.platform === 'darwin'){
       return false; //返回false，取消默认行为
   }

   app.quit();
});

app.on('activate', (event, hasVisibleWindows)=>{
    if(!hasVisibleWindows){
        createwindow();
    }
});

const createwindow = exports.createWindow = () => {
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 10;
        y = currentWindowY + 10;
    }
    let newWindow = new BrowserWindow({
        x:x,
        y:y,
        show: false, //#A.1首次创建窗口，先隐藏
        webPreferences: {
            nodeIntegration: true
        }
    }

    );

    //#A.2 需要长时间加载的页面
    newWindow.loadURL(`${__dirname}/index.html`); // #A

    //#A.3:一次性时间监听器，DOM就绪后再显示窗口，避免在窗口中显示白屏
    newWindow.once('ready-to-show', () => {
        newWindow.show();
        //mainWindow.webContents.openDevTools();
    });

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    })

    windows.add(newWindow);
    return newWindow;
}

const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    //9.x
    dialog.showOpenDialog({
        properties: ['openFile']
        , filters: [
            { name: 'Markdown Files', extensions: ['md', 'markdown'] },
            { name: 'Text Files', extensions: ['txt'] }
        ]
    }).then(result => {
        console.log(result.canceled);
        console.log(result.filePaths);
        if (result.filePaths) {
            openFile(targetWindow, result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err)
    })
};

const openFile = exports.openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    targetWindow.webContents.send('file-opened', file, content); // B
};