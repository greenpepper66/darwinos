import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from "child_process";

import { allData } from '../os/server';
import { searchAllJson, deleteJson, searchImgAppByName, searchImgAppByID, writeJson, ImgAppConfigData, updateImgAppStatusToTask, updateImgAppStatusToApp, checkImgAppExist, searchAllImgAppTasks } from '../DataProvider/ImgAppJsonDataProvider';


const imgAppHomeHtmlFilePath = "src/static/views/imgAppHome.html";
const newImgAppHtmlFilePath = "src/static/views/newImgApp.html";
const imgAppInfoHtmlFilePath = "src/static/views/imgAppInfo.html";
const imgAppRunTaskHtmlFilePath = "src/static/views/imgAppRunTask.html";
const imgAppTasksHtmlFilePath = "src/static/views/imgAppTasks.html";

/**
 * ******************************************************************************************************
 * 消息通信
 * ******************************************************************************************************
 */

// const log_output_channel = vscode.window.createOutputChannel("darwinos output");
// log_output_channel.show();

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
        global.panel.webview.postMessage({ cmd: 'appsConfigListRet', cbid: message.cbid, data: allApps });
    },

    // 2.3 删除应用
    deleteAppConfig(global, message) {
        console.log(message);
        let delRet = deleteJson(global.context, message.text);
        console.log("deleteAppConfig ret: ", delRet);
        global.panel.webview.postMessage({ deleteAppConfigRet: message.text });
    },

    // 2.4 查询应用  显示详情页
    gotoImgAppInfoPage(global, message) {
        console.log(message);
        openImgAppInfoPage(global.context, message.text);
    },

    // 2.5 运行应用， 应用列表页面的“启动”按钮 触发
    gotoImgAppRunTaskPageByID(global, message) {
        console.log(message);
        openImgAppRunTaskPage(global.context, "byID", message.text);
    },

};

// 保存应用配置到json文件中
// message.text: [appName, modelFileID, encodeMethodID, encodeConfDir, outputDir]
function writeImgAppInfoToJson(global, message) {
    if (message.text.length != 5 || message.text[0] == "" || message.text[1] == "" || message.text[2] == ""
        || message.text[3] == "" || message.text[4] == "") {
        return "error: save failed, please check your input!";
    } else {
        // 检查名字是否重复
        if (searchImgAppByName(global.context, message.text[0]) != "none") {
            console.log("应用名字重复");
            return "error: save failed, the app name is repeated!";
        } else {
            // 随机生成id， 利用js中的Date对象
            // var num = Math.random();
            let date = new Date();
            let id = date.getTime();//得到时间的13位毫秒数
            let name = message.text[0];
            let imgAppConfig = new ImgAppConfigData(id, name);

            let createTime = dateFormat("YYYY-mm-dd HH:MM", date);
            imgAppConfig.createTime = createTime;
            console.log("id:", id, "time: ", createTime);

            // 分割模型信息
            let modelInfo = message.text[1].split(" - ");
            if (modelInfo.length != 4) {
                return "error: inner error!";
            } else {
                imgAppConfig.modeFileID = modelInfo[0];
                imgAppConfig.modelFileName = modelInfo[1];
                imgAppConfig.modelFileNodeID = modelInfo[2];
                imgAppConfig.modelFileNodeIP = modelInfo[3];

                imgAppConfig.encodeMethodID = message.text[2];
                imgAppConfig.encodeConfigFile = message.text[3];
                imgAppConfig.outputDir = message.text[4];

                imgAppConfig.status = 0; // 状态默认为0

                let writeRet = writeJson(global.context, imgAppConfig); //写入json文件
                console.log("保存结果为： ", writeRet);  // success 或 error

                if (writeRet == "success") {
                    return "success";
                }
                return "error: write json error!";
            }
        }
    }
}

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
            global.panel.webview.postMessage({ selectedImgDir: fileUri[0].fsPath });
        });
    },

    // 3.2 获取模型文件
    getModelFileList(global, message) {
        console.log(message);
        console.log("list:", allData.deployedModelList);
        global.panel.webview.postMessage({ modelFileListRet: allData.deployedModelList });
    },

    // 3.3 保存应用配置 - 新建应用页面的“保存应用”按钮触发
    saveImgAppConfig(global, message) {
        console.log(message);
        let saveRet = writeImgAppInfoToJson(global, message);
        console.log("saveImgAppConfig save result： ", saveRet);
        global.panel.webview.postMessage({ saveImgAppConfigRet: saveRet });
    },

    // 3.4 选择启动任务所需的各个配置文件 - 打包成一个了
    selectEncodeConfFile(global, message) {
        console.log(message);
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择文件",
            // canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("选择配置文件为", fileUri);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedEncodeConfDir: fileUri[0].fsPath });
        });
    },

    //3.5 选择编码过程中输出文件所在的文件夹
    selectOutputDir(global, message) {
        console.log(message);
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("选择目录为", fileUri);
            // 将选择的目录返回给webview
            global.panel.webview.postMessage({ selectedOutputDir: fileUri[0].fsPath });
        });
    },

    //3.6 跳转到应用运行界面 - 新建应用页面的“启动应用”按钮触发
    gotoImgAppRunTaskPageByName(global, message) {
        console.log(message);
        // 先检查应用是否已经保存，必须先保存再启动
        let isExist = checkImgAppExist(global.context, message);
        if (isExist.indexOf("error") != -1) {
            // app不存在 报错
            global.panel.webview.postMessage({ gotoImgAppRunTaskPageByNameRet: isExist });
        } else {
            console.log("gotoImgAppRunTaskPageByName: the app is saved and can go to the task page!")
            // 保存成功 - 跳转到任务页面
            openImgAppRunTaskPage(global.context, "byName", message.text[0]);
        }
    }
};

// 4. 与应用详情页面的交互
const imgAppInfoMessageHandler = {
    getImgAppInfos(global, message) {
        console.log(message);
        let infos = searchImgAppByID(global.context, global.appID);
        global.panel.webview.postMessage({ cmd: 'getImgAppInfosRet', cbid: message.cbid, data: infos });
    },
};


// 5. 应用运行页面交互
const imgAppRunTaskMessageHandler = {
    // 发送应用基本信息
    getImgAppInfos(global, message) {
        console.log(message);
        global.panel.webview.postMessage({ cmd: 'getImgAppInfosRet', cbid: message.cbid, data: global.appInfo });
    },




};


// 6. 与任务列表首页交互
const imgAppTasksMessageHandler = {
    // 查询所有图像识别任务列表
    getImgAppTasksList(global, message) {
        console.log(message);
        let allImgTasks = searchAllImgAppTasks(global.context);
        global.panel.webview.postMessage({ cmd: 'getImgAppTasksListRet', cbid: message.cbid, data: allImgTasks });
    },

    // 跳转到新建任务页面，也就是应用列表页面
    gotoNewImgAppTaskPage(global, message) {
        console.log(message);
        openImgAppHomePage(global.context);
    },

    // 跳转到任务详情页面
    gotoImgAppTaskPage(global, message) {
        console.log(message);
        openImgAppRunTaskPage(global.context, "byID", message.text);
    },

    // 删除一个任务，也就是将json文件中应用的status恢复为默认值0 
    deleteImgAppTask(global, message) {
        console.log(message);
        let ret = updateImgAppStatusToApp(global.context, message.text);
        console.log("deleteAppConfig ret: ", ret);
        global.panel.webview.postMessage({ deleteImgAppTaskRet: message.text });
    }

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



// 1. webview: 打开首页
export function openImgAppHomePage(context) {
    const panel = vscode.window.createWebviewPanel(
        'ImgAppWelcome',
        "数字图像识别",
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
export function openImgAppInfoPage(context, appID) {
    const panel = vscode.window.createWebviewPanel(
        'ImgAppInfo',
        "应用详情",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    // 保存应用ID
    let global = { panel, context, appID };
    panel.webview.html = getAppsHomeHtml(context, imgAppInfoHtmlFilePath);

    panel.webview.onDidReceiveMessage(message => {
        if (imgAppInfoMessageHandler[message.command]) {
            imgAppInfoMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}


// 4. 打开运行应用页面 
export function openImgAppRunTaskPage(context, kind, val) {
    // 查询应用信息
    if (kind == "byID") {
        var appInfo = searchImgAppByID(context, val);
    } else if (kind == "byName") {
        var appInfo = searchImgAppByName(context, val);
    }
    if (appInfo == "none") {
        console.error("can not found the app: ", val);
    }
    // 应用成为一条任务
    updateImgAppStatusToTask(context, appInfo.id);
    console.log("become one task: ", appInfo.id);

    const panel = vscode.window.createWebviewPanel(
        'runImgApp',
        "任务详情",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    let global = { panel, context, appInfo };
    panel.webview.html = getAppsHomeHtml(context, imgAppRunTaskHtmlFilePath);

    panel.webview.onDidReceiveMessage(message => {
        if (imgAppRunTaskMessageHandler[message.command]) {
            imgAppRunTaskMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}

// 5. 打开任务列表首页
// 以后有多种任务了，可以移到外面，新建一个文件
export function openImgAppTasksPage(context) {
    const panel = vscode.window.createWebviewPanel(
        'ImgAppTasks',
        "图像识别任务",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
        }
    );

    let global = { panel, context };
    panel.webview.html = getAppsHomeHtml(context, imgAppTasksHtmlFilePath);
    panel.webview.onDidReceiveMessage(message => {
        if (imgAppTasksMessageHandler[message.command]) {
            imgAppTasksMessageHandler[message.command](global, message);
        } else {
            vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
        }
    }, undefined, context.subscriptions);
}



/**
 * ******************************************************************************************************
 * 运行任务相关函数，执行python脚本
 * ******************************************************************************************************
 */
function imgAppRunTaskAllProcess(global) {
    console.log("start run a task for app: ", global);

    // 0. 查询应用基本信息

    // 先解包配置文件

    // 1. 李畅的脉冲编码

    // console.log("img convert into pickle finished...");  // exec是异步的，这里打印没意义

    // 2. 柳铮的打包编译

    // 3. 运行任务，识别图像


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

// 获取文件夹下图像文件的数量
function getImgFileNum(path: string) {
    // 根据文件路径读取文件，返回一个文件列表
    //读取文件夹下内容
    let files = fs.readdirSync(path);
    console.log("getFiles list =--------", files);
    return files.length;
}