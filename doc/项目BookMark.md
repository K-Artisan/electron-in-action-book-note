[TOC]

# 项目BookMark
## 界面
![](https://img2020.cnblogs.com/blog/380433/202006/380433-20200609221107032-1831582011.png)

# 项目结构
![](https://img2020.cnblogs.com/blog/380433/202006/380433-20200609220308793-1981553796.png)

# 项目Code解析

## package.json
```json
{
  "name": "bookmark",
  "version": "1.0.0",
  "description": "",
  "main": "./app/main.js",
  "scripts": {
    "start": "electron .",
    "test": "echo \"Error:no test specified\" && exit 1"
  },
  "author": "weikai",
  "license": "ISC",
  "dependencies": {
    "electron": "^9.0.3"
  }
}

```

## main.js

```js
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
```
   ### 要点解析：
   #### __dirname
   `__dirname`变量是当前正被执行的Node应用的完整路径，在笔者的电脑上，这个值是： `(略)/bookmark/app`

## index.html
```html
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link type="text/css" rel="stylesheet" href="styles.css">
    <title>Bookmarker</title>
</head>

<body>
    <h1>Bookmarker</h1>

    <div class="error-message"></div>
    
    <section class="add-new-link">
      <form class="new-link-form">
        <input type="url" class="new-link-url" placeholder="URL" required>
        <input type="submit" class="new-link-submit" value="Submit" disabled>
      </form>
    </section>

    <section class="links"></section>

    <section class="controls">
      <button class="clear-storage">Clear Storage</button>
    </section>


    <script>
        require('./renderer.js');
    </script>
</body>

</html>
```

## renderer.js
```js
const { shell } = require('electron'); //提供与高层级桌面集成有关的函数
const parser = new DOMParser(); //Chrominum提供的文本解析器

const linksSection = document.querySelector('.links');
const errorMessage = document.querySelector('.error-message');
const newLinkForm = document.querySelector('.new-link-form');
const newLinkUrl = document.querySelector('.new-link-url');
const newLinkSubmit = document.querySelector('.new-link-submit');
const clearStorageButton = document.querySelector('.clear-storage');

//监听Url输入框是否有效
newLinkUrl.addEventListener('keyup', () => {
    newLinkSubmit.disabled = !newLinkUrl.validity.valid;
});


newLinkForm.addEventListener('submit', () => {
    event.preventDefault();
    const url = newLinkUrl.value;
    fetch(url)
        .then(validateResponse)
        .then(response => response.text())
        .then(parseResponse)
        .then(findTitle)
        .then(title => storeLink(title, url))
        .then(clearForm)
        .then(renderLinks)
        .catch(error => handleError(error, url));
});

//shell模块：使用用户默认的浏览器打开链接
linksSection.addEventListener('click', (event) => {
    if (event.target.href) {
      event.preventDefault();
      shell.openExternal(event.target.href);
    }
  });

clearStorageButton.addEventListener('click', () => {
    localStorage.clear();
    linksSection.innerHTML = '';
});

const clearForm = () => {
    newLinkUrl.value = null;
}


//将html文本解析成DOM结构树
const parseResponse = (text) => {
    return parser.parseFromString(text, 'text/html');
}

//遍历DOM树找到title节点文本
const findTitle = (nodes) => {
    return nodes.querySelector('title').innerText;
}

//使用内置localStorage存储 url
const storeLink = (title, url) => {
    localStorage.setItem(url, JSON.stringify({ title: title, url: url }));
}


const getLinks = () => {
    debugger
    let ss = Object.keys(localStorage);
    let ess = ss.map(key => JSON.parse(localStorage.getItem(key)));

    return Object.keys(localStorage)
        .map(key => JSON.parse(localStorage.getItem(key)));
}


const convertToElement = (link) => {
    return `<div class="link"><h3>${link.title}</h3>
            <p><a href="${link.url}">${link.url}</a></p></div>`;
}


const renderLinks = () => {
    const linkElements = getLinks().map(convertToElement).join('');
    linksSection.innerHTML = linkElements;
}


const handleError = (error, url) => {
    errorMessage.innerHTML = `
      There was an issue adding "${url}": ${error.message}
    `.trim();
    setTimeout(() => errorMessage.innerText = null, 5000);
}

const validateResponse = (response) => {
    if (response.ok) { return response; }
    throw new Error(`Status code of ${response.status} ${response.statusText}`);
}


renderLinks();
```
   ### 要点解析：
   #### fetch()
  https://www.jianshu.com/p/a6d00de26c2e

   #### electron 的 shell 模块

  可以使用shell模块：使用用户默认的浏览器打开链接

```js
const { shell } = require('electron'); //提供与高层级桌面集成有关的函数

...


linksSection.addEventListener('click', (event) => {
    if (event.target.href) {
      event.preventDefault();
      shell.openExternal(event.target.href); //shell模块：使用用户默认的浏览器打开链接
    }
  });

  ...
  
```
   #### DOMParser
       const parser = new DOMParser(); //Chrominum提供的文本解析器

   #### 数组的.map（）函数
   https://blog.csdn.net/liminwang0311/article/details/86480829
