const { ipcRenderer } = require('electron');
ipcRenderer.on('show-notification', (event, title, body) => {
    const myNotification = new Notification(title, { body: body });
    myNotification.onclick = () => { //点击通知触发click事件
        alert("我知道了");
    }
});