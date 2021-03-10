import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { allData } from '../os/server';
import { glob } from 'glob';

const imgAppHomeHtmlFilePath = "src/static/views/imgAppHome.html";
const newImgAppHtmlFilePath = "src/static/views/newImgApp.html";
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";
const  imgAppInfoHtmlFilePath = "src/static/views/imgAppInfo.html";


/**
 * ******************************************************************************************************
 * 消息通信
 * ******************************************************************************************************
 */

// 2. 与数字图像识别应用首页交互
const imgAppMessageHandler = {
    // 2.1 单击“新建应用”按钮 跳转到新建应用页面
    gotoNewAppPage(global, message) {
        console.log(message);
        openNewImgAppPage(global.context);
    },

    // 2.2 查询所有应用列表
    getAppsConfigList(global, message) {
        console.log(message);
        let allApps = searchAllJson(global.context);
        global.panel.webview.postMessage({ appsConfigListRet: allApps });
    },

    // 2.3 删除应用
    deleteAppConfig(global, message) {
        console.log(message);
        deleteJson(global.context, message.text);
        global.panel.webview.postMessage({ deleteAppConfigRet: "success" });
    },

    // 2.4 查询应用  显示详情页
    godoImgAppInfoPage(global, message) {
        console.log(message);
        openImgAppInfoPage(global.context);
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
        if (message.text.length != 6 || message.text[0] == "" || message.text[1] == "" || message.text[2] == "" || message.text[3] == "" || message.text[4] == "" || message.text[5] == "") {
            global.panel.webview.postMessage({ saveImgAppConfigRet: "error: save failed, please check your input!" });
        } else {
            // 随机生成id， 利用js中的Date对象
            // var num = Math.random();
            let date = new Date();
            let id = date.getTime();//得到时间的13位毫秒数

            let name = message.text[0];
            let imgAppConfig = new ImgAppConfigData(id, name);

            let createTime = dateFormat("YYYY-mm-dd HH:MM", date);
            console.log("id:", id, "time: ", createTime);
            imgAppConfig.createTime = createTime;
            imgAppConfig.imgSrcKind = message.text[1];
            imgAppConfig.imgSrcDir = message.text[2];
            imgAppConfig.modeFileID = message.text[3];
            imgAppConfig.encodeMethodID = message.text[4];
            imgAppConfig.encodeConfigDir = message.text[5];

            writeJson(global.context, imgAppConfig); //写入json文件

            global.panel.webview.postMessage({ saveImgAppConfigRet: "success" });
        }
    },

    // 3.4 选择启动任务所需的各个配置文件所在目录
    selectEncodeConfDir(global, message) {
        console.log(message);
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("选择目录为", fileUri);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedEncodeConfDir: fileUri[0].path });
        });
    },

};

// 4. 与应用详情页面的交互
const imgAppInfoMessageHandler = {

}


/**
 * ******************************************************************************************************
 * 新建webview页面
 * ******************************************************************************************************
 */

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


// 3. 打开应用详情页面
export function openImgAppInfoPage(context) {
    const panel = vscode.window.createWebviewPanel(
        'ImgAppInfo',
        "应用详情",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    let global = { panel, context };
    panel.webview.html = getAppsHomeHtml(context, imgAppInfoHtmlFilePath);

    panel.webview.onDidReceiveMessage(message => {
        if (imgAppInfoMessageHandler[message.command]) {
            imgAppInfoMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}







/**
 * ******************************************************************************************************
 * JSON文件处理
 * 本地保存新建应用配置信息
 * 参考 https://blog.csdn.net/zhaoxiang66/article/details/79894209
 * ******************************************************************************************************
 */

// Json文件类
class ImgAppJsonData {
    public data: any[];
    public total: number;
}

// 应用的配置信息类
class ImgAppConfigData {
    public id: number;              // 应用ID
    public name: string;            // 应用名称
    public imgSrcKind: string;      // 图像源类型：本地图像或远程图像
    public imgSrcDir: string;       // 图像源
    public modeFileID: number;      // 模型文件ID
    public encodeMethodID: number;  // 编码方法ID
    public createTime: string;      // 应用创建时间
    public encodeConfigDir: string; // 编码和运行任务所需的配置文件所在目录

    constructor(id: number, name: string) {  // 构造函数 实例化类的时候触发的方法
        this.id = id;
        this.name = name;
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


//1. 增：写入json文件选项， 最多保存20条, 异步处理，不会等待执行结束
function writeJson(context, imgAppConfig) {
    console.log("json writing...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    //现将json文件读出来
    fs.readFile(resourcePath, function (err, data) {
        if (err) {
            console.error(err);
            return console.error(err);
        }
        var stringContent = data.toString();//将二进制的数据转换为字符串
        var jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

        // 最多保存20条
        if (jsonContent.total == 20) {
            jsonContent.data.splice(0, 1);
        }

        jsonContent.data.push(imgAppConfig);//将传来的对象push进数组对象中
        jsonContent.total = jsonContent.data.length;//定义一下总条数，为以后的分页打基础
        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
        fs.writeFile(resourcePath, str, function (err) {
            if (err) {
                console.error(err);
                return console.error(err);
            }
            console.log('----------新增成功-------------');
            return console.log("save app config success");
        })
    })
}

// 2. 删：根据id删除json文件中的选项
function deleteJson(context, id) {
    console.log("json deleting...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);

    fs.readFile(resourcePath, function (err, data) {
        if (err) {
            return console.error(err);
        }
        var stringContent = data.toString();//将二进制的数据转换为字符串
        var jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象
        //把数据读出来删除
        for (var i = 0; i < jsonContent.data.length; i++) {
            if (id == jsonContent.data[i].id) {
                //console.log(person.data[i])
                jsonContent.data.splice(i, 1);  // splice删除位置i上的1个元素
            }
        }
        console.log(jsonContent.data);
        jsonContent.total = jsonContent.data.length;
        var str = JSON.stringify(jsonContent);
        //然后再把数据写进去
        fs.writeFile(resourcePath, str, function (err) {
            if (err) {
                console.error(err);
                return console.error(err);
            }
            console.log("----------删除成功------------");
            return console.log("delete app config success");
        })
    })
}

// 3. 查：同步处理
function searchAllJson(context) {
    console.log("json searching...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);

    let data = fs.readFileSync(resourcePath, 'utf-8');

    let stringContent = data.toString();//将二进制的数据转换为字符串
    let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象
    //把数据读出来

    let length = jsonContent.data.length;
    let allApps = jsonContent.data;
    console.log('------------------------查询成功allApps');
    console.log(allApps);
    return allApps;

}







/**
 * ******************************************************************************************************
 * 工具函数
 * ******************************************************************************************************
 */

// 格式化应用创建时间
function dateFormat(fmt, date) {
    let ret;
    const opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}
// let date = new Date()
// dateFormat("YYYY-mm-dd HH:MM", date)
// >>> `2019-06-06 19:45`