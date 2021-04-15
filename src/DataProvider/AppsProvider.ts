
import * as vscode from 'vscode';
import * as path from 'path';

/**
 * 应用视图
 */

export class AppKind extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly iconPath: vscode.Uri,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	contextValue = 'Application Kind';

}


export class AppsProvider implements vscode.TreeDataProvider<AppKind> {
	private _onDidChangeTreeData: vscode.EventEmitter<AppKind | undefined | void> = new vscode.EventEmitter<AppKind | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AppKind | undefined | void> = this._onDidChangeTreeData.event;

	public appKinds: AppKind[];

	constructor(private workspaceRoot: string) {
		this.appKinds = [];
		var imgApp = new AppKind(
			"数字图像识别",
			AppsProvider.getIconUriForLabel("数字图像识别.png"),
			vscode.TreeItemCollapsibleState.None,
			{
				command: 'extension.gotoAppPage',
				title: '',
				arguments: ["imgApp", 1]
			}
		);
		this.appKinds.push(imgApp);
		var voiceApp = new AppKind(
			"语音识别",
			AppsProvider.getIconUriForLabel("语音识别.png"),
			vscode.TreeItemCollapsibleState.None,
			{
				command: 'extension.gotoAppPage',
				title: '',
				arguments: ["voiceApp", 2]
			}
		);
		this.appKinds.push(voiceApp);
		var brainApp = new AppKind(
			"脑电模拟",
			AppsProvider.getIconUriForLabel("脑电模拟.png"),
			vscode.TreeItemCollapsibleState.None,
			{
				command: 'extension.gotoAppPage',
				title: '',
				arguments: ["brainApp", 3]
			}
		);
		this.appKinds.push(brainApp);
		var otherApp = new AppKind(
			"其它应用",
			AppsProvider.getIconUriForLabel("其它应用.png"),
			vscode.TreeItemCollapsibleState.None,
			{
				command: 'extension.gotoAppPage',
				title: '',
				arguments: ["otherApp", 4]
			}
		);
		this.appKinds.push(otherApp);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AppKind): vscode.TreeItem {
		return element;
	}

	getChildren(element?: AppKind): Thenable<AppKind[]> {
		return Promise.resolve(this.appKinds);
	}

		// __filename：当前文件的路径
	// 重点讲解 Uri.file(join(__filename,'..', '..') 算是一种固定写法
	// Uri.file(join(__filename,'..','assert', ITEM_ICON_MAP.get(label)+''));   写成这样图标出不来
	// 所以小伙伴们就以下面这种写法编写
	static getIconUriForLabel(name: string): vscode.Uri {
		return vscode.Uri.file(path.join(__filename, "..", "..", "..", "media", "light", name));
	}

}









// // 创建每一项 label 对应的图片名称
// // 其实就是一个Map集合，用 ts 的写法
// const ITEM_ICON_MAP = new Map<string, string>([
//     ['pig1', 'pig1.svg'],
//     ['pig2', 'pig2.svg'],
//     ['pig3', 'pig3.svg']
// ]);


// // 第一步：创建单项的节点(item)的类
// export class TreeItemNode extends TreeItem {

//     constructor(
//         // readonly 只可读
//         public readonly label: string,
//         public readonly collapsibleState: TreeItemCollapsibleState,
//     ){
//         super(label, collapsibleState);
//     }

//     // command: 为每项添加点击事件的命令
//     command = {
//         title: this.label,          // 标题
//         command: 'itemClick',       // 命令 ID
//         tooltip: this.label,        // 鼠标覆盖时的小小提示框
//         arguments: [                // 向 registerCommand 传递的参数。
//             this.label,             // 目前这里我们只传递一个 label
//         ]
//     }

//     // iconPath： 为该项的图标因为我们是通过上面的 Map 获取的，所以我额外写了一个方法，放在下面
//     iconPath = TreeItemNode.getIconUriForLabel(this.label);

//     // __filename：当前文件的路径
//     // 重点讲解 Uri.file(join(__filename,'..', '..') 算是一种固定写法
//     // Uri.file(join(__filename,'..','assert', ITEM_ICON_MAP.get(label)+''));   写成这样图标出不来
//     // 所以小伙伴们就以下面这种写法编写
//     static getIconUriForLabel(label: string):Uri {
//         return Uri.file(join(__filename,'..', '..' ,'src' ,'assert', ITEM_ICON_MAP.get(label)+''));
//     }
// }


// export class TreeViewProvider implements TreeDataProvider<TreeItemNode>{
//     // 自动弹出的可以暂不理会
//     onDidChangeTreeData?: import("vscode").Event<TreeItemNode | null | undefined> | undefined;    

//     // 自动弹出
//     // 获取树视图中的每一项 item,所以要返回 element
//     getTreeItem(element: TreeItemNode): TreeItem | Thenable<TreeItem> {
//         return element;
//     }

//     // 自动弹出，但是我们要对内容做修改
//     // 给每一项都创建一个 TreeItemNode
//     getChildren(element?: TreeItemNode | undefined): import("vscode").ProviderResult<TreeItemNode[]> {

//         return ['pig1','pig2','pig3'].map(

//             item => new TreeItemNode(
//                 item as string,
//                 TreeItemCollapsibleState.None as TreeItemCollapsibleState,
//             )
//         )
//     }

//     // 这个静态方法时自己写的，你要写到 extension.ts 也可以
//     public static initTreeViewItem(){

//         // 实例化 TreeViewProvider
//         const treeViewProvider = new TreeViewProvider();

//         // registerTreeDataProvider：注册树视图
//         // 你可以类比 registerCommand(上面注册 Hello World)
//         window.registerTreeDataProvider('treeView-item',treeViewProvider);
//     }
// }
