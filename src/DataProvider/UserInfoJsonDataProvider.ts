import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { timeStamp } from 'console';


const userInfoFile = "src/static/cache/userInfo.json";

/**
 * ******************************************************************************************************
 * JSON文件处理
 * 本地保存用户信息
 * ******************************************************************************************************
 */

// Json文件类
export class UserInfoJsonData {
    public data: any[];
    public total: number;
}

// 用户信息类
export class UserInfoData {
    public id?: number;              // 用户ID
    public name?: string;            // 用户名
    public status?: number;          // 用户的状态： 0-未登录， 1-已登录
    public password?: string;        // 密码
    public userRole?: number;        // 用户角色：0-系统管理员 1-开发者 2-普通用户

    constructor(id: number, name: string, password: string) {  // 构造函数 实例化类的时候触发的方法
        this.id = id;
        this.name = name;
        this.password = password;
    }
}

//1. 增：新增一个用户， 最多保存20条
export function addOneUser(context, userInfo) {
    console.log("json writing to add a user ...");
    let resourcePath = path.join(context.extensionPath, userInfoFile);
    try {
        let data = fs.readFileSync(resourcePath, 'utf-8');
        var stringContent = data.toString();//将二进制的数据转换为字符串
        var jsonContent: UserInfoJsonData = JSON.parse(stringContent);//将字符串转换为json对象

        // 最多保存20条
        if (jsonContent.total == 20) {
            jsonContent.data.splice(0, 1);
        }

        jsonContent.data.push(userInfo);//将传来的对象push进数组对象中
        jsonContent.total = jsonContent.data.length;//定义一下总条数，为以后的分页打基础
        console.log(jsonContent);
        var str = JSON.stringify(jsonContent);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
        fs.writeFileSync(resourcePath, str);
        console.log('----------新增用户成功-------------');
        return "success";
    } catch (error) {
        console.error(error);
        return "error";
    }
}


// 5. 查一个： 根据用户名字
export function searchUserInfoByName(context, name) {
    console.log("json searching user by name...", name);
    let resourcePath = path.join(context.extensionPath, userInfoFile);
    let data = fs.readFileSync(resourcePath, 'utf-8');
    let stringContent = data.toString();//将二进制的数据转换为字符串
    let jsonContent: UserInfoJsonData = JSON.parse(stringContent);//将字符串转换为json对象

    for (var i = 0; i < jsonContent.data.length; i++) {
        if (name == jsonContent.data[i].name) {
            return jsonContent.data[i];
        }
    }
    return "none";
}


