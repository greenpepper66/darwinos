
import * as vscode from "vscode";
import * as path from 'path';

import { AppsProvider } from "./AppsProvider";


// 第一步：创建单项的节点(item)的类
export class SystemTreeItem extends vscode.TreeItem {

    constructor(
        // readonly 只可读
        public readonly label: string,
        public children: any[],
        // public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label);
    }

    iconPath = path.join(__filename, '..', 'resources', 'imgs', 'light', '类脑计算机.png');

    contextValue = 'System Tree View';

}


export class SystemTreeViewProvider implements vscode.TreeDataProvider<SystemTreeItem>{

    private _onDidChangeTreeData: vscode.EventEmitter<SystemTreeItem | undefined | void> = new vscode.EventEmitter<SystemTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SystemTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    data: any[];

    constructor() {
        this.data = [];
        let AppsDataProvider = new AppsProvider(vscode.workspace.rootPath);
        console.log("TTTTTT", AppsDataProvider.appKinds);
        this.data = [new SystemTreeItem("类脑计算机", AppsDataProvider.appKinds)];
        console.log("TTTTTT", this.data);
    };



    refresh(): void {
        this._onDidChangeTreeData.fire();
    }


    // 自动弹出
    // 获取树视图中的每一项 item,所以要返回 element
    getTreeItem(element: SystemTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    // 自动弹出，但是我们要对内容做修改
    // 给每一项都创建一个 TreeItemNode
    getChildren(element?: SystemTreeItem | undefined): import("vscode").ProviderResult<SystemTreeItem[]> {
        return this.data;
    }

    // 这个静态方法时自己写的，你要写到 extension.ts 也可以
    public static initTreeViewItem() {

        // 实例化 TreeViewProvider
        const systemTreeViewProvider = new SystemTreeViewProvider();

        // registerTreeDataProvider：注册树视图
        // 你可以类比 registerCommand(上面注册 Hello World)
        vscode.window.registerTreeDataProvider('system_view', systemTreeViewProvider);
    }
}