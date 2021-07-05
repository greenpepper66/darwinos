import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ImgAppJsonData } from '../DataProvider/ImgAppJsonDataProvider';
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";


export class UserProvider implements vscode.TreeDataProvider<UserAppKind> {
    private _onDidChangeTreeData: vscode.EventEmitter<UserAppKind | undefined | void> = new vscode.EventEmitter<UserAppKind | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UserAppKind | undefined | void> = this._onDidChangeTreeData.event;


    public userAppKinds: UserAppKind[];

    constructor(private workspaceRoot: string) {
        this.userAppKinds = [];
        var imgApp = new UserAppKind(
            "数字图像识别",
            UserProvider.getIconUriForLabel("数字图像识别.png"),
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'extension.gotoOneKindUserAppPage',
                title: '',
                arguments: ["imgApp", 1]
            }
        );
        this.userAppKinds.push(imgApp);
        var voiceApp = new UserAppKind(
            "语音识别",
            UserProvider.getIconUriForLabel("语音识别.png"),
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'extension.gotoOneKindUserAppPage',
                title: '',
                arguments: ["speechApp", 2]
            }
        );
        this.userAppKinds.push(voiceApp);
        var brainApp = new UserAppKind(
            "年龄检测",
            UserProvider.getIconUriForLabel("脑电模拟.png"),
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'extension.gotoOneKindUserAppPage',
                title: '',
                arguments: ["ageJudgeApp", 3]
            }
        );
        this.userAppKinds.push(brainApp);
        var otherApp = new UserAppKind(
            "疲劳检测",
            UserProvider.getIconUriForLabel("其它应用.png"),
            vscode.TreeItemCollapsibleState.None,
            {
                command: 'extension.gotoOneKindUserAppPage',
                title: '',
                arguments: ["videoApp", 4]
            }
        );
        this.userAppKinds.push(otherApp);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UserAppKind): vscode.TreeItem {
        return element;
    }

    getChildren(element?: UserAppKind): Thenable<UserAppKind[]> {
        return Promise.resolve(this.userAppKinds);
    }


    static getIconUriForLabel(name: string): vscode.Uri {
        return vscode.Uri.file(path.join(__filename, "..", "..", "..", "src", "static", "images", name));
    }

    // public getUserAppsList() {
    //     this.userApps = [];
    //     console.log("task list searching ...", __filename);
    //     let resourcePath = path.join(__filename, "..", "..", "..", imgAppsConfigFile);
    //     let data = fs.readFileSync(resourcePath, 'utf-8');
    //     let stringContent = data.toString();//将二进制的数据转换为字符串
    //     let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

    //     for (var i = 0; i < jsonContent.data.length; i++) {
    //         var appId = jsonContent.data[i].id;
    //         var name = jsonContent.data[i].name;
    //         var modelID = jsonContent.data[i].modeFileID;
    //         var nodeID = jsonContent.data[i].modelFileNodeID;
    //         var nodeIP = jsonContent.data[i].modelFileNodeIP;

    //         var app = new UserApp(
    //             name,
    //             vscode.TreeItemCollapsibleState.None,
    //             appId,
    //             modelID,
    //             nodeID,
    //             nodeIP,
    //             {
    //                 command: 'extension.gotoOneUserAppPage',
    //                 title: '',
    //                 arguments: [name, "用户应用"]
    //             }
    //         );
    //         this.userApps.push(app);
    //     }
    // }

}


export class UserAppKind extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconPath: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }

    contextValue = 'user-view Application Kind';
}

export class UserAppItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,

        public readonly appId?: number,
        public readonly modelId?: number,
        public readonly nodeId?: number,
        public readonly nodeIp?: string,

        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'media', 'light', '文件.png'),
        dark: path.join(__filename, '..', '..', 'media', 'dark', 'document.svg')
    };

    contextValue = 'User Application';
}




