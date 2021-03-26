import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";

/**
 * ******************************************************************************************************
 * JSON文件处理
 * 本地保存新建应用配置信息
 * 参考 https://blog.csdn.net/zhaoxiang66/article/details/79894209
 * ******************************************************************************************************
 */

// Json文件类
export class ImgAppJsonData {
    public data: any[];
    public total: number;
}

// 应用的配置信息类
export class ImgAppConfigData {
    public id: number;              // 应用ID
    public name: string;            // 应用名称
    public status: number;          // 应用的状态： 0-应用， 1-任务
    public imgSrcKind: string;      // 图像源类型：本地图像或远程图像（取值：localImg 或 remoteImg）
    public imgSrcDir: string;       // 图像源-本地地址
    public imgSrcRemoteIP: string;  // 图像源-远程ip（暂时不用）
    public imgNum: number;          // 图像数量
    public modeFileID: number;      // 模型文件ID
    public modelFileName: string;   // 模型文件名称
    public modelFileNodeID: number; // 模型所在节点ID
    public modelFileNodeIP: string; // 模型所在节点IP
    public encodeMethodID: number;  // 编码方法ID（0： 默认方法，当前就一个）
    public createTime: string;      // 应用创建时间
    public encodeConfigFile: string; // 编码和运行任务所需的配置文件 - 打包成一个文件packed_bin_files.dat
    public outputDir: string;       // 编码过程中间输出文件所在目录

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
export function writeJson(context, imgAppConfig) {
    console.log("json writing...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    //现将json文件读出来
    // fs.readFile(resourcePath, function (err, data) {
    //     if (err) {
    //         console.error(err);
    //         return console.error(err);
    //     }
    //     var stringContent = data.toString();//将二进制的数据转换为字符串
    //     var jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

    //     // 最多保存20条
    //     if (jsonContent.total == 20) {
    //         jsonContent.data.splice(0, 1);
    //     }

    //     jsonContent.data.push(imgAppConfig);//将传来的对象push进数组对象中
    //     jsonContent.total = jsonContent.data.length;//定义一下总条数，为以后的分页打基础
    //     console.log(jsonContent);
    //     var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
    //     fs.writeFile(resourcePath, str, function (err) {
    //         if (err) {
    //             console.error(err);
    //             return console.error(err);
    //         }
    //         console.log('----------新增成功-------------');
    //         // 更新任务导航栏
    //         vscode.commands.executeCommand('task_view.refreshEntry');
    //         return console.log("save app config success");
    //     })
    // })

    // 改成同步方式 因为要把结果及时返回给前端
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
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
        fs.writeFileSync(resourcePath, str);
        console.log('----------新增成功-------------');
        // 更新任务导航栏
        // vscode.commands.executeCommand('task_view.refreshEntry');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }

}

// 2. 删：根据id删除json文件中的选项
export function deleteJson(context, id) {
    console.log("json deleting...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);


    try {
        
    } catch (error) {
        
    }


    
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
            // 更新任务导航栏
            vscode.commands.executeCommand('task_view.refreshEntry');
            return console.log("delete app config success");
        })
    })
}

// 3. 查所有：同步处理
export function searchAllJson(context) {
    console.log("json searching all...");
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

// 4. 查一个：根据应用id
export function searchImgAppByID(context, id) {
    console.log("json searching ...", id);
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);

    let data = fs.readFileSync(resourcePath, 'utf-8');

    let stringContent = data.toString();//将二进制的数据转换为字符串
    let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

    for (var i = 0; i < jsonContent.data.length; i++) {
        if (id == jsonContent.data[i].id) {
            return jsonContent.data[i];
        }
    }
    return "none";
}

// 5. 查一个： 根据应用名字
export function searchImgAppByName(context, name) {
    console.log("json searching ...", name);
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    let data = fs.readFileSync(resourcePath, 'utf-8');
    let stringContent = data.toString();//将二进制的数据转换为字符串
    let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

    for (var i = 0; i < jsonContent.data.length; i++) {
        if (name == jsonContent.data[i].name) {
            return jsonContent.data[i];
        }
    }
    return "none";
}

// 6. 更新一条应用的状态，应用生成一条任务： 根据id  将默认的状态0变为1
export function updateImgAppStatus(context, id) {
    console.log("json update...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();
        var jsonContent: ImgAppJsonData = JSON.parse(stringContent);

        for (var i = 0; i < jsonContent.data.length; i++) {
            if (id == jsonContent.data[i].id) {
                jsonContent.data[i].status = 1;  // 将状态置为1
            }
        }
        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
        fs.writeFileSync(resourcePath, str);
        console.log('----------更新成功-------------');
        // 更新任务导航栏
        vscode.commands.executeCommand('task_view.refreshEntry');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

// 7. 检查一条应用是否存在，匹配各个字段是否相同
// message = [appName, imgSrcKind, imgDir, modelFileID, encodeMethodID, encodeConfDir, outputDir]
export function checkImgAppExist(context, message) {
    // 先查名字 名字不存在 肯定没保存
    // 名字存在 检查其他所有项目是否相同
    // 所有项目都相同 表示已经保存了 跳转到任务页面
    // 有的项目不同 表示是同名的不同应用 报错重名
    console.log("json check exist...");
    let resourcePath = path.join(context.extensionPath, imgAppsConfigFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();
        var jsonContent: ImgAppJsonData = JSON.parse(stringContent);

        for (var i = 0; i < jsonContent.data.length; i++) {
            if (message.text[0] == jsonContent.data[i].name) {
                // 分割模型信息
                let modelInfo = message.text[3].split(" - ");
                if (modelInfo.length != 4) {
                    return "error: model info error!";
                }

                if (message.text[1] == jsonContent.data[i].imgSrcKind && message.text[2] == jsonContent.data[i].imgSrcDir
                    && modelInfo[0] == jsonContent.data[i].modeFileID && modelInfo[1] == jsonContent.data[i].modelFileName
                    && modelInfo[2] == jsonContent.data[i].modelFileNodeID && modelInfo[3] == jsonContent.data[i].modelFileNodeIP
                    && message.text[4] == jsonContent.data[i].encodeMethodID && message.text[5] == jsonContent.data[i].encodeConfigFile
                    && message.text[6] == jsonContent.data[i].outputDir) {
                        return "exist: app already saved!"
                } else {
                    return "error: the app name is repeated, please uodate the information and save it first!"
                }
            } 
        }
        console.log('----------检查成功-------------');
        return "error: the app is not saved, please save it first!";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

