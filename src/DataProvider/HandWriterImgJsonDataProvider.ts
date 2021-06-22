import * as path from 'path';
import * as fs from 'fs';


const handWriterInfoFile = "src/static/cache/handWriterImgData.json";

/**
 * ******************************************************************************************************
 * JSON文件处理
 * 手写板图像数据类
 * ******************************************************************************************************
 */

// Json文件类
export class HandWriterImgJsonData {
    public data: any[];
    public total: number;
}

// 用户信息类
export class HandWriterImg {
    public id?: number;              // 应用ID
    public base64Data?: string;      // base64图像
    public encodeSpikes?: [];        // 脉冲编码数据
    public outputSpikes?: [];        // 输出编码数据
    public regResult?: number;       // 识别结果

    constructor(id: number) {  // 构造函数 实例化类的时候触发的方法

    }
}

//1. 增：新增一个用户， 最多保存20条
export function addOneHandWriterData(context, info) {
    console.log("hand-Writer json adding  ...");
    let resourcePath = path.join(context.extensionPath, handWriterInfoFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();//将二进制的数据转换为字符串
        var jsonContent: HandWriterImgJsonData = JSON.parse(stringContent);//将字符串转换为json对象

        jsonContent.data.push(info);//将传来的对象push进数组对象中
        jsonContent.total = jsonContent.data.length;//定义一下总条数，为以后的分页打基础
        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
        fs.writeFileSync(resourcePath, str);
        console.log('----------新增手写板数据成功-------------');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

//2. 更新base64Data
export function updataHandWriterBase64Data(context, bs64Img) {
    console.log("hand-wieter json update base64 data...");
    let resourcePath = path.join(context.extensionPath, handWriterInfoFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();
        var jsonContent: HandWriterImgJsonData = JSON.parse(stringContent);

        jsonContent.data[0].base64Data = bs64Img;

        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);
        fs.writeFileSync(resourcePath, str);
        console.log('----------更新base64Data成功-------------');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }
}

// 3. 查
export function getOnlyHandWriterData(context) {
    console.log("hand-writer get json data ...");
    let resourcePath = path.join(context.extensionPath, handWriterInfoFile);
    let data = fs.readFileSync(resourcePath, 'utf-8');
    let stringContent = data.toString();
    let jsonContent: HandWriterImgJsonData = JSON.parse(stringContent);

    return jsonContent.data[0];
}

// 4. 更新应用id
export function updataHandWriterAppID(context, appId) {
    console.log("hand-wieter json update id...");
    let resourcePath = path.join(context.extensionPath, handWriterInfoFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();
        var jsonContent: HandWriterImgJsonData = JSON.parse(stringContent);

        jsonContent.data[0].id = appId;

        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);
        fs.writeFileSync(resourcePath, str);
        console.log('----------更新appId成功-------------');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }
}