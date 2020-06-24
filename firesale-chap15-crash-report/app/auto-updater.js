const { app, autoUpdater, dialog, BrowserWindow } = require('electron');

//判定是否是开发版本的原理：根据运行在开发版本时，exe文件对应所在的文件目录 `node_modules\electron\dist\...\electron`目录下
//但是，win10,electron9.x exe所在目录为‘位于node_modules\electron\dist’目录下，故这行代码可能不对了
const isDevelopment = app.getPath('exe').indexOf('electron') !== -1;

const baseUrl = 'https://firesale-releases.glitch.me';

const platform = process.platform;
const currentVersion = app.getVersion();

const releaseFeed = `${baseUrl}/releases/${platform}?currentVersion=${currentVersion}`;

if (isDevelopment) {
    console.info('[AutoUpdater]', 'In Developement Mode. Skipping…');
} else {
    console.info('[AutoUpdater]', `Setting release feed to ${releaseFeed}.`);
    autoUpdater.setFeedURL(releaseFeed);
}

autoUpdater.addListener('update-available', (event, releaseNotes, releaseName) => {
    console.log('UPDATED!', event, releaseNotes, releaseName);
    dialog.showMessageBox({
        type: 'question',
        buttons: ['Install & Relaunch', 'Not Now'],
        defaultId: 0,
        message: `${app.getName()} has been updated!`,
        detail: 'An update has been downloaded and can be installed now.'
    }, response => {
        if (response === 0) {
            setTimeout(() => {
                app.removeAllListeners('window-all-closed');
                BrowserWindow.getAllWindows().forEach(win => win.close());
                autoUpdater.quitAndInstall();
            }, 0);
        }
    });
});

module.exports = autoUpdater;