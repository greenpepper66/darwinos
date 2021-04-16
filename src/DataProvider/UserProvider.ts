import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ImgAppJsonData } from '../DataProvider/ImgAppJsonDataProvider';
const imgAppsConfigFile = "src/static/cache/imgAppsConfig.json";


export class UserProvider implements vscode.TreeDataProvider<UserApp> {
    private _onDidChangeTreeData: vscode.EventEmitter<UserApp | undefined | void> = new vscode.EventEmitter<UserApp | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UserApp | undefined | void> = this._onDidChangeTreeData.event;


    public userApps: UserApp[];

    constructor(private workspaceRoot: string) {
        this.getUserAppsList();
    }

    refresh(): void {
        this.getUserAppsList();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UserApp): vscode.TreeItem {
        return element;
    }

    getChildren(element?: UserApp): Thenable<UserApp[]> {
        return Promise.resolve(this.userApps);
    }


    static getIconUriForLabel(name: string): vscode.Uri {
        return vscode.Uri.file(path.join(__filename, "..", "..", "..", "media", "light", name));
    }

    public getUserAppsList() {
        this.userApps = [];
        console.log("task list searching ...", __filename);
        let resourcePath = path.join(__filename, "..", "..", "..", imgAppsConfigFile);
        let data = fs.readFileSync(resourcePath, 'utf-8');
        let stringContent = data.toString();//将二进制的数据转换为字符串
        let jsonContent: ImgAppJsonData = JSON.parse(stringContent);//将字符串转换为json对象

        for (var i = 0; i < jsonContent.data.length; i++) {
            var appId = jsonContent.data[i].id;
            var name = jsonContent.data[i].name;
            var modelID = jsonContent.data[i].modeFileID;
            var nodeID = jsonContent.data[i].modelFileNodeID;
            var nodeIP = jsonContent.data[i].modelFileNodeIP;

            var task = new UserApp(
                name,
                vscode.TreeItemCollapsibleState.None,
                appId,
                modelID,
                nodeID,
                nodeIP,
                {
                    command: '',
                    title: '',
                    arguments: []
                }
            );
            this.userApps.push(task);
        }
    }

}


export class UserApp extends vscode.TreeItem {
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




