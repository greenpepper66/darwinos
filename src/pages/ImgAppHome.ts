import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { allData } from '../os/server';

const imgAppHomeHtmlFilePath = "src/static/views/imgAppHome.html";
const newImgAppHtmlFilePath = "src/static/views/newImgApp.html";
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";



// 2. 与数字图像识别应用首页交互
const imgAppMessageHandler = {
    // 2.1 单击“新建应用”按钮 跳转到新建应用页面
    gotoNewAppPage(global, message) {
        console.log(message);
        openNewImgAppPage(global.context);

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
    },

    // 3.3 保存应用配置
    saveImgAppConfig(global, message) {
        console.log(message);
        if (message.text.length != 4) {
            global.panel.webview.postMessage({ saveImgAppConfigRet: "error" });
        } else {
            // 随机生成id， 利用js中的Date对象
            var num = Math.random();
			var date = new Date();
			var id = date.getTime();//得到时间的13位毫秒数
            console.log("id:", id)
            let imgAppConfig = new ImgAppConfigData(id, message.text[0], message.text[1], message.text[2], message.text[3]);
            writeJson(global.context, imgAppConfig); //写入json文件
            global.panel.webview.postMessage({ saveImgAppConfigRet: "success" });
        }


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


    // 任务输入执行页面样式
    let vscodeColorTheme = vscode.window.activeColorTheme.kind;
    if (vscodeColorTheme == 2) {
        html = html.replace(/light.css/, "dark.css");
    } else if (vscodeColorTheme == 1) {
        html = html.replace(/dark.css/, "light.css");
    }

    return html;
}



// 1. webview: 打开首页
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
    let global = { panel, context };
    panel.webview.html = getAppsHomeHtml(context, imgAppHomeHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (imgAppMessageHandler[message.command]) {
            imgAppMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}


// 2. 打开新建页面
export function openNewImgAppPage(context) {
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
    // 发送消息 弹出模态框
    global.panel.webview.postMessage({ createImgApplictaion: "yes" });

    panel.webview.onDidReceiveMessage(message => {
        if (newImgAppMessageHandler[message.command]) {
            newImgAppMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}








/**
 * JSON文件处理
 * 本地保存新建应用配置信息
 * 参考 https://blog.csdn.net/zhaoxiang66/article/details/79894209
 */
// Json文件类
class ImgAppJsonData {
    public data: any[];
    public total: number;
}

// 应用的配置信息类
class ImgAppConfigData {
    public id: number;
    public name: string;
    public imgStrDir: string;
    public modeFileID: number;
    public encodeMethodID: number;

    constructor(id: number, name: string, imgStrDir: string, modeFileID: number, encodeMethodID: number) {  // 构造函数 实例化类的时候触发的方法
        this.id = id;
        this.name = name;
        this.imgStrDir = imgStrDir;
        this.modeFileID = modeFileID;
        this.encodeMethodID = encodeMethodID;
    }
}

// test
//  var imgAppConfig = {
//      "id":1,
//      "name": "testApp",
//      "imgSrcDir": "testDir",
//      "modelFileID": 1,
//      "encodeMethod": 0,
//  }


//写入json文件选项
function writeJson(context, imgAppConfig) {
    console.log("json dealing...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    //现将json文件读出来
    fs.readFile(resourcePath, function (err, data) {
        if (err) {
            return console.error(err);
        }
        var stringContent = data.toString();//将二进制的数据转换为字符串
        var jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象
        jsonContent.data.push(imgAppConfig);//将传来的对象push进数组对象中
        jsonContent.total = jsonContent.data.length;//定义一下总条数，为以后的分页打基础
        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
        fs.writeFile(resourcePath, str, function (err) {
            if (err) {
                console.error(err);
            }
            console.log('----------新增成功-------------');
        })
    })
}

