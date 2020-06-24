
const { crashReporter } = require('electron');

const host = 'http://localhost:3000/'; //将崩溃报告通过HTTP POST请求发送到这个URL
const config = {
    productName: "Fire Sale",
    companyName: 'Electron In Action',
    submitURL: host + 'crashreports',
    uploadToServer: true //表示希望将崩溃报告发送到服务器
};

crashReporter.start(config);
console.log('[INFO] Crash reporting started.', crashReporter);

//报告未捕获异常函数
const sendUncaughtException = error => {
    const { productName, companyName } = config;
    console.info('Catching error', error);
    request.post(host + 'uncaughtexceptions', { //向崩溃服务器发送HTTP POST请求
      form: {
        _productName: productName,
        _companyName: companyName,
        _version: manifest.version,
        platform: process.platform,
        process_type: process.type,
        ver: process.versions.electron,
        error: {          //发送的错误相关信息
          name: error.name,
          message: error.message,
          fileName: error.fileName,
          stack: error.stack,
          lineNumber: error.lineNumber,
          columnNumber: error.columnNumber,
        },
      },
    });
  };
  
  if (process.type === 'browser') {   //检测代码当前运行在主进程还是渲染进程中
    //在主进程中，监听Node的‘uncaughtException’事件
    process.on('uncaughtException', sendUncaughtException);
  } else {
    //在渲染进程中，向全局对象添加监听事件
    window.addEventListener('error', sendUncaughtException);
  }

module.exports = crashReporter