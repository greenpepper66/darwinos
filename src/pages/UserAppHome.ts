import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ChildProcess, exec, spawn } from "child_process";
import { searchAllJson, updateImgAppInfo, searchImgAppByID } from '../DataProvider/ImgAppJsonDataProvider';
import { openImgAppInfoPage, openImgAppRunTaskPage } from './ImgAppHome';
import { IDEPanels } from "../extension";
import { handWriterData } from '../os/server';

var https = require('http');
var ip = require('ip');

// 日志输出
const log_output_channel = vscode.window.createOutputChannel("darwinos output");
log_output_channel.show();

// 手写板图像保存位置
const handWriterImgSaveFilePath = "src/static/cache/handWriterImgBase64Data.txt";

// 手写板页面访问地址
const handWriterServerURL = "http://" + ip.address() + ":5003"





// html文件路径
const userAppHomeHtmlFilePath = "src/static/views/userAppHome.html";
const userMnistAppHomeHtmlFilePath = "src/static/views/userMnistAppHome.html";
const userMnistOneAppHtmlFilePath = "src/static/views/userMnistOneApp.html";
const otherAppHomeHtmlFilePath = "src/static/views/otherAppHome.html";

const userFatigueDrivingAppHtmlPath = "src/static/views/fatigueDrivingApp.html";
const userFatigueDrivingAppAfterHtmlPath = "src/static/views/fatigueDrivingAppAfter.html";
const userFatigueDrivingAppHomeHtmlPath = "src/static/views/userFatigueDrivingAppHome.html";


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
        let allImgTasks = searchAllJson(global.context, 0);
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
        global.appInfo = searchImgAppByID(global.context, global.appInfo.id, 0);
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


    /**
     * *************************
     * 手写板应用相关
     * *************************
     */
    // 获取手写板url
    getHandWriterServerURL(global, message) {
        console.log(message);
        global.panel.webview.postMessage({ cmd: 'getHandWriterServerURLRet', cbid: message.cbid, data: handWriterServerURL });
    },
    // 显示手机上的手写数字
    startGetHandWriterImg(global, message) {
        console.log(message);
        // 先清除缓存
        clearGlobalHandWriterCache();

        getHandWriterImgLoop(global);
    },
    // 解包配置文件, 用户页面上一选择“手写板输入源”就执行解包
    unpackHandWriterConfig(global, message) {
        console.log(message);
        unpackHandWriterConfigProcess(global);
    },
    // 手写板图像编码
    startHandWriterEncode(global, message) {
        console.log(message);
        encodeHandWriterImgProcess(global);
    },
    // 手写板数字芯片识别
    startHandWriterRecognitionProcess(global, message) {
        console.log(message);
        runHandWriterSendInputProcess(global);
    },

};




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
        openFatigueDrivingAppHomePage(context);
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

        var appInfo = searchImgAppByID(context, id, 0);
        if (appInfo == "none") {
            console.error("can not found the app: ", id);
        }

        let postHandWriterImgTimer = undefined; // 接收手写板数据的计时器
        let currentHandWriterImgData = "";      // 当前页面显示的手写板图像
        let currentHandWriterEncodeSpikes = []; // 当前手写板图像的脉冲数据
        let currentHandWriterOutputSpikes = []; // 当前手写板芯片脉冲输出数据
        let currentHandWriterOutputNum = -1;    // 当前手写板芯片识别结果

        let global = {
            panel, context, appInfo, postHandWriterImgTimer,
            currentHandWriterImgData, currentHandWriterEncodeSpikes,
            currentHandWriterOutputSpikes, currentHandWriterOutputNum,
        };
        IDEPanels.userImgAppRunPagePanelsMap.set(id, panel);

        panel.webview.onDidReceiveMessage(message => {
            if (oneUserAppMessageHandler[message.command]) {
                oneUserAppMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openOneMnistUserAppPageByID 2!", global.panel);

        panel.onDidChangeViewState(
            () => {
                console.log("切换页面了！");
                // 页面切换的时候需要清除手写板的缓存，防止同时打开多个手写板应用，界面呈现上一个应用输入的手写数字
                clearGlobalHandWriterCache();
            }
        );

        // 面板被关闭后重置
        panel.onDidDispose(
            () => {
                panel = undefined;
                IDEPanels.userImgAppRunPagePanelsMap.delete(id);
                if (global.postHandWriterImgTimer != undefined) {
                    clearInterval(global.postHandWriterImgTimer);
                    global.postHandWriterImgTimer = undefined;
                    console.log("handwriter timer killed！");
                }
                clearGlobalHandWriterCache();
            },
            null,
            context.subscriptions
        );
    }

}







/**
 * ******************************************************************************************************
 * 手写体图像识别，本地图像   ———    运行任务相关函数，执行python脚本
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
        if (data.indexOf("get slave ip port failed") != -1) {
            global.panel.webview.postMessage({ getConnectionIPAndPortFailed: data });
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
        global["totalRuntime"] = getAppRuntime(global.startTime, global.endTime);
        console.log("应用运行耗时为：", global.totalRuntime);
        global.panel.webview.postMessage({ recognitionProcessFinish: global.totalRuntime });
    });

}





/**
 * ******************************************************************************************************
 * 手写数字图像识别 —— 移动端手写板
 * ******************************************************************************************************
 */
// 0. 清除手写板缓存
function clearGlobalHandWriterCache() {
    handWriterData.currentImgBs64Data = "";
    handWriterData.currentImgEncodeSpikes = [];
    handWriterData.currentImgOutputSpikes = [];
    handWriterData.currentImgRecognitionRet = -1;
    // 清空缓存文件：handWriterImgBase64Data.txt


}

// 1. 将手写板上传的base64编码的手写体数字图像发送给前端页面显示
function getHandWriterImgLoop(global) {

    let postHandWriterImgTimer = setInterval(function encodeAndSendData() {

        // 显示原始数字图片
        if (handWriterData.currentImgBs64Data != "" && handWriterData.currentImgBs64Data != undefined
            && handWriterData.currentImgBs64Data != global.currentHandWriterImgData
            && global.panel.visible == true) {
            global.currentHandWriterImgData = handWriterData.currentImgBs64Data;
            console.log("发送图片");
            global.panel.webview.postMessage({ getHandWriterImgRet: handWriterData.currentImgBs64Data });
            // 保存图片? handWriterImgSaveFilePath
            saveHandWriterImgToLocal(global.context, handWriterData.currentImgBs64Data);
        }

        // 脉冲编码数据发送给前端，绘制echart
        if (handWriterData.currentImgEncodeSpikes.length != 0
            && handWriterData.currentImgEncodeSpikes != global.currentHandWriterEncodeSpikes
            && global.panel.visible == true) {
            global.currentHandWriterEncodeSpikes = handWriterData.currentImgEncodeSpikes;
            console.log("发送脉冲");
            global.panel.webview.postMessage({ getHandWriterEncodeRet: handWriterData.currentImgEncodeSpikes });
        }

        // 芯片识别结果发送给前端
        if (handWriterData.currentImgOutputSpikes.length != 0
            && handWriterData.currentImgOutputSpikes != global.currentHandWriterOutputSpikes
            && global.panel.visible == true) {
            global.currentHandWriterOutputSpikes = handWriterData.currentImgOutputSpikes;
            console.log("发送结果", handWriterData.currentImgOutputSpikes, handWriterData.currentImgRecognitionRet);
            global.panel.webview.postMessage({
                runHandWriterSendInputProcessResult:
                    [handWriterData.currentImgOutputSpikes, handWriterData.currentImgRecognitionRet]
            });
        }


    }, 500);
    global["postHandWriterImgTimer"] = postHandWriterImgTimer;
}


// 保存手写板图像的base64数据
function saveHandWriterImgToLocal(context, bs64_img: string) {
    let resourcePath = path.join(context.extensionPath, handWriterImgSaveFilePath);
    let base64 = bs64_img.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFile(resourcePath, base64, function (err) {
        if (err) {
            console.error(err);
            return "error";
        }
        console.log('----------保存成功-------------');
        return "success";
    });


    // // 保存为png格式图像 handWriterPngImgPath
    // let resourcePath = path.join(context.extensionPath, handWriterPngImgPath);
    // var base64 = bs64_img.replace(/^data:image\/\w+;base64,/, ""); //去掉图片base64码前面部分data:image/png;base64
    // var dataBuffer = new Buffer(base64, 'base64'); //把base64码转成buffer对象，
    // console.log('dataBuffer是否是Buffer对象：' + Buffer.isBuffer(dataBuffer)); // 输出是否是buffer对象
    // fs.writeFile(resourcePath, dataBuffer, function (err) {//用fs写入文件
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log('写入成功！');
    //     }
    // });

}

// 2. 解包配置文件
function unpackHandWriterConfigProcess(global) {
    console.log("start unpack config files for hand-writer app: ", global.appInfo.name);

    // 脚本位置
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "pack_bin_files.py");

    let configFile = global.appInfo.encodeConfigFile;      // 配置文件
    let outputDir = global.appInfo.outputDir;            // 输出路径,脚本里会新建一个文件夹unpack_target

    let command_str = "python3 " + scriptPath + " " + configFile + " " + outputDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
    });

    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ unpackHandWriterConfigProcessErrorLog: formatted_err });
    });

    scriptProcess.on("exit", function () {
        console.log("done!!");
        let unpackPath = path.join(outputDir, "unpack_target");
        let str = "Unpack hand-writer config files finished, the result is saved in " + unpackPath;
        global.panel.webview.postMessage({ unpackHandWriterConfigProcessFinish: str });
    });
}


// 3. 图像编码
function encodeHandWriterImgProcess(global) {
    console.log("start encode for hand-writer app: ", global.appInfo);

    // 防止识别中提交新的图像，造成图像和输出不一样
    handWriterData.handWriterCouldNextRegFlag = false;

    // 获取应用运行的起始时间
    let startTime = new Date();//获取当前时间 
    global["handWriterStartTime"] = startTime;
    console.log("应用运行起始时间为：", global.handWriterStartTime);

    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "hand_writer", "main.py");

    let imgFile = path.join(global.context.extensionPath, handWriterImgSaveFilePath);  // 保存图像的文件
    let outputDir = global.appInfo.outputDir;            // 编码文件保存目录, 只有一个input.txt和一个row.txt，直接放在应用的output目录下
    let configDir = path.join(outputDir, "unpack_target");  // 配置文件目录，上一步解包后保存路径，要保证有br2.pkl文件

    let command_str = "python3 " + scriptPath + " " + imgFile + " " + configDir + " " + outputDir;
    console.log("执行命令为", command_str);
    let scriptProcess = exec(command_str, {});

    scriptProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
    });
    scriptProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        // global.panel.webview.postMessage({ encodeHandWriterImgProcessErrorLog: formatted_err });
    });
    scriptProcess.on("exit", function () {
        console.log("done!!");
        let str = "Encode hand writer img finished, the result is saved in " + outputDir;
        global.panel.webview.postMessage({ encodeHandWriterImgProcessFinish: str });
    });

}

// 4. 发送数据，芯片识别
function runHandWriterSendInputProcess(global) {
    console.log("给芯片发送数据，执行手写板数字识别");

    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "hand_writer", "send_input.py");
    let outputDir = global.appInfo.outputDir;            // 编码文件保存目录, 只有一个input.txt和一个row.txt，直接放在应用的output目录下
    let configDir = path.join(outputDir, "unpack_target");  // 配置文件目录，上一步解包后保存路径，要保证有br2.pkl文件

    let command_str = "python3 " + scriptPath + " " + configDir + " " + outputDir;
    console.log("执行命令为", command_str);
    let chipCalculateProcess = exec(command_str, {});

    chipCalculateProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        if (data.indexOf("get slave ip port failed") != -1) {
            global.panel.webview.postMessage({ handWriterGetIPAndPortFailed: data });
        }
        // // 解析识别结果的输出
        // if (data.indexOf("HANDWRITERRECOGNITION RESULT") !== -1) {
        //     // 图像识别结果
        //     let ret = data.split("**")[1];
        //     console.log("手写板数字识别结果：", ret);
        //     global.panel.webview.postMessage({ runHandWriterSendInputProcessResult: ret });
        // }
    });
    chipCalculateProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
        let formatted_err = data.split("\r\n").join("<br/>");
        global.panel.webview.postMessage({ runHandWriterSendInputProcessErrorLog: formatted_err });

    });
    chipCalculateProcess.on("exit", function () {
        console.log("chip calculate finished!!");
        global.panel.webview.postMessage({ runHandWriterSendInputProcessFinish: "done" });

        // 获取应用运行的结束时间
        let endTime = new Date();//获取当前时间 
        global["handWriterEndTime"] = endTime;
        console.log("应用运行结束时间为：", global.handWriterEndTime);
        global["handWriterTotalRuntime"] = getAppRuntime(global.handWriterStartTime, global.handWriterEndTime);
        console.log("应用运行耗时为：", global.handWriterTotalRuntime);
        global.panel.webview.postMessage({ handWriterRecognitionProcessTime: global.handWriterTotalRuntime });

        // 可以执行下一个图像识别
        handWriterData.handWriterCouldNextRegFlag = true;
    });
}























/**
 * ******************************************************************************************************
 * 运行摄像头应用 —— 疲劳检测
 * ******************************************************************************************************
 */

var websocketServerProcess: vscode.Terminal | undefined = undefined;  // 启动 websocket，接收python推送过来的视频数据
var cameraCaptureProcess: vscode.Terminal | undefined = undefined;    // 实时视频数据往socket服务器推送

var videoEncodeAndChipSendTimer: NodeJS.Timeout | undefined = undefined;    // 图像编码、芯片发送数据计时器
var ifNeedEncodeAndChipSendNextFrame: boolean | undefined = true;  // 是否需要编码识别下一幅帧


// 1. 用户视图疲劳检测九宫格页面消息处理
const userFatigueDrivingHomeMessageHandler = {
    // 查询所有疲劳检测应用列表
    getUserFatigueDrivingAppsList(global, message) {
        console.log(message);
        let allImgTasks = searchAllJson(global.context, 1);
        global.panel.webview.postMessage({ cmd: 'getUserFatigueDrivingAppsListRet', cbid: message.cbid, data: allImgTasks });
    },

    // 单击疲劳检测九宫格的按钮进入应用运行页面
    gotoOneUserFatigueDrivingAppPage(global, message) {
        console.log(message);
        openOneUserFatigueDrivingAppPage(global.context);  // 全都是一个页面
    },
}

// 2. 打开用户视图-疲劳检测首页
function openFatigueDrivingAppHomePage(context) {
    console.log("IDE openFatigueDrivingAppHomePage!", IDEPanels.userFatigueDrivingAppHomePanel);
    if (IDEPanels.userFatigueDrivingAppHomePanel) {
        console.log("打开疲劳检测九宫格页面：", IDEPanels.userFatigueDrivingAppHomePanel.visible);
        IDEPanels.userFatigueDrivingAppHomePanel.reveal();
    } else {
        console.log("新建疲劳检测九宫格页面");

        IDEPanels.userFatigueDrivingAppHomePanel = vscode.window.createWebviewPanel(
            'fatigueDrivingAppPage',
            "疲劳检测",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        IDEPanels.userFatigueDrivingAppHomePanel.webview.html = getHtmlContent(context, userFatigueDrivingAppHomeHtmlPath);

        let panel = IDEPanels.userFatigueDrivingAppHomePanel;
        let global = { panel, context };

        IDEPanels.userFatigueDrivingAppHomePanel.webview.onDidReceiveMessage(message => {
            if (userFatigueDrivingHomeMessageHandler[message.command]) {
                userFatigueDrivingHomeMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openFatigueDrivingAppHomePage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userFatigueDrivingAppHomePanel.onDidDispose(
            () => {
                IDEPanels.userFatigueDrivingAppHomePanel = undefined;
            },
            null,
            context.subscriptions
        );
    }
}

// 3. 
const oneUserFatigueDrivingMessageHandler = {

    // 摄像头页面执行“检测摄像头”按钮后，先启动服务进行推流
    startWebsocketServerAndPushCamera(global, message) {
        console.log(message);
        // 1. 启动WebSocket服务器
        startWebSocketServer(global);

        // 2. 启动李畅的疲劳检测脚本，获取摄像头，取帧，特征处理
        startPythonPushCameraData(global);

        global.panel.webview.postMessage({ startWebsocketServerAndPushCameraRet: "success" });
    },

    // 开始疲劳检测, 关闭当前页面，跳转到after页面，模拟刷新，否则画面无法显示
    startFatigueDriving(global, message) {
        console.log(message);
        global.panel.dispose();
        openOneUserFatigueDrivingAppAfterPage(global.context);
    },

    // 结束疲劳检测
    finishFatigueDriving(global, message) {
        console.log(message);
        finishDrivingProcess();
    },

}

// 4. 打开疲劳检测摄像头监视画面的页面
function openOneUserFatigueDrivingAppPage(context) {
    console.log("IDE openOneUserFatigueDrivingAppPage!", IDEPanels.userFatigueDrivingAppPanel);
    if (IDEPanels.userFatigueDrivingAppPanel) {
        console.log("打开疲劳检测页面：", IDEPanels.userFatigueDrivingAppPanel.visible);
        IDEPanels.userFatigueDrivingAppPanel.reveal();
    } else if (IDEPanels.userFatigueDrivingAppAfterPanel) {
        console.log("打开疲劳检测显示页面：", IDEPanels.userFatigueDrivingAppAfterPanel.visible);
        IDEPanels.userFatigueDrivingAppAfterPanel.reveal();
    } else {
        console.log("新建疲劳检测页面");

        IDEPanels.userFatigueDrivingAppPanel = vscode.window.createWebviewPanel(
            'fatigueDrivingAppPage',
            "疲劳检测应用",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        IDEPanels.userFatigueDrivingAppPanel.webview.html = getHtmlContent(context, userFatigueDrivingAppHtmlPath);

        let panel = IDEPanels.userFatigueDrivingAppPanel;
        let global = { panel, context };

        IDEPanels.userFatigueDrivingAppPanel.webview.onDidReceiveMessage(message => {
            if (oneUserFatigueDrivingMessageHandler[message.command]) {
                oneUserFatigueDrivingMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openOneUserFatigueDrivingAppPage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userFatigueDrivingAppPanel.onDidDispose(
            () => {
                IDEPanels.userFatigueDrivingAppPanel = undefined;
                // // 当前页面被手动关闭，如果点击了“检测摄像头”按钮，但是没有执行“疲劳检测”，即after页面没有显示，需要停止websocket和python推流
                // if(IDEPanels.userFatigueDrivingAppAfterPanel == undefined) {
                //     finishDrivingProcess();
                // }
            },
            null,
            context.subscriptions
        );
    }
}


// 5. 显示画面信息交互
const oneUserFatigueDrivingAfterMessageHandler = {
    fatigueDrivingAppAfterConnChip(global, message) {
        console.log(message);
        fatigueDrivingProcess(global);
    },

    // 点击页面“停止检测”按钮，跳转回一开始的疲劳检测页面
    finishFatigueDrivingAfter(global, message) {
        console.log(message);
        finishDrivingProcess();
        // 停止推流后
        sleep(5000);
        global.panel.dispose();
        openOneUserFatigueDrivingAppPage(global.context);
    },
};


// 6. 打开疲劳检测显示画面页面
function openOneUserFatigueDrivingAppAfterPage(context) {
    console.log("IDE openOneUserFatigueDrivingAppAfterPage!", IDEPanels.userFatigueDrivingAppAfterPanel);
    if (IDEPanels.userFatigueDrivingAppAfterPanel) {
        console.log("打开疲劳检测显示页面：", IDEPanels.userFatigueDrivingAppAfterPanel.visible);
        IDEPanels.userFatigueDrivingAppAfterPanel.reveal();
    } else {
        console.log("新建疲劳检测显示页面");

        IDEPanels.userFatigueDrivingAppAfterPanel = vscode.window.createWebviewPanel(
            'fatigueDrivingAppPage',
            "疲劳检测应用",
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        IDEPanels.userFatigueDrivingAppAfterPanel.webview.html = getHtmlContent(context, userFatigueDrivingAppAfterHtmlPath);

        let panel = IDEPanels.userFatigueDrivingAppAfterPanel;
        let global = { panel, context };

        IDEPanels.userFatigueDrivingAppAfterPanel.webview.onDidReceiveMessage(message => {
            if (oneUserFatigueDrivingAfterMessageHandler[message.command]) {
                oneUserFatigueDrivingAfterMessageHandler[message.command](global, message);
            } else {
                vscode.window.showInformationMessage(`未找到名为 ${message.command} 回调方法!`);
            }
        }, undefined, context.subscriptions);

        console.log("IDE openOneUserFatigueDrivingAppAfterPage 2!", global.panel);

        // 面板被关闭后重置
        IDEPanels.userFatigueDrivingAppAfterPanel.onDidDispose(
            () => {
                IDEPanels.userFatigueDrivingAppAfterPanel = undefined;
                // 显示页面关闭后要停止检测
                finishDrivingProcess();
            },
            null,
            context.subscriptions
        );
    }
}

// 1. 启动 WebSocket server, 接收python推送的视频帧数据
function startWebSocketServer(global) {
    console.log("启动 WebSocket server  ");

    // 脚本位置
    let scriptPath = path.join(global.context.extensionPath, "src", "static", "js");
    websocketServerProcess = vscode.window.createTerminal('webServer')
    websocketServerProcess.sendText("cd " + scriptPath);
    websocketServerProcess.sendText("node fatigueDrivingAppServer.js");
}


// 2. 运行视频监测脚本：获取摄像头、特征处理、推送数据
function startPythonPushCameraData(global) {
    console.log("启动 python 推送视频帧  ");

    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "fatigue_detect_compile");

    // let command_str = "python3 " + scriptPath;
    // console.log("执行命令为", command_str);
    // cameraCaptureProcess = exec(command_str, {});
    // cameraCaptureProcess.stdout?.on("data", function (data) {
    //     // log_output_channel.append(data);
    //     // console.log(data);
    //     global.panel.webview.postMessage({ startFatigueDrivingRet: "success" });
    // });
    // cameraCaptureProcess.stderr?.on("data", function (data) {
    //     log_output_channel.append(data);
    //     console.log(data);
    // });
    // cameraCaptureProcess.on("exit", function () {
    //     console.log("websocket server exit!!");
    // });

    // 脚本位置
    cameraCaptureProcess = vscode.window.createTerminal('webServer')
    cameraCaptureProcess.sendText("cd " + scriptPath);
    cameraCaptureProcess.sendText("python3 main.py");

}


// 3. 给上面的python脚本发消息，执行图像编码，生成input.txt和row.txt, 然后发送给芯片
function callPythonEncodeVideoImg() {
    ifNeedEncodeAndChipSendNextFrame = false;
    // 只有请求这个地址 http://127.0.0.1:2345/need_detect    才会对特征编码生成input.txt
    var uri = "http://127.0.0.1:2345/need_detect"
    https.get(uri, function (res) {
        console.log("状态码: " + res.statusCode);
    })
    console.log("detect请求已发送！");
}


// 4. 给芯片发送数据
function sendVideoImgToChip(global) {
    console.log("给芯片发送数据，执行疲劳检测");

    let scriptPath = path.join(global.context.extensionPath, "src", "static", "python", "fatigue_detect_compile", "send_input.py");
    let command_str = "python3 " + scriptPath;
    console.log("执行命令为", command_str);
    let chipCalculateProcess = exec(command_str, {});

    chipCalculateProcess.stdout?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);

        // 解析识别结果的输出
        if (data.indexOf("FATIGUEDRIVING RESULT") !== -1) {
            // 图像识别结果
            let ret = data.split("**")[1];
            console.log("疲劳检测结果：", ret);
            global.panel.webview.postMessage({ chipFatigueDrivingResult: ret }); // 0-不疲劳，1-疲劳
        }
    });
    chipCalculateProcess.stderr?.on("data", function (data) {
        log_output_channel.append(data);
        console.log(data);
    });
    chipCalculateProcess.on("exit", function () {
        console.log("chip calculate finished!!");
        // 执行完一帧图像的识别，接着下一张
        ifNeedEncodeAndChipSendNextFrame = true;
    });
}


// 疲劳检测处理流程
// 参考方案：https://blog.csdn.net/zhuzheqing/article/details/109819702?spm=1001.2014.3001.5501
function fatigueDrivingProcess(global) {

    // 3. 给python发消息，执行编码
    // 4. 每个帧的特征向量进行脉冲编码、打包
    // 5. input数据发送给芯片
    // 6. 接收芯片处理结果

    videoEncodeAndChipSendTimer = setInterval(function encodeAndSendData() {
        console.log("标志值：", ifNeedEncodeAndChipSendNextFrame);
        if (ifNeedEncodeAndChipSendNextFrame == true) {
            console.log("循环");
            callPythonEncodeVideoImg();
            sendVideoImgToChip(global);
        }
    }, 500);

    // 7. 检测到疲劳时前端界面上显示warning告警
}


// 结束检测
function finishDrivingProcess() {
    console.log("结束视频检测！")
    if (websocketServerProcess != undefined) {
        // 杀进程： 实际上exec会创建两个进程，一个是 shell 进程，另个是 shell 命令里的进程，他们的 PID 相差一。
        websocketServerProcess.dispose();
        websocketServerProcess = undefined;
        console.log("websocket process killed！");
    }
    if (cameraCaptureProcess != undefined) {
        cameraCaptureProcess.dispose();
        cameraCaptureProcess = undefined;
        console.log("camera capture process killed! ");
    }
    console.log("取消计时器");
    if (videoEncodeAndChipSendTimer != undefined) {
        clearInterval(videoEncodeAndChipSendTimer);
        videoEncodeAndChipSendTimer = undefined;
        console.log("timer killed！");
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

    // 替换script语句中import from
    html = html.replace(/(import.+?)(from\s+")(.+?)"/g, (m, $1, $2, $3) => {
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
function getAppRuntime(start, end) {
    // let start = global.startTime;
    // let end = global.endTime;
    let timeDiff = end.getTime() - start.getTime();//时间差的毫秒数
    let minutes = Math.floor(timeDiff / (60 * 1000))//计算相差分钟数
    let leave1 = timeDiff % (60 * 1000)      //计算分钟数后剩余的毫秒数
    let seconds = Math.floor(leave1 / 1000) //计算秒数
    let leave2 = leave1 % 1000; // 剩余毫秒数
    let runtime = minutes + "分钟" + seconds + "秒" + leave2 + "毫秒";
    return runtime;
}

// 等待
function sleep(numberMillis) {
    var start = new Date().getTime();
    while (true) {
        if (new Date().getTime() - start > numberMillis) {
            break;
        }
    }
}