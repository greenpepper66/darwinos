import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { searchAllJson, deleteJson, searchImgAppByName, searchImgAppByID, writeJson, ImgAppConfigData, updateImgAppStatusToTask, updateImgAppStatusToApp, checkImgAppExist, searchAllImgAppTasks } from '../DataProvider/ImgAppJsonDataProvider';


const userAppHomeHtmlFilePath = "src/static/views/userAppHome.html";
const userLocalMnistHtmlFilePath = "src/static/views/userLocalMnistApp.html";


// 1. 与应用视图首页webview的交互
const messageHandler = {

     // 查询所有图像识别应用列表
     getUserAppsList(global, message) {
        console.log(message);
        let allImgTasks = searchAllJson(global.context);
        global.panel.webview.postMessage({ cmd: 'getUserAppsListRet', cbid: message.cbid, data: allImgTasks });
    },


    // 单击首页按钮，跳转到对应的应用页面
    gotoUserAppPage(global, message) {
        // text: [kind, appName],
        openCertainUserAppPage(global.context, message.text);
    },
};



// html页面处理
export function getHtmlContent(context, templatePath) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });

    // 任务输入执行页面样式
    let vscodeColorTheme = vscode.window.activeColorTheme.kind;
    if (vscodeColorTheme == 2) {
        html = html.replace(/vs-light.css/, "vs-dark.css");
    } else if (vscodeColorTheme == 1) {
        html = html.replace(/vs-dark.css/, "vs-light.css");
    }

    return html;
}

// overView按钮单击后显示应用视图首页
export function UserAppHomePageProvide(context) {
    const panel = vscode.window.createWebviewPanel(
        'userWelcome',
        "用户视图",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    let global = { panel, context };
    panel.webview.html = getHtmlContent(context, userAppHomeHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (messageHandler[message.command]) {
            messageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);

}

// 单击首页按钮打开对应的应用主页
export function openCertainUserAppPage(context, messages) {
    if (messages[0] == 'local' && messages[1] == 'mnist') {  // 数字图像识别应用
        openUserLocalMnistAppPage(context);
    }
}



// 打开其他应用页面
export function openUserLocalMnistAppPage(context) {
    const panel = vscode.window.createWebviewPanel(
        'MnistAppWelcome',
        "手写体应用",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    panel.webview.html = getHtmlContent(context, userLocalMnistHtmlFilePath);

}
