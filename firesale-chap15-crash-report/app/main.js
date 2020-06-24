const { app, BrowserWindow, dialog, Menu } = require('electron');
const applicationMenu = require('./application-menu'); //引入应用菜单模块
const fs = require('fs');//引入Node的fs库，操作系统文件
const autoUpdater = require('./auto-updater'); //引入检测自动更新模块
require('./crash-reporter');
const createApplicationMenu = require('./application-menu');

const windows = new Set();
let mainWindow = null; // #A
const openFiles = new Map(); //Map可以使用任意类型的对象作为键

//app 负责管理Electron应用的生命周期
app.on('ready', () => {
    //Menu.setApplicationMenu(applicationMenu); //设置应用菜单
    createApplicationMenu();//设置应用菜单
    mainWindow = createwindow();
    autoUpdater.checkForUpdates(); //检测自动更新
});

app.on('closed', () => {
    mainWindow = null;
});

app.on('window-all-closed', () => {
    //检测应用是否运行在 macOS系统中
    if (process.platform === 'darwin') {
        return false; //返回false，取消默认行为
    }

    app.quit();
});

app.on('activate', (event, hasVisibleWindows) => {
    if (!hasVisibleWindows) {
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
        x: x,
        y: y,
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

    //用户关闭窗口，但窗口尚未真正关闭
    newWindow.on('close', (event) => {
        if (newWindow.isDocumentEdited()  //macOS系统
            || newWindow.fileContentChanged) {//其它平台
            event.preventDefault(); //阻止窗口关闭
            dialog.showMessageBox(newWindow, {
                type: 'warning',
                title: 'Quit with Unsaved Changes？',
                message: "若不保存文件，你所做的修改文件内容将会丢失",
                buttons: ['强制退出', '取消']
            }).then(result => {
                if (result.response === 0) {
                    newWindow.destroy();
                }
            });
        }
    });

    newWindow.on('focus', () => {
        createApplicationMenu(); //窗口获取焦点时，创建新的应用菜单
    });

    newWindow.on('closed', () => {
        windows.delete(newWindow);
        createApplicationMenu();//关闭一个窗口时，创建新的应用菜单
        stopWatchingFile(newWindow); //窗口关闭后，同时关闭文件监控器
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
    app.addRecentDocument(file); //将文件添加到操作系统的最近打开文件列表中
    targetWindow.webContents.send('file-opened', file, content);
    startWatchingFile(targetWindow, file); //监控文件
    createApplicationMenu(); //打开新文件时，创建新应用菜单
};

//保存为html
const saveHtml = exports.saveHtml = (targetWindow, content) => {
    dialog.showSaveDialog(targetWindow, {
        title: 'Save Html',
        defaultPath: app.getPath('documents'), //默认使用操作系统中用户的documents目录
        filters: [
            { name: 'HTML Files', extensions: ['html', 'htm'] }
        ]
    }).then(result => {

        if (result.filePath) {
            try {
                fs.writeFileSync(result.filePath, content);

            } catch (error) {
                console.log("保存html发生异常：" + error)
            }
        }
    }).catch(err => {
        console.log(err)
    })
};


//保存Markdown
const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {

    if (file) { //如果文件为空，打开文件保存对话框
        fs.writeFileSync(file, content);
    } else { //如果文件为空，打开文件保存对话框
        dialog.showSaveDialog(targetWindow, {
            title: 'Save Html',
            defaultPath: app.getPath('documents'), //默认使用操作系统中用户的documents目录
            filters: [
                { name: 'HTML Files', extensions: ['html', 'htm'] }
            ]
        }).then(result => {
            if (result.filePath) {
                fs.writeFileSync(result.filePath, content);
            }
        }).catch(err => {
            console.log(err)
        })
    }
};

//监控文件
const startWatchingFile = (targetWindow, file) => {
    stopWatchingFile(targetWindow);

    //问题：fs.watch ()在windows系统：一次修改会触发2次'change'
    //https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_fs_watchfile_filename_options_listener
    const watcher = fs.watch(file, (event) => { //Node 的文件监控器，文件有变化，重新读取文件
        if (event === `change`) {
            console.log('watch-change');
            const content = fs.readFileSync(file).toString();;
            targetWindow.fileContentChanged = true;
            targetWindow.webContents.send('file-changed', file, content); //文档内容发生改变消息
        } else {
            targetWindow.fileContentChanged = false;
        }
    });


    openFiles.set(targetWindow, watcher);
};

//停止监控文件
const stopWatchingFile = (targetWindow) => {
    if (openFiles.has(targetWindow)) {
        let watcher = openFiles.get(targetWindow);
        //https://www.nodeapp.cn/fs.html#fs_watcher_close
        watcher.close();//watcher.stop();
        openFiles.delete(targetWindow);
    }
};


