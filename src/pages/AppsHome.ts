

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const appsHomeHtmlFilePath = "src/static/views/appsHome.html";
const imgAppHomeHtmlFilePath = "src/static/views/imgAppHome.html";
const otherAppHomeHtmlFilePath = "src/static/views/otherAppHome.html";

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
        html = html.replace(/taskstyle-light.css/, "taskstyle-dark.css");
    } else if (vscodeColorTheme == 1) {
        html = html.replace(/taskstyle-dark.css/, "taskstyle-light.css");
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




// 与webview页面的交互
const messageHandler = {
    // 单击首页图片，跳转到对应的应用类型首页
    gotoAppPage(global, message) {
        openCertainAppHomePage(global.context, message.text);
    },

}



// 单击页面图片打开对应的应用主页
export function  openCertainAppHomePage(context, num) {
    if (num == 1) {  // 数字图像识别应用
        openImgAppHomePage(context);
    } else {
        openOtherAppHomePage(context);
    }
}



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
}

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