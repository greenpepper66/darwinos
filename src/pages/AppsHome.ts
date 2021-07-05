

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { openImgAppHomePage, openFatigueDrivingAppHomePage, openSpeechAppHomePage, openAgeJudgeAppHomePage } from "./ImgAppHome";
import { IDEPanels } from "../extension";


const appsHomeHtmlFilePath = "src/static/views/appsHome.html";
const otherAppHomeHtmlFilePath = "src/static/views/otherAppHome.html";

// 1. 与应用视图首页webview的交互
const messageHandler = {
    // 单击首页图片，跳转到对应的应用类型首页
    gotoAppPage(global, message) {
        openCertainAppHomePage(global.context, message.text);

    },
};

// html页面处理
export function getAppsHomeHtml(context, templatePath) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');

    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });

    // 替换登录页面中 style 中 background img 
    html = html.replace(/(.+?)(url\(")(.+?)"/g, (m, $1, $2, $3) => {
        return $1 + $2 + vscode.Uri.file(path.resolve(dirPath, $3)).with({ scheme: 'vscode-resource' }).toString() + '"';
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

// overView按钮单击后显示应用视图首页， 4个框图的页面
export function AppsHomePageProvide(context) {
    console.log("IDE AppsHomePageProvide!", IDEPanels.appHomePanel);
    if (IDEPanels.appHomePanel) {
        console.log("打开应用视图首页：", IDEPanels.appHomePanel.visible);
        IDEPanels.appHomePanel.reveal();
    } else {
        console.log("新建应用视图首页");
        IDEPanels.appHomePanel = vscode.window.createWebviewPanel(
            'appsHomePage',
            "应用视图",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );
        IDEPanels.appHomePanel.webview.html = getAppsHomeHtml(context, appsHomeHtmlFilePath);

        let panel = IDEPanels.appHomePanel;
        let global = { panel, context };

        IDEPanels.appHomePanel.webview.onDidReceiveMessage(message => {
            if (messageHandler[message.command]) {
                messageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE AppsHomePageProvide 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.appHomePanel.onDidDispose(
            () => {
                IDEPanels.appHomePanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}

// 单击页面图片打开对应的应用主页
export function openCertainAppHomePage(context, num) {
    if (num == 1) {  // 数字图像识别应用
        openImgAppHomePage(context);
    } else if (num == 2) {
        openSpeechAppHomePage(context); // 语音识别
    } else if (num == 3) {
        openAgeJudgeAppHomePage(context); // 年龄检测
    } else if (num == 4) {
        openFatigueDrivingAppHomePage(context);  // 疲劳检测
    } else {
        openOtherAppHomePage(context);
    }
}

// 打开其他应用页面
export function openOtherAppHomePage(context) {
    const panel = vscode.window.createWebviewPanel(
        'OtherAppWelcome',
        "其他应用",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            // retainContextWhenHidden: true, // 内存占用较高
        }
    );
    panel.webview.html = getAppsHomeHtml(context, otherAppHomeHtmlFilePath);

}



