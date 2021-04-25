
import * as vscode from "vscode";
import * as path from 'path';

import { AppsProvider } from "./AppsProvider";
import { TaskProvider } from "./TaskProvider";
import { ResProvider } from "./ResProvider";
import { ModelProvider } from "./ModelProvider";
import { UserProvider } from "./UserProvider";


// 第一步：创建单项的节点(item)的类
export class SystemTreeItem extends vscode.TreeItem {

    constructor(
        // readonly 只可读
        public readonly label: string,
        public readonly iconPath: vscode.Uri,
        public children: any[],
        // public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label, children === undefined ? vscode.TreeItemCollapsibleState.None :
            vscode.TreeItemCollapsibleState.Collapsed);
        this.children = children ? children : [];
        // this.contextValue = isRoot ? "TreeViewProviderContext":undefined;
        this.contextValue = label;
    }

    contextValue = 'System Tree View';

}


export class SystemTreeViewProvider implements vscode.TreeDataProvider<SystemTreeItem>{

    private _onDidChangeTreeData: vscode.EventEmitter<SystemTreeItem | undefined | void> = new vscode.EventEmitter<SystemTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SystemTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    public data: any[];
    public providers: any[];

    constructor() {
        this.providers = [];
        let resDataProvider = new ResProvider(vscode.workspace.rootPath);
        let modelDataProvider = new ModelProvider(vscode.workspace.rootPath);
        let appsDataProvider = new AppsProvider(vscode.workspace.rootPath);
        let userDataProvider = new UserProvider(vscode.workspace.rootPath);
        let taskDataProvider = new TaskProvider(vscode.workspace.rootPath);
        this.providers.push(resDataProvider, modelDataProvider, appsDataProvider, userDataProvider, taskDataProvider);

        this.data = [];
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
        console.log(this.data);
        if (element === undefined) {
            return this.data;
        } else {
            return element.children;
        }
    }

    getParent(element?: SystemTreeItem | undefined): import("vscode").ProviderResult<SystemTreeItem> {
        return undefined;
    }

    // 这个静态方法时自己写的，你要写到 extension.ts 也可以
    public static initTreeViewItem(target_view: string): SystemTreeViewProvider {

        // 实例化 TreeViewProvider
        const treeViewProvider = new SystemTreeViewProvider();

        // registerTreeDataProvider：注册树视图
        // 你可以类比 registerCommand(上面注册 Hello World)
        vscode.window.registerTreeDataProvider(target_view, treeViewProvider);
        return treeViewProvider;
    }

    static getIconUriForLabel(name: string): vscode.Uri {
        return vscode.Uri.file(path.join(__filename, "..", "..", "..", "src", "static", "images", name));
    }

    public getAllTreeViews() {
        let resTreeView = new SystemTreeItem("资源视图", SystemTreeViewProvider.getIconUriForLabel("资源视图.png"), this.providers[0].nodes);
        let modelTreeView = new SystemTreeItem("模型视图", SystemTreeViewProvider.getIconUriForLabel("模型视图.png"), this.providers[1].models);
        let appsTreeView = new SystemTreeItem("应用视图", SystemTreeViewProvider.getIconUriForLabel("应用视图.png"), this.providers[2].appKinds);
        let userTreeView = new SystemTreeItem("用户视图", SystemTreeViewProvider.getIconUriForLabel("用户视图.png"), this.providers[3].userAppKinds);
        let tasksTreeView = new SystemTreeItem("任务视图", SystemTreeViewProvider.getIconUriForLabel("任务视图.png"), this.providers[4].tasks);

        this.data.push(resTreeView, modelTreeView, appsTreeView, userTreeView, tasksTreeView);
        console.log("getAllTreeViews", this.data);
    }

    public getOnlyUserTreeView() {
        let userTreeView = new SystemTreeItem("用户视图", SystemTreeViewProvider.getIconUriForLabel("用户视图.png"), this.providers[3].userAppKinds);
        this.data.push(userTreeView);
        console.log("getOnlyUserTreeView", this.data);
    }

    public clearTreeViewData() {
        this.data = [];
        console.log("clearTreeViewData", this.data);
    }
}