const assert = require('assert'); //引入Nodde 内置的断言库
const path = require('path'); //引入Nodde 文集路径辅助工具
const Application = require('spectron').Application; //引入Spectron的应用驱动程序
const electronPath = require('electron'); //已入electron，这让我们可以访问本地的Electron的开发版本

const app = new Application({
    path: electronPath,  //创建Spectron的Application对象，告诉他使用本地的Electron开发版本
    // The following line tells spectron to look and use the main.js file
    // and the package.json located 1 level above.
    //应用自身的根目录作为应用的起始点和当前项目package.json文件路径
    args: [path.join(__dirname, '..')]
});

//mocha:定义一组测试
describe('Clipmaster 9000', function () {
    this.timeout(10000); //由于应用程序需要花费一些时间，因此增加Mocha的默认超时时间

    beforeEach(() => {
        return app.start(); //在每个应用之前启动应用
    });

    afterEach(() => {
        if (app && app.isRunning()) {
            return app.stop();  //结束每个测试后停止应用
        }
    });

    //定义一个测试（一个测试用例）
    it('启动一个窗口', async function () {
        let count = await app.client.getWindowCount();
        return assert.equal(count, 1);
    })

    it('窗口标题是否正确', async () => {
        //waitUntilWindowLoaded等待窗口加载完html、css、js后获取标题
        let title = await app.client.waitUntilWindowLoaded().getTitle();
        return assert.equal(title, 'Clipmaster 9000');
    })

    it('不要打开开发者工具', async () => {
        let devToolsAreOpen = await app.client
            .waitUntilWindowLoaded()
            .browserWindow.isDevToolsOpened();
        return assert.equal(devToolsAreOpen, false);
    })

    it('有一个按钮，其文本为"Copy from Clipbard"', async () => {
        //getText()是WebdriveIO提供，返回一个节点的文本内容的Promise对象
        let buttonText = await app.client.getText("#copy-from-clipboard");

        return assert.equal(buttonText, "Copy from Clipboard");
    })

    it('应用启动是不存在剪贴项', async () => {
        await app.client.waitUntilWindowLoaded();
        let clippings = await app.client.$$('.clippings-list-item'); //document.querySelectorAll
        return assert.equal(clippings.length, 0);
    })

    it('点击"copy-from-clipboard"按钮时，增加一项剪贴项', async () => {
        await app.client.waitUntilWindowLoaded();
        await app.client.click("#copy-from-clipboard");
        let clippings = await app.client.$$('.clippings-list-item');
        return assert.equal(clippings.length, 1);
    })

    it('可以刪除剪切项', async () => {
        await app.client.waitUntilWindowLoaded();
        await app.client.click("#copy-from-clipboard") //先添加一项
            .moveToObject(".clippings-list-item")//默认Remove按钮是隐藏的，不能点击，故先将鼠标指针移动到DOM元素上
            .click(".remove-clipping");//删除
        let clippings = await app.client.$$('.clippings-list-item');
        return assert.equal(clippings.length, 0);
    })

    it('从剪贴板复制并显示正确的文本', async () => {
        let testText = 'Hello Word';
        await app.client.waitUntilWindowLoaded();
        await app.electron.clipboard.writeText(testText);
        await app.client.click("#copy-from-clipboard");
        let clippingText = await app.client.getText('.clipping-text');

        return assert.equal(clippingText, testText);
    })

    it('写剪贴板是否正确', async () => {
        //从剪贴板复制文本
        let testText = 'Hello Word';
        await app.client.waitUntilWindowLoaded();
        await app.electron.clipboard.writeText(testText);
        await app.client.click("#copy-from-clipboard");

        //模拟剪贴板有新的内容
        await app.electron.clipboard.writeText('剪贴板新内容');

        //写剪贴板
        await app.client.click('.copy-clipping');
        let clippingText = await app.electron.clipboard.readText();

        return assert.equal(clippingText, testText);
    })
});