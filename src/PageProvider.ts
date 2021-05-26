import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IDEPanels } from "./extension";

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
 * ********************************************************************************************
 * 打开与下位机交互的界面 
 * ********************************************************************************************
 * */

// 
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

const uploadModelMessageHandler = {
	testDistGotoPage(global, message) {
		console.log("上传模型视图消息传递！！！！！！！！！！！！！！！！！！！", message);
	},
};
const modelHomeMessageHandler = {};
const resHomeMessageHandler = {};
const nodePageMessageHandler = {};
const chipPageMessageHandler = {};

// 1. 模型上传页面
export function uploadModelPageProvideByPort(context) {
	console.log("IDE uploadPageProvideByPort!", IDEPanels);
	if (IDEPanels.uploadModelPanel) {
		console.log("打开模型上传页面：", IDEPanels.uploadModelPanel.visible);
		IDEPanels.uploadModelPanel.reveal();
	} else {
		IDEPanels.uploadModelPanel = vscode.window.createWebviewPanel(
			"uploadModelPage",
			"上传模型",
			vscode.ViewColumn.One,
			{
				enableScripts: true
			});
		IDEPanels.uploadModelPanel.webview.html = `<!DOCTYPE html>
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
						<iframe src="http://localhost:5001/#/uploadModel" sandbox ="allow-scripts allow-popups allow-same-origin"></iframe>
					</body>
					</html>`

		let panel = IDEPanels.uploadModelPanel;
		const global = { panel, context };

		IDEPanels.uploadModelPanel.webview.onDidReceiveMessage(message => {
			if (uploadModelMessageHandler[message.command]) {
				uploadModelMessageHandler[message.command](global, message);
			} else {
				vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
			}
		}, undefined, context.subscriptions);

		console.log("IDE uploadPageProvideByPort 2!", global.panel);

		// 面板被关闭后重置
		IDEPanels.uploadModelPanel.onDidDispose(
			() => {
				IDEPanels.uploadModelPanel = undefined;
			},
			null,
			context.subscriptions
		);
	}
}

// 2. 模型视图首页
export function modelHomePageProvideByPort(context) {
	console.log("IDE modelHomePageProvideByPort!", IDEPanels);
	if (IDEPanels.modelHomePanel) {
		console.log("打开模型视图首页：", IDEPanels.modelHomePanel.visible);
		IDEPanels.modelHomePanel.reveal();
	} else {
		IDEPanels.modelHomePanel = vscode.window.createWebviewPanel(
			"modelHomePage",
			"模型视图",
			vscode.ViewColumn.One,
			{
				enableScripts: true
			});
		IDEPanels.modelHomePanel.webview.html = `<!DOCTYPE html>
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
						<iframe src="http://localhost:5001/#/model" sandbox ="allow-scripts allow-popups allow-same-origin"></iframe>
					</body>
					</html>`

		let panel = IDEPanels.modelHomePanel;
		const global = { panel, context };

		IDEPanels.modelHomePanel.webview.onDidReceiveMessage(message => {
			if (modelHomeMessageHandler[message.command]) {
				modelHomeMessageHandler[message.command](global, message);
			} else {
				vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
			}
		}, undefined, context.subscriptions);

		console.log("IDE modelHomePageProvideByPort 2!", global.panel);

		// 面板被关闭后重置
		IDEPanels.modelHomePanel.onDidDispose(
			() => {
				IDEPanels.modelHomePanel = undefined;
			},
			null,
			context.subscriptions
		);
	}
}

// 3. 资源视图首页
export function resourceHomePageProvideByPort(context) {
	console.log("IDE resourceHomePageProvideByPort!", IDEPanels);
	if (IDEPanels.resourceHomePanel) {
		console.log("打开资源视图首页：", IDEPanels.resourceHomePanel.visible);
		IDEPanels.resourceHomePanel.reveal();
	} else {
		IDEPanels.resourceHomePanel = vscode.window.createWebviewPanel(
			"resHomePage",
			"类脑计算机",
			vscode.ViewColumn.One,
			{
				enableScripts: true
			});
		IDEPanels.resourceHomePanel.webview.html = `<!DOCTYPE html>
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
						<iframe src="http://localhost:5001/#/" sandbox ="allow-scripts allow-popups allow-same-origin"></iframe>
					</body>
					</html>`

		let panel = IDEPanels.resourceHomePanel;
		const global = { panel, context };

		IDEPanels.resourceHomePanel.webview.onDidReceiveMessage(message => {
			if (resHomeMessageHandler[message.command]) {
				resHomeMessageHandler[message.command](global, message);
			} else {
				vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
			}
		}, undefined, context.subscriptions);

		console.log("IDE resourceHomePageProvideByPort 2!", global.panel);

		// 面板被关闭后重置
		IDEPanels.resourceHomePanel.onDidDispose(
			() => {
				IDEPanels.resourceHomePanel = undefined;
			},
			null,
			context.subscriptions
		);
	}
}

// 4. 节点详情页面
export function nodePageProvideByPort(context, name, port, route) {
	console.log("IDE nodePageProvideByPort!", IDEPanels.nodePagePanelsMap);
	if (IDEPanels.nodePagePanelsMap.has(name)) {
		console.log("打开节点详情页面：", IDEPanels.nodePagePanelsMap.get(name).visible);
		IDEPanels.nodePagePanelsMap.get(name).reveal();
	} else {
		const PORT = port;
		const ROUTE = route;
		let panel = vscode.window.createWebviewPanel(
			name,
			name,
			vscode.ViewColumn.One,
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

		IDEPanels.nodePagePanelsMap.set(name, panel);
		const global = { panel, context };

		panel.webview.onDidReceiveMessage(message => {
			if (nodePageMessageHandler[message.command]) {
				nodePageMessageHandler[message.command](global, message);
			} else {
				vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
			}
		}, undefined, context.subscriptions);

		console.log("IDE nodePageProvideByPort 2!", global.panel);

		// 面板被关闭后重置
		panel.onDidDispose(
			() => {
				panel = undefined;
				IDEPanels.nodePagePanelsMap.delete(name);
			},
			null,
			context.subscriptions
		);
	}
}

// 5. 芯片详情页面
export function chipPageProvideByPort(context, name, port, route) {
	console.log("IDE chipPageProvideByPort!", IDEPanels.chipPagePanelsMap);
	if (IDEPanels.chipPagePanelsMap.has(name)) {
		console.log("打开芯片详情页面：", IDEPanels.chipPagePanelsMap.get(name).visible);
		IDEPanels.chipPagePanelsMap.get(name).reveal();
	} else {
		const PORT = port;
		const ROUTE = route;
		let panel = vscode.window.createWebviewPanel(
			name,
			name,
			vscode.ViewColumn.One,
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

		IDEPanels.chipPagePanelsMap.set(name, panel);
		const global = { panel, context };

		panel.webview.onDidReceiveMessage(message => {
			if (chipPageMessageHandler[message.command]) {
				chipPageMessageHandler[message.command](global, message);
			} else {
				vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
			}
		}, undefined, context.subscriptions);

		console.log("IDE chipPageProvideByPort 2!", global.panel);

		// 面板被关闭后重置
		panel.onDidDispose(
			() => {
				panel = undefined;
				IDEPanels.chipPagePanelsMap.delete(name);
			},
			null,
			context.subscriptions
		);
	}
}