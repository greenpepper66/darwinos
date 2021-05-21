import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from "child_process";
import { searchAllJson, updateImgAppInfo, searchImgAppByID } from '../DataProvider/ImgAppJsonDataProvider';
import { openImgAppInfoPage, openImgAppRunTaskPage } from './ImgAppHome';
import { IDEPanels } from "../extension";

// 日志输出
const log_output_channel = vscode.window.createOutputChannel("darwinos output");
log_output_channel.show();


// html文件路径
const userAppHomeHtmlFilePath = "src/static/views/userAppHome.html";
const userMnistAppHomeHtmlFilePath = "src/static/views/userMnistAppHome.html";
const userMnistOneAppHtmlFilePath = "src/static/views/userMnistOneApp.html";
const otherAppHomeHtmlFilePath = "src/static/views/otherAppHome.html";
const userFatigueDrivingAppHtmlPath = "src/static/views/fatigueDrivingApp.html";



// 1. 与应用视图首页webview的交互
const messageHandler = {
    // 单击首页图标
    gotoOneKindUserAppPage(global, message) {
        console.log(message);
        openOneKindUserAppPage(global.context, message.text);
    },

};

// 2. 手写体用户应用首页-九宫格页面
const mnistMessageHandler = {
    // 查询所有图像识别应用列表
    getUserAppsList(global, message) {
        console.log(message);
        let allImgTasks = searchAllJson(global.context);
        global.panel.webview.postMessage({ cmd: 'getUserAppsListRet', cbid: message.cbid, data: allImgTasks });
    },

    // 单击九宫格的按钮进入应用运行页面
    gotoOneMnistUserAppPage(global, message) {
        console.log(message);
        openOneMnistUserAppPageByID(global.context, message.text);
    },

}

// 3. 单个应用页面
const oneUserAppMessageHandler = {
    // 返回单个应用信息
    getOneMnistUserAppInfo(global, message) {
        console.log(message);
        global.panel.webview.postMessage({ cmd: 'getOneMnistUserAppInfoRet', cbid: message.cbid, data: global.appInfo });
    },

    // 选择图像
    userAppSelectImgDir(global, message) {
        console.log(message);
        const options: vscode.OpenDialogOptions = {
            openLabel: "选择目录",
            canSelectFolders: true,
        };
        vscode.window.showOpenDialog(options).then(fileUri => {
            console.log("选择目录为", fileUri);
            global.panel.webview.postMessage({ userAppSelectImgDirRet: fileUri[0].fsPath });
        });
    },

    // 点击“启动应用”按钮，执行图像识别，应用成为一条任务
    userAppStartRun(global, message) {
        // 保存图像源信息, 获取图像数量，修改状态 0-1，成为一条任务
        let totalImgNum = getImgFileNum(message.text[1]);                 // 获取图像数量

        let ret = updateImgAppInfo(global.context, global.appInfo.id, message.text[0], message.text[1], totalImgNum);
        console.log("updateImgAppInfo ret: ", ret);

        // 更新global中的应用信息
        global.appInfo = searchImgAppByID(global.context, global.appInfo.id);
        console.log("更新global中应用信息：", global.appInfo);

        if (ret == "success") {
            global.panel.webview.postMessage({ userAppStartRunReturnImgNum: totalImgNum });
            // 开始运行应用, 先解包配置文件
            unpackConfigFiles(global);
        }
    },


    // 执行脉冲编码脚本
    startImgConvertProcess(global, message) {
        console.log(message);
        runImgConvertScript(global);
    },

    // 将脉冲编码文件打包
    startPickleConvertProcess(global, message) {
        console.log(message);
        runPickleConvertScript(global);
    },

    // 手写体识别
    startRecognitionProcess(global, message) {
        console.log(message);
        runMnistSendInputScript(global);
    },


    // 查询应用  显示详情页
    userAppGotoImgAppInfoPage(global, message) {
        console.log(message);
        openImgAppInfoPage(global.context, message.text);
    },
    // 跳转到任务详情页面
    userAppGotoImgAppTaskPage(global, message) {
        console.log(message);
        openImgAppRunTaskPage(global.context, message.text);
    },
};

// 4. 疲劳检测页面
const fatigueDrivingMessageHandler = {
    // 开始启动服务 推流
    startFfmpegEncodeVideo(global, message) {
        console.log(message);
        //启动一个server，通过ffmpeg拉流
        startFfmpegSerger(global)
    },

}


/********************************************************************************************
 * 打开页面
 ********************************************************************************************/
// 1.overView按钮单击后显示应用视图首页 - 4个类型框图
export function UserAppHomePageProvide(context) {
    console.log("IDE UserAppHomePageProvide!", IDEPanels.userHomePanel);
    if (IDEPanels.userHomePanel) {
        console.log("打开用户视图首页：", IDEPanels.userHomePanel.visible);
        IDEPanels.userHomePanel.reveal();
    } else {
        console.log("新建用户视图首页");

        IDEPanels.userHomePanel = vscode.window.createWebviewPanel(
            'userHomePage',
            "用户视图",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );

        IDEPanels.userHomePanel.webview.html = getHtmlContent(context, userAppHomeHtmlFilePath);

        let panel = IDEPanels.userHomePanel;
        let global = { panel, context };

        IDEPanels.userHomePanel.webview.onDidReceiveMessage(message => {
            if (messageHandler[message.command]) {
                messageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE UserAppHomePageProvide 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userHomePanel.onDidDispose(
            () => {
                IDEPanels.userHomePanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}

// 2. 单击导航栏的分类，进入相应类别页面
export function openOneKindUserAppPage(context, num) {
    if (num == 1) {  // 数字图像识别应用
        openMnistUserAppHomePage(context);
    } else if (num == 4) {
        openFatigueDrivingAppPage(context);
    }
    else {
        openOtherUserAppHomePage(context);
    }
}

// 2.1 打开用户视图 数字图像识别首页 - 手写体九宫格
export function openMnistUserAppHomePage(context) {
    console.log("IDE openMnistUserAppHomePage!", IDEPanels.userImgAppSquarePanel);
    if (IDEPanels.userImgAppSquarePanel) {
        console.log("打开用户视图数字图像识别九宫格首页：", IDEPanels.userImgAppSquarePanel.visible);
        IDEPanels.userImgAppSquarePanel.reveal();
    } else {
        console.log("新建用户视图数字图像识别九宫格首页");

        IDEPanels.userImgAppSquarePanel = vscode.window.createWebviewPanel(
            'userMnistAppPage',
            "数字图像识别",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );
        IDEPanels.userImgAppSquarePanel.webview.html = getHtmlContent(context, userMnistAppHomeHtmlFilePath);

        let panel = IDEPanels.userImgAppSquarePanel;
        let global = { panel, context };

        IDEPanels.userImgAppSquarePanel.webview.onDidReceiveMessage(message => {
            if (mnistMessageHandler[message.command]) {
                mnistMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openMnistUserAppHomePage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userImgAppSquarePanel.onDidDispose(
            () => {
                IDEPanels.userImgAppSquarePanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}

// 2.2 其他应用
export function openOtherUserAppHomePage(context) {
    const panel = vscode.window.createWebviewPanel(
        'OtherAppWelcome',
        "其他应用",
        vscode.ViewColumn.One,
        {
            enableScripts: true,
        }
    );
    panel.webview.html = getHtmlContent(context, otherAppHomeHtmlFilePath);
}




// 3. 单击用户图像识别应用首页九宫格中的按钮，进入某个应用运行页面
export function openOneMnistUserAppPageByID(context, id) {
    console.log("IDE openOneMnistUserAppPageByID!", IDEPanels.userImgAppRunPagePanelsMap);
    if (IDEPanels.userImgAppRunPagePanelsMap.has(id)) {
        console.log("打开用户视图图像识别应用运行页面：", IDEPanels.userImgAppRunPagePanelsMap.get(id).visible);
        IDEPanels.userImgAppRunPagePanelsMap.get(id).reveal();
    } else {
        console.log("新建用户视图图像识别应用运行页面");

        let panel = vscode.window.createWebviewPanel(
            'userImgAppRunPage',
            "用户应用",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        panel.webview.html = getHtmlContent(context, userMnistOneAppHtmlFilePath);

        var appInfo = searchImgAppByID(context, id);
        if (appInfo == "none") {
            console.error("can not found the app: ", id);
        }

        let global = { panel, context, appInfo };
        IDEPanels.userImgAppRunPagePanelsMap.set(id, panel);

        panel.webview.onDidReceiveMessage(message => {
            if (oneUserAppMessageHandler[message.command]) {
                oneUserAppMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openOneMnistUserAppPageByID 2!", global.panel);

        // 面板被关闭后重置
        panel.onDidDispose(
            () => {
                panel = undefined;
                IDEPanels.userImgAppRunPagePanelsMap.delete(id);
            },
            null,
            context.subscriptions
        );
    }

}



// 4. 打开疲劳检测摄像头应用页面
function openFatigueDrivingAppPage(context) {
    console.log("IDE openMnistUserAppHomePage!", IDEPanels.userFatigueDrivingAppPanel);
    if (IDEPanels.userFatigueDrivingAppPanel) {
        console.log("打开疲劳检测页面：", IDEPanels.userFatigueDrivingAppPanel.visible);
        IDEPanels.userFatigueDrivingAppPanel.reveal();
    } else {
        console.log("新建疲劳检测页面");

        IDEPanels.userFatigueDrivingAppPanel = vscode.window.createWebviewPanel(
            'fatigueDrivingAppPage',
            "疲劳检测",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
            }
        );
        IDEPanels.userFatigueDrivingAppPanel.webview.html = getHtmlContent(context, userFatigueDrivingAppHtmlPath);

        let panel = IDEPanels.userFatigueDrivingAppPanel;
        let global = { panel, context };

        IDEPanels.userFatigueDrivingAppPanel.webview.onDidReceiveMessage(message => {
            if (fatigueDrivingMessageHandler[message.command]) {
                fatigueDrivingMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openMnistUserAppHomePage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userFatigueDrivingAppPanel.onDidDispose(
            () => {
                IDEPanels.userFatigueDrivingAppPanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}


/********************************************************************************************
 * 工具函数
 ********************************************************************************************/
// 1. html页面处理
export function getHtmlContent(context, templatePath) {
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

// 获取文件夹下图像文件的数量
function getImgFileNum(path: string) {
    // 根据文件路径读取文件，返回一个文件列表
    //读取文件夹下内容
    let files = fs.readdirSync(path);
    console.log("getFiles list =--------", files);
    return files.length;
}

// 计算时间差
function getAppRuntime(global) {
    let start = global.startTime;
    let end = global.endTime;
    let timeDiff = end.getTime() - start.getTime();//时间差的毫秒数
    let minutes = Math.floor(timeDiff / (60 * 1000))//计算相差分钟数
    let leave1 = timeDiff % (60 * 1000)      //计算分钟数后剩余的毫秒数
    let seconds = Math.floor(leave1 / 1000) //计算秒数
    let leave2 = leave1 % 1000; // 剩余毫秒数
    let runtime = minutes + "分钟" + seconds + "秒" + leave2 + "毫秒";
    return runtime;
}





/**
 * ******************************************************************************************************
 * 运行任务相关函数，执行python脚本
 * ******************************************************************************************************
 */

// 0. 解包配置文件
function unpackConfigFiles(global) {
    console.log("start unpack config files for app: ", global.appInfo.name);
    // 获取应用运行的起始时间
    let startTime = new Date();//获取当前时间 
    global["startTime"] = startTime;
    console.log("应用运行起始时间为：", global.startTime);

    // 脚本位置
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "pack_bin_files.py");

    let configFile = global.appInfo.encodeConfigFile;      // 配置文件
    let outputDir = global.appInfo.outputDir;            // 输出pickle保存目录,脚本里会新建一个文件夹unpack_target

    let command_str = "python3 " + scriptPath + " " + configFile + " " + outputDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        // if (data.indexOf("UNPACKCONFIG FINISHED") !== -1) {
        //     global.panel.webview.postMessage({ unpackConfigFileProcessFinish: "unpack finish" });
        // }
        let formatted_data = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ unpackConfigFileProcessLog: formatted_data });
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ unpackConfigFileProcessErrorLog: formatted_err });
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
        let unpackPath = path.join(outputDir, "unpack_target");
        let str = "Unpack config files finished, the result is saved in " + unpackPath;
        global.panel.webview.postMessage({ unpackConfigFileProcessFinish: str });
    });

}

// 1. 运行脉冲编码脚本
// 根据保存的应用配置：encodeMethodID 0——李畅的频率编码， 1——宏泽的泊松编码 
function runImgConvertScript(global) {
    console.log("start run a task for app: ", global.appInfo.name);

    // 脚本位置 encode_input.py——频率编码， poisson_encode.py——泊松编码
    let selectedEncodeMethod = ""
    if (global.appInfo.encodeMethodID == 0) {
        console.log("选择频率编码")
        selectedEncodeMethod = "encode_input.py"
    } else if (global.appInfo.encodeMethodID == 1) {
        console.log("选择泊松编码")
        selectedEncodeMethod = "poisson_encode.py"
    }
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", selectedEncodeMethod);

    // 文件夹选择器返回的路径如 /D:/workspace/lab-work/input整合/data_input_encode 需要去掉第一个/  并将/转为\  路径里不能带中文
    let imgSrcDir = global.appInfo.imgSrcDir;            // 图像源目录
    let outputDir = global.appInfo.outputDir;            // 输出pickle保存目录,脚本里会新建一个文件夹pickleDir
    let configDir = path.join(outputDir, "unpack_target");                            // 配置文件目录，上一步解包后保存路径，要保证有br2.pkl文件

    let totalImgNum = getImgFileNum(global.appInfo.imgSrcDir);                 // 获取图像数量
    let imgNum = 0;

    let command_str = "python3 " + scriptPath + " " + imgSrcDir + " " + configDir + " " + outputDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        // if (data.indexOf("CONVERT FINISHED") !== -1) {
        //     global.panel.webview.postMessage({imgConvertProcessFinish: "convert finish"});
        // }
        if (data.indexOf("Converting one image") !== -1) {
            // 传递 转换成功的图像个数
            // todo
            imgNum++;
            global.panel.webview.postMessage({ imgConvertOneDone: [imgNum, totalImgNum] });
        }
        let formatted_data = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ imgConvertProcessLog: formatted_data });
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ imgConvertProcessErrorLog: formatted_err });
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
        let pickPath = path.join(outputDir, "pickleDir");
        let str = "Convert imgage into pickle finished, the result is saved in " + pickPath;
        global.panel.webview.postMessage({ imgConvertProcessFinish: str });
    });
}

// 2. 运行柳铮的脚本
function runPickleConvertScript(global) {
    console.log("start convert pickle files: ", global.appInfo.name);

    // 脚本位置
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "input_out.py");

    // 文件夹选择器返回的路径如 /D:/workspace/lab-work/input整合/data_input_encode 需要去掉第一个/  并将/转为\  路径里不能带中文
    let outputDir = global.appInfo.outputDir;            // 用户指定的输出目录
    let configDir = path.join(outputDir, "unpack_target");                            // 配置文件目录，要保证有 connfiles1_1、 layerWidth1_1、 nodelist1_1、 input_to_layer_1.pickle 4个文件

    let totalImgNum = global.appInfo.imgNum;                // 获取图像数量
    let imgNum = 0;

    let command_str = "python3 " + scriptPath + " " + outputDir + " " + configDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        if (data.indexOf("Converting one image") !== -1) {
            // 传递 转换成功的图像个数
            imgNum++;
            global.panel.webview.postMessage({ pickleConvertOneDone: [imgNum, totalImgNum] });
        }
        let formatted_data = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ pickleConvertProcessLog: formatted_data });
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ pickleConvertProcessErrorLog: formatted_err });
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
        let str = "Convert pickle files all finished, the result is saved in " + outputDir;
        global.panel.webview.postMessage({ pickleConvertProcessFinish: str });
    });
}


// 3. 运行发送任务的脚本
function runMnistSendInputScript(global) {
    console.log("start mnist image recognition: ", global.appInfo.name);

    // 脚本位置 mnist_send_input_back.py
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "mnist_send_input_back.py");
    let imgSrcDir = global.appInfo.imgSrcDir;            // 图像源目录

    // 文件夹选择器返回的路径如 /D:/workspace/lab-work/input整合/data_input_encode 需要去掉第一个/  并将/转为\  路径里不能带中文
    let outputDir = global.appInfo.outputDir;            // 用户指定的输出目录
    let configDir = path.join(outputDir, "unpack_target");                         // 配置文件目录，要保证有 config.b 文件


    let totalImgNum = global.appInfo.imgNum;                 // 获取图像数量
    let imgNum = 0;

    let command_str = "python3 " + scriptPath + " " + outputDir + " " + configDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        if (data.indexOf("Recognize one image ok") !== -1) {
            // 传递 转换成功的图像个数
            imgNum++;
            global.panel.webview.postMessage({ recognitionOneDone: [imgNum, totalImgNum] });
        }

        // 解析识别结果的输出
        if (data.indexOf("RECOGNITION RESULT") !== -1) {
            console.log("*************", data);
            // 图像识别结果
            let ret = data.split("**")[1];
            // 对应的原始图像数据
            let imgName = data.split("**")[2].replace(/(^\s*)|(\s*$)/g, "");
            console.log("图像识别结果：", ret, imgName);
            // todo
            let datauri = "";
            fs.readdirSync(imgSrcDir).forEach((file, index) => {
                console.log("tesatatat", file, index, file.indexOf(imgName));
                if (file.indexOf(imgName) != -1) {
                    let bData = fs.readFileSync(imgSrcDir + "/" + file);
                    let base64Str = bData.toString('base64');
                    datauri = 'data:image/png;base64,' + base64Str;
                    console.log("src images datauri: ", datauri);
                }
            });
            global.panel.webview.postMessage({ recognitionOneResult: [ret, datauri] });
        }

        let formatted_data = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ recognitionProcessLog: formatted_data });
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ recognitionProcessErrorLog: formatted_err });
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
        let str = "This image recognition task is all finished！";

        // 获取应用运行的结束时间
        let endTime = new Date();//获取当前时间 
        global["endTime"] = endTime;
        console.log("应用运行结束时间为：", global.endTime);
        global["totalRuntime"] = getAppRuntime(global);
        console.log("应用运行耗时为：", global.totalRuntime);
        global.panel.webview.postMessage({ recognitionProcessFinish: global.totalRuntime });
    });

}




/**
 * ******************************************************************************************************
 * 运行摄像头应用
 * ******************************************************************************************************
 */

// 1. 启动server  ffmpeg推流
function startFfmpegSerger(global) {
    console.log("启动ffmpeg server  ");

    // 脚本位置
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "js", "fatigueDrivingAppServer.js");

    let command_str = "node " + scriptPath;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        // log_output_channel.append(data);
        // console.log(data);
        global.panel.webview.postMessage({ startFfmpegEncodeVideoRet: "success" });
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
    });

}