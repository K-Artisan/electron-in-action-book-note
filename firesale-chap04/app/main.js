const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');//引入Node的fs库

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
        //mainWindow.webContents.openDevTools();
    });
});

app.on('closed', () => {
    mainWindow = null;
});

const getFileFromUser = exports.getFileFromUser = () => {
    //2.x
    /* const files = dialog.showOpenDialog(mainWindow, {
         properties: ['openFile'],
         filters: [
             { name: 'Text Files', extensions: ['txt'] },
             { name: 'Markdown Files', extensions: ['md', 'markdown'] }
         ]
     }
     });
 
     if (files && files[0]) {
         openFile(files[0]);
     } // A
 */
    /*
       //5.x
           dialog.showOpenDialog({
               properties: ['openFile']
               , filters: [
                   { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                   { name: 'Text Files', extensions: ['txt'] }
               ]
           }, (files) => {
               if (files) {
                   openFile(files[0]);
               }
           })
     */
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
            openFile(result.filePaths[0]);
        }
    }).catch(err => {
        console.log(err)
    })
};

const openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    mainWindow.webContents.send('file-opened', file, content); // B
};