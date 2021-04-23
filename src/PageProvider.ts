import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


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


