import * as vscode from 'vscode';
import * as path from 'path';


export class UserProvider implements vscode.TreeDataProvider<UserAppKind> {
    private _onDidChangeTreeData: vscode.EventEmitter<UserAppKind | undefined | void> = new vscode.EventEmitter<UserAppKind | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<UserAppKind | undefined | void> = this._onDidChangeTreeData.event;


    public userApps: UserAppKind[];

    constructor(private workspaceRoot: string) {
        this.getUserAppKinds();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: UserAppKind): vscode.TreeItem {
        return element;
    }

    getChildren(element?: UserAppKind): Thenable<UserAppKind[]> {
        if (element) {
            return Promise.resolve(this.getActualApps(element));
        }
        else {
            return Promise.resolve(this.userApps);
        }
    }

    private getActualApps(node: UserAppKind): UserActualApp[] {
        var _apps_list = node.actualApps;
        var app_list = [];
        for (let i = 0; i < _apps_list.length; i++) {
            app_list.push(new UserActualApp(
                _apps_list[i],
                UserProvider.getIconUriForLabel("数字图像识别.png"),
                vscode.TreeItemCollapsibleState.None,
                {
                    command: '',
                    title: '',
                    arguments: []
                }
            ))
        }
        return app_list;
    }

    private getUserAppKinds() {
        this.userApps = [];

        var localApp = new UserAppKind(
            "本地应用",
            UserProvider.getIconUriForLabel("其它应用.png"),
            vscode.TreeItemCollapsibleState.Collapsed,  //vscode.TreeItemCollapsibleState.Collapsed可折叠可展开.
            ["手写体数字图像识别", "汽车图像目标检测", "其它应用"],
            {
                command: '',
                title: '',
                arguments: []
            }
        );
        this.userApps.push(localApp);
        var remoteApp = new UserAppKind(
            "远程应用",
            UserProvider.getIconUriForLabel("其它应用.png"),
            vscode.TreeItemCollapsibleState.Collapsed,  //vscode.TreeItemCollapsibleState.Collapsed可折叠可展开.
            ["摄像头应用", "其它应用"],
            {
                command: '',
                title: '',
                arguments: []
            }
        );
        this.userApps.push(remoteApp);
    }

    static getIconUriForLabel(name: string): vscode.Uri {
        return vscode.Uri.file(path.join(__filename, "..", "..", "..", "media", "light", name));
    }

}


export class UserAppKind extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconPath: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly actualApps?: string[],
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
    contextValue = 'User Application Kind';
}


export class UserActualApp extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly iconPath: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
    contextValue = 'user Actual Application';
}


