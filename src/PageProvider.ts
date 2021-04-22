import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as handler from 'serve-handler';

import {LoginInfo} from "./extension";


/**
 * 根据vscode的背景色调整index.html的外部引入样式
 * @param context 
 * @param vscodeColorTheme 2-黑色，1-白色
 */
export function changeIndexHtmlCss(context, vscodeColorTheme) {
	// web index页面样式
	let indexPath = path.join(context.extensionPath, 'src/resources/dist/index.html');
	let oriHtml = fs.readFileSync(indexPath, 'utf-8');
	let dstHtml = "";
	if (vscodeColorTheme == 2) {
		dstHtml = oriHtml.replace(/light.css/, "dark.css");
	} else if (vscodeColorTheme == 1) {
		dstHtml = oriHtml.replace(/dark.css/, "light.css");
	}
	fs.writeFileSync(indexPath, dstHtml);
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


/** 打开与下位机交互的界面 */
export function PageProvideByPort(name, port, route) {
	const PORT = port;
	const ROUTE = route;
	const panel = vscode.window.createWebviewPanel(name, name, vscode.ViewColumn.One,
		{
			enableScripts: true
		});

	panel.webview.html = `<!DOCTYPE html>
				<html lang="en"">
				<head>
					<meta charset="UTF-8">
					<title>Preview</title>
					<style>
						html { width: 100%; height: 100%; min-height: 100%; display: flex; }
						body { flex: 1; display: flex; }
						iframe { flex: 1; border: none; }
					</style>
				</head>
				<body>
					<iframe src="http://localhost:${PORT}/#/${ROUTE}" sandbox ="allow-scripts allow-popups allow-same-origin"></iframe>
				</body>
				</html>`

}


/** 
 * **************************************************************************************
 * 登录相关
 * **************************************************************************************
 */
// 消息处理
const loginMessageHandler = {
	// 点击了登录按钮
	loginSystem(global, message) {
        console.log(message);
       // todo：校验用户信息

	   // 根据用户角色更新导航栏和页面
	   LoginInfo.test = true; 

	   if(LoginInfo.test == true) {
		   // 打开全部页面
		   
	   }

    },
}



// 打开登录页面
export function PageProvideByPath(context, pageName, pagePath) {
	const panel = vscode.window.createWebviewPanel(
		pageName,
		pageName,
		vscode.ViewColumn.One,
		{
			// Enable scripts in the webview
			enableScripts: true
		} // Webview options. More on these later.
	);
	panel.webview.html = getWebViewContent(context, pagePath);
	let global = { panel, context };
	panel.webview.onDidReceiveMessage(message => {
		if (loginMessageHandler[message.command]) {
			loginMessageHandler[message.command](global, message);
		} else {
			vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
		}
	}, undefined, context.subscriptions);
}


