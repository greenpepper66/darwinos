import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { LoginInfo, openAllTreeViews, openOnlyUserTreeView } from "../extension";
import { UserInfoData, addOneUser, searchUserInfoByName } from "../DataProvider/UserInfoJsonDataProvider";
import { glob } from 'glob';


// html文件路径
const userLoginHtmlFilePath = "src/static/views/login.html";



/** 
 * **************************************************************************************
 * 登录相关
 * **************************************************************************************
 */
// 消息处理
const loginMessageHandler = {
    // 注册用户
    registUser(global, message) {
        console.log(message);

        // 暂时：新建用户并保存
        // 随机生成id， 利用js中的Date对象
        let date = new Date();
        let id = date.getTime();//得到时间的13位毫秒数
        let name = message.text[0];
        let pwd = message.text[1];
        let userInfo = new UserInfoData(id, name, pwd);
        if (name == "admin") {
            userInfo.userRole = 0;
        } else if (name == "dev") {
            userInfo.userRole = 1;
        } else {
            userInfo.userRole = 2
        }
        let writeRet = addOneUser(global.context, userInfo); //写入json文件
        console.log("保存结果为： ", writeRet);  // success 或 error
    },

    // 点击了登录按钮
    loginSystem(global, message) {
        console.log(message);
        // todo：校验用户信息
        let user = searchUserInfoByName(global.context, message.text[0]);
        if (user == "none" || user.password != message.text[1]) {
            global.panel.webview.postMessage({ loginSystemErrorRet: "error" });
            return
        }

        // 根据用户角色更新导航栏和页面
        if (user.userRole == 0 || user.userRole == 1) {
            // 打开全部导航栏
            openAllTreeViews(global.context);
        } else if (user.userRole == 2) {
            openOnlyUserTreeView(global.context);
        }

    },
}



// 打开登录页面
export function OpenLoginPage(context) {
    const panel = vscode.window.createWebviewPanel(
        "登录页面",
        "登录页面",
        vscode.ViewColumn.One,
        {
            // Enable scripts in the webview
            enableScripts: true
        } // Webview options. More on these later.
    );
    panel.webview.html = getWebViewContent(context, userLoginHtmlFilePath);
    let global = { panel, context };
    panel.webview.onDidReceiveMessage(message => {
        if (loginMessageHandler[message.command]) {
            loginMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}





/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
export function getWebViewContent(context, templatePath) {
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
