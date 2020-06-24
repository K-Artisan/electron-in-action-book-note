const path = require('path');
const { app, Menu, Tray
    , systemPreferences
    , nativeTheme
    , clipboard  //剪切板模块
    , globalShortcut
    , BrowserWindow
    , Notification // 通知模块
}
    = require('electron');
let tray = null;
let clippings = []; //存储剪贴板项
let browserWindow = null;

const getIcon = () => {
    // if (process.platform === 'win32') {
    //     return 'icon-light@2x.ico';
    // }

    //(electron) 'systemPreferences.isDarkMode()' is deprecated and will be removed. Please use 'nativeTheme.shouldUseDarkColors' instead.
    // if (systemPreferences.isDarkMode()) { //maxOS系统是否处于深色模式
    //     return 'icon-light@2x.png';
    // }

    if (nativeTheme.shouldUseDarkColors) { //maxOS系统是否处于深色模式
        return 'icon-light@2x.png';
    }

    return 'icon-dark.png';
};

app.on('ready', () => {
    tray = new Tray(path.join(__dirname, getIcon()));
    if (process.platform === 'win32') { //windows系统
        tray.on('click', tray.popUpContextMenu);
    }

    if (app.dock) { //macOS系统
        app.dock.hide(); //隐藏Dock图标
    }
    //macOS单击菜单栏切换图标
    tray.setPressedImage(path.join(__dirname, 'icon-light.png'))

    browserWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        show: false
    });

    browserWindow.loadURL(`file://${__dirname}/index.html`);

    //注册全局快捷键：弹出菜单
    const activationShortcut = globalShortcut.register('CommandOrControl+Alt+num7', () => {
        tray.popUpContextMenu();
    });

    if (!activationShortcut) console.error('Global activation shortcut failed to regiester');

    //注册全局快捷键：将剪贴项放入内存数组
    const newClippingShortcut = globalShortcut.register('CommandOrControl+Alt+num8', () => {
        const clipping = addClipping();
        if (clipping) {
            browserWindow.webContents.send('show-notification', '已经添加到剪切板', clipping);
        }
    });

    if (!newClippingShortcut) console.error('Global new clipping shortcut failed to regiester');

    tray.setToolTip('Clipmaster');
    updateMenu();//tray.setContextMenu(menu);
});

const updateMenu = () => {
    const menu = Menu.buildFromTemplate([
        {
            label: 'Create New Clipping',
            //click() { addClipping(); },
            click: () => {
                let clipping = addClipping();
                //使用Notification模块发送通知
                let myNotification = new Notification({
                    title: 'Notification模块通知',
                    body: clipping
                })
                myNotification.show();//必须调用show才会显示通知
                myNotification.on('click', () => {
                    console.log('Notification模块通知的点击事件')
                });

            },
            accelerator: 'CommandOrControl+Alt+num5'
        },
        { type: 'separator' },
        ...clippings.slice(0, 10).map(createClippingMenuItem),
        { type: 'separator' },
        {
            label: 'Quit',
            click() { app.quit(); },
            accelerator: 'CommandOrControl+Q'
        }
    ]);
    tray.setContextMenu(menu);
}


const addClipping = () => {
    const clipping = clipboard.readText();  //读取剪切项
    if (clippings.includes(clipping)) return;
    clippings.unshift(clipping);
    updateMenu();
    return clipping;
};


const createClippingMenuItem = (clipping, index) => {
    return {
        label: clipping.length > 20 ? clipping.slice(0, 20) + '…' : clipping,
        click() { clipboard.writeText(clipping); }, // 写入剪切板
        accelerator: `CommandOrControl+${index}`    //快捷键 递增
    };
};