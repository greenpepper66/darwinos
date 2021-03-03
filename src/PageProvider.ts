import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as handler from 'serve-handler';


/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
export function getWebViewContent(context, templatePath) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
	
	html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
	});
	
    return html;
}

/**
 * 根据vscode的背景色调整index.html的外部引入样式
 * @param context 
 * @param vscodeColorTheme 2-黑色，1-白色
 */
export function changeIndexHtmlCss(context, vscodeColorTheme) {
	// web index页面样式
	let indexPath =  path.join(context.extensionPath, 'src/resources/dist/index.html');
	let oriHtml = fs.readFileSync(indexPath, 'utf-8');
	let dstHtml = "";
	if (vscodeColorTheme == 2) {
		dstHtml = oriHtml.replace(/light.css/, "dark.css");
	} else if(vscodeColorTheme == 1) {
		dstHtml = oriHtml.replace(/dark.css/, "light.css");
	}
	fs.writeFileSync(indexPath, dstHtml);
}



export function PageProvideByPort(name,port,route){
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


export function PageProvideByPath(context,pageName,pagePath){
	
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
	 
}


