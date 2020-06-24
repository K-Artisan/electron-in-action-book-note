# 预览

![image-20200610111516224](C:\Users\weikai\AppData\Roaming\Typora\typora-user-images\image-20200610111516224.png)

# 项目结构

## 项目结构

![image-20200610105016891](C:\Users\weikai\AppData\Roaming\Typora\typora-user-images\image-20200610105016891.png)

## 第三方库

### Maked

第三方库Marked：用于实现 MakeDown转化为 HTML

```XML
npm install marked
```



# 项目代码

https://github.com/electron-in-action/firesale



# 代码解析

## 避免白屏

如果页面加载需要很长时间，可以在创建窗口时先隐藏，等页面加载完成后再显示窗口

```js
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
```



## markdowm转Html

```xml
const marked = require('marked'); //#B1.已入marked第三方库

markdownView.addEventListener('keyup', (event) => {
    const currentContent = event.target.value;
    renderMarkdownToHtml(currentContent);
});

const renderMarkdownToHtml = (markdown) => {
    //#B.2 
    //markdown:要转化的markdown文本内容
    //sanitize:避免代码注入
    htmlView.innerHTML = marked(markdown, { sanitize: true });
};

```

