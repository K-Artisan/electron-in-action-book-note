const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main.js');
const path = require('path');
const marked = require('marked');

const currentWindow = remote.getCurrentWindow();
const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

let filePath = null;
let originalContent = '';

const renderMarkdownToHtml = (markdown) => {
    htmlView.innerHTML = marked(markdown, { sanitize: true });
};

markdownView.addEventListener('keyup', (event) => {
    const currentContent = event.target.value;
    renderMarkdownToHtml(currentContent);
    updateUserInterface(currentContent !== originalContent);
});

newFileButton.addEventListener('click', () => {
    mainProcess.createWindow();
});

openFileButton.addEventListener('click', () => {
    mainProcess.getFileFromUser(currentWindow);
});

//保存为Html
saveHtmlButton.addEventListener('click', () => {
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});

//回撤
revertButton.addEventListener('click', () => {
    markdownView.value = originalContent;
    renderMarkdownToHtml(originalContent);
});

//保存Markdow
saveMarkdownButton.addEventListener('click', () => {
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value);
});


//打开文件
ipcRenderer.on('file-opened', (event, file, content) => {
    if (currentWindow.isDocumentEdited()  //macOS系统
        || currentWindow.fileContentChanged) {//其它平台
        event.preventDefault(); //阻止窗口关闭
        dialog.showMessageBox(currentWindow, {
            type: 'warning',
            title: '当前文档尚未保存',
            message: "当前文档尚未保存，新打开的文档将覆盖当前文档",
            buttons: ['继续打开', '取消']
        }).then(result => {
            if (result.response === 0) {
                renderFile(file, content);
            }
        });
    } else {
        renderFile(file, content);
    }
});

//文件内容发生改变，提示用户
ipcRenderer.on('file-changed', (event, file, content) => {

    remote.dialog.showMessageBox(currentWindow, {
        type: 'warning',
        title: '警告',
        message: "文档内容已被其它程序修改，是否加载并覆盖当前的内容",
        buttons: ['加载覆盖', '取消']
    }).then(result => {
        if (result.response === 0) {
            renderFile(file, content);
        }
    });

});

const renderFile = (file, content) => {
    filePath = file;
    originalContent = content;

    markdownView.value = content;
    renderMarkdownToHtml(content);

    updateUserInterface(false);
}

const updateUserInterface = (isEdited) => {
    let title = "Fire Sale";
    if (filePath) {
        title = `${path.basename(filePath)} - ${title}`; //path.basename：根据文件路径获取文件名
    }

    if (isEdited) {
        title = `${title} (edited)`;
    }
    currentWindow.setTitle(title);
    currentWindow.setDocumentEdited(isEdited); //MacOS

    saveMarkdownButton.disabled = !isEdited;
    revertButton.disabled = !isEdited;

};

document.addEventListener('dragstart', event => {
    event.preventDefault();//禁用默认事件
});

//拖拽到上边
document.addEventListener('dragover', event => {
    event.preventDefault();
    const file = getDraggedFile(event); //有问题：file.type=''
    /*
        if (fileTypeIsSupported(file)) {
            markdownView.classList.add('drag-over'); //支持文件类型样式
        } else {
            markdownView.classList.add('drag-error');//不支持文件类型样式
        }
    */
});
//离开
document.addEventListener('dragleave', event => {
    event.preventDefault();
    markdownView.classList.remove('drag-over');
    markdownView.classList.remove('drag-error');
});
//拖拽到上边并松手
document.addEventListener('drop', event => {
    event.preventDefault();//禁用默认事件
    const file = getDroppedFile(event);
    let extName = path.extname(file.path);
    if (fileTypeIsSupportedByExtName(extName)) { //if (fileTypeIsSupported(file)) {
        mainProcess.openFile(currentWindow, file.path); //支持文件类型样式
    } else {
        alert('that file type is not supported');
    }
    markdownView.classList.remove('drag-over');
    markdownView.classList.remove('drag-error');
});

//拖拽到上边不松手这时，只能）读取文件元信息
const getDraggedFile = (event) => {
    return event.dataTransfer.items[0];
};
//（拖拽到上边并松手才能）读取文件File对象
const getDroppedFile = (event) => {
    return event.dataTransfer.files[0];
};
// 是否支持文件类型
const fileTypeIsSupported = (file) => {
    return ['text/plain', 'text/markdown'].includes(file.type);
}

// 是否支持文件类型
const fileTypeIsSupportedByExtName = (extName) => {
    console.log("extName", extName);
    return ['.md', '.markdown'].includes(extName);
}