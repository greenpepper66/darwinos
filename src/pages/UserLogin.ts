import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { LoginInfo, openAllTreeViews, openOnlyUserTreeView } from "../extension";
import { UserInfoData, addOneUser, searchUserInfoByName } from "../DataProvider/UserInfoJsonDataProvider";
import { IDEPanels } from "../extension";

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
        console.log(message, LoginInfo.currentUser);
        // 校验用户信息
        let user = searchUserInfoByName(global.context, message.text[0]);
        if (user == "none" || user.password != message.text[1]) {
            global.panel.webview.postMessage({ loginSystemErrorRet: "error" });
            return
        } else {
            // 登录成功
            global.panel.webview.postMessage({ loginSystemSuccess: user });
            // 更新全局变量
            LoginInfo.currentUser = user;
            console.log("登录成功：", LoginInfo.currentUser);
        }

        // 根据用户角色更新导航栏和页面
        if (user.userRole == 0 || user.userRole == 1) {
            // 打开全部导航栏
            openAllTreeViews(global.context);
        } else if (user.userRole == 2) {
            openOnlyUserTreeView(global.context);
        }

    },

    // 获取登录用户信息
    getCurrentUserInfo(global, message) {
        console.log(message);
        global.panel.webview.postMessage({ cmd: 'getCurrentUserInfoRet', cbid: message.cbid, data: LoginInfo.currentUser });
    },

    // 点击了退出登录按钮
    logoutSystem(global, message) {
        console.log(message);
        let role = LoginInfo.currentUser.userRole;
        // 清空全局变量
        LoginInfo.currentUser = undefined;
        // 发送消息
        global.panel.webview.postMessage({ logoutSystemSuccess: "success" });

        // 关闭导航栏
        vscode.commands.executeCommand('extension.logoutCloseSystemTreeView');
        // 关闭登录页面
        global.panel.dispose();
        // 关闭其他tab页
        vscode.commands.executeCommand("workbench.action.closeOtherEditors");
        //  重新打开
        OpenLoginPage(global.context);
    },
}

// 打开登录页面
export function OpenLoginPage(context) {
    console.log("IDE OpenLoginPage!", IDEPanels.loginPanel);
    if (IDEPanels.loginPanel) {
        console.log("打开登录页面：", IDEPanels.loginPanel.visible);
        IDEPanels.loginPanel.reveal();
    } else {
        console.log("新建登录页面");
        IDEPanels.loginPanel = vscode.window.createWebviewPanel(
            "loginPage",
            "登录页面",
            vscode.ViewColumn.One,
            {
                // Enable scripts in the webview
                enableScripts: true,
                // retainContextWhenHidden: true  // 隐藏时保留上下文
            } // Webview options. More on these later.
        );
        let panel = IDEPanels.loginPanel;
        const global = { panel, context };

        IDEPanels.loginPanel.webview.html = getWebViewContent(context, userLoginHtmlFilePath);
        IDEPanels.loginPanel.webview.onDidReceiveMessage(message => {
            if (loginMessageHandler[message.command]) {
                loginMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE OpenLoginPage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.loginPanel.onDidDispose(
            () => {
                IDEPanels.loginPanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
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
