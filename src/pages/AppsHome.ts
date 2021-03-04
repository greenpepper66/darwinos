

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { allData } from '../os/server';

const appsHomeHtmlFilePath = "src/static/views/appsHome.html";
const imgAppHomeHtmlFilePath = "src/static/views/imgAppHome.html";
const otherAppHomeHtmlFilePath = "src/static/views/otherAppHome.html";
const newImgAppHtmlFilePath = "src/static/views/newImgApp.html";


// 1. 与应用视图首页webview的交互
const messageHandler = {
    // 单击首页图片，跳转到对应的应用类型首页
    gotoAppPage(global, message) {
        openCertainAppHomePage(global.context, message.text);
    },

};

// 2. 与数字图像识别应用首页交互
const imgAppMessageHandler = {
    // 2.1 单击“新建应用”按钮 跳转到新建应用页面
    gotoNewAppPage(context, message) {
        console.log(message);
        newImgAppPage(context);
    },
};

// 3. 与新建数字识别应用页面交互
const newImgAppMessageHandler = {
    // 3.1 选择图像所在文件夹
    selectImgDir(global, message) {
        console.log(message);
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("选择目录为", fileUri);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedImgDir: fileUri[0].path });
        });
    },

    // 3.2 获取模型文件
    getModelFileList(global, message) {
        console.log(message);
        console.log("list:", allData.modelFileList);
        global.panel.webview.postMessage({ modelFileListRet: allData.modelFileList });
    }

};



// html页面处理
export function getAppsHomeHtml(context, templatePath) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });


    // 任务输入执行页面样式
    let vscodeColorTheme = vscode.window.activeColorTheme.kind;
    if (vscodeColorTheme == 2) {
        html = html.replace(/light.css/, "dark.css");
    } else if (vscodeColorTheme == 1) {
        html = html.replace(/dark.css/, "light.css");
    }

    return html;
}

// overView按钮单击后显示应用视图首页
export function AppsHomePageProvide(context) {
    const panel = vscode.window.createWebviewPanel(
        'appsWelcome',
        "应用视图",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    let global = { panel, context };
    panel.webview.html = getAppsHomeHtml(context, appsHomeHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (messageHandler[message.command]) {
            messageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);

}





// 单击页面图片打开对应的应用主页
export function openCertainAppHomePage(context, num) {
    if (num == 1) {  // 数字图像识别应用
        openImgAppHomePage(context);
    } else {
        openOtherAppHomePage(context);
    }
}


// 数字图像识别应用的webview处理
export function openImgAppHomePage(context) {
    const panel = vscode.window.createWebviewPanel(
        'ImgAppWelcome',
        "图像识别",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    panel.webview.html = getAppsHomeHtml(context, imgAppHomeHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (imgAppMessageHandler[message.command]) {
            imgAppMessageHandler[message.command](context, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}


// 打开其他应用页面
export function openOtherAppHomePage(context) {
    const panel = vscode.window.createWebviewPanel(
        'OtherAppWelcome',
        "其他应用",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    panel.webview.html = getAppsHomeHtml(context, otherAppHomeHtmlFilePath);
    
}


// 打开新建数字图像识别页面
export function newImgAppPage(context) {
    const panel = vscode.window.createWebviewPanel(
        'NewImgApp',
        "新建应用",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );
    
    let global = { panel, context };
    panel.webview.html = getAppsHomeHtml(context, newImgAppHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (newImgAppMessageHandler[message.command]) {
            newImgAppMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}