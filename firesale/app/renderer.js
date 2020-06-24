const marked = require('marked'); //已入marked第三方库

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');


markdownView.addEventListener('keyup', (event) => {
    const currentContent = event.target.value;
    renderMarkdownToHtml(currentContent);
});

const renderMarkdownToHtml = (markdown) => {
    //#B.1 
    //markdown:要转化的markdown文本内容
    //sanitize:避免代码注入
    htmlView.innerHTML = marked(markdown, { sanitize: true });
};

