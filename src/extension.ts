// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { EmptyDataProvider, EmptyData } from "./DataProvider/EmptyDataProvider";
import { changeIndexHtmlCss, uploadModelPageProvideByPort, modelHomePageProvideByPort, resourceHomePageProvideByPort, nodePageProvideByPort, chipPageProvideByPort } from "./PageProvider";
import { startHttpServer, startHandWriterServer } from './os/server';
import { AppsHomePageProvide, openCertainAppHomePage } from "./pages/AppsHome";
import { openImgAppRunTaskPage, openImgAppTasksPage } from "./pages/ImgAppHome";
import { OpenLoginPage } from "./pages/UserLogin";
import { UserInfoData } from "./DataProvider/UserInfoJsonDataProvider";
import { SystemTreeViewProvider, SystemTreeItem } from "./DataProvider/SystemProvider";
import { UserAppHomePageProvide, openOneKindUserAppPage } from './pages/UserAppHome';

const PORT = 5001;

// 保存用户登录信息
export module LoginInfo {
	export let test: boolean;
	export let currentUser: UserInfoData;
}

// 插件本地server，监听端口5002
export module LocalHttpServer {
	export let server: any;
}

// 工具的tab页面，以下panel要保持唯一性
export module IDEPanels {
	export let loginPanel: vscode.WebviewPanel | undefined = undefined;
	// 模型视图
	export let uploadModelPanel: vscode.WebviewPanel | undefined = undefined;
	export let modelHomePanel: vscode.WebviewPanel | undefined = undefined;
	// 资源视图
	export let resourceHomePanel: vscode.WebviewPanel | undefined = undefined;
	export let nodePagePanelsMap: Map<string, vscode.WebviewPanel> | undefined = new Map();  // map类型, key值为panel的title
	export let chipPagePanelsMap: Map<string, vscode.WebviewPanel> | undefined = new Map();
	// 应用视图
	export let appHomePanel: vscode.WebviewPanel | undefined = undefined;
	export let imgAppListPanel: vscode.WebviewPanel | undefined = undefined;
	export let newImgAppPanel: vscode.WebviewPanel | undefined = undefined;  // 手写体应用
	export let imgAppInfoPagePanelsMap: Map<number, vscode.WebviewPanel> | undefined = new Map();  // key值为应用的id
	export let newFatigueDrivingAppPanel: vscode.WebviewPanel | undefined = undefined;  // 疲劳检测应用 
	export let fatigueDrivingAppListPanel: vscode.WebviewPanel | undefined = undefined; // 疲劳检测应用列表页
	export let fatigueDrivingAppInfoPagePanelsMap: Map<number, vscode.WebviewPanel> | undefined = new Map();  // key值为应用的id
	// 用户视图
	export let userHomePanel: vscode.WebviewPanel | undefined = undefined;
	export let userImgAppSquarePanel: vscode.WebviewPanel | undefined = undefined;
	export let userImgAppRunPagePanelsMap: Map<number, vscode.WebviewPanel> | undefined = new Map();  // key值为应用的id
	export let userFatigueDrivingAppHomePanel: vscode.WebviewPanel | undefined = undefined;  // 疲劳检测首页九宫格页面
	export let userFatigueDrivingAppPanel: vscode.WebviewPanel | undefined = undefined;      // 疲劳检测应用运行页面
	export let userFatigueDrivingAppAfterPanel: vscode.WebviewPanel | undefined = undefined;      // 疲劳检测应用运行页面
	// 任务视图
	export let taskHomeImgAppListPanel: vscode.WebviewPanel | undefined = undefined;
	export let taskInfoImgAppPagePanelsMap: Map<number, vscode.WebviewPanel> | undefined = new Map();  // key值为任务的id


}

// var commandsRegistry = new Map<string, vscode.Disposable>();
// var resourceViewRefreshCommand: vscode.Disposable | undefined = undefined;


// 导航栏
var welcomeTreeView: vscode.TreeView<EmptyData> | undefined = undefined;	  // 登录导航栏
var systemDataProvider: SystemTreeViewProvider | undefined = undefined;		  // 导航栏数据
var systemTreeView: vscode.TreeView<SystemTreeItem> | undefined = undefined;  // 用户登录后导航栏

// 命令注册
var resourceViewOverviewBtnCommand: vscode.Disposable | undefined = undefined; 	// 资源视图Overview按钮
var resourceViewRefreshBtnCommand: vscode.Disposable | undefined = undefined; 	// 资源视图refresh按钮
var resourceViewOpenNodeHttpPageDisposable: vscode.Disposable | undefined = undefined; 	// 导航栏点击节点名称打开节点详情页面
var resourceViewOpenChipHttpPageDisposable: vscode.Disposable | undefined = undefined; 	// 导航栏点击芯片名称打开芯片详情页面
var modelViewOverviewBtnCommand: vscode.Disposable | undefined = undefined; 	// 模型视图Overview按钮
var modelViewRefreshBtnCommand: vscode.Disposable | undefined = undefined; 	// 模型视图refresh按钮
var appViewOverviewBtnCommand: vscode.Disposable | undefined = undefined; 	// 应用视图Overview按钮
var appViewRefreshBtnCommand: vscode.Disposable | undefined = undefined; 	// 应用视图refresh按钮
var appViewGotoAppPageDisposable: vscode.Disposable | undefined = undefined; 	// 应用视图点击子导航栏打开某一类应用首页
var userViewOverviewBtnCommand: vscode.Disposable | undefined = undefined; 	// 用户视图Overview按钮
var userViewRefreshBtnCommand: vscode.Disposable | undefined = undefined; 	// 用户视图refresh按钮
var userViewGotoAppPageDisposable: vscode.Disposable | undefined = undefined; 	// 用户视图点击子导航栏打开某一类应用首页
var taskViewOverviewBtnCommand: vscode.Disposable | undefined = undefined; 	// 用户视图Overview按钮
var taskViewRefreshBtnCommand: vscode.Disposable | undefined = undefined; 	// 用户视图refresh按钮
var taskViewOpenTaskHttpPageDisposable: vscode.Disposable | undefined = undefined; 	// 用户视图点击子导航栏打开某一类应用首页
var logoutCloseSystemTreeViewDisposable: vscode.Disposable | undefined = undefined; 	// 用户退出后切换导航栏，只显示登录的导航栏

// 资源视图和模型视图导航栏定时更新计时器
var resourceUpdateTimer: NodeJS.Timeout | undefined = undefined;



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	vscode.commands.executeCommand("workbench.action.closeActiveEditor");
	console.log('Congratulations, your extension "darwinos" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('darwinos.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from darwinos!');
	})
	);

	// 根据vscode主题颜色 修改index.html
	let _vscodeThemeKind = vscode.window.activeColorTheme.kind;
	changeIndexHtmlCss(context, _vscodeThemeKind);

	//启动一个terminal，运行网页服务端
	const resourcePath = path.join(context.extensionPath, 'src/resources');
	const terminal1 = vscode.window.createTerminal('webServer')
	terminal1.sendText("cd " + resourcePath);
	terminal1.sendText("serve -s dist -l 5001");

	// 启动手写板网页服务
	startHandWriterServer(context);

	// 自动弹出登录页面导航栏
	openLoginTreeView(context);

	// 创建登录后系统导航栏
	systemDataProvider = SystemTreeViewProvider.initTreeViewItem("system-treeView");
	//启动httpserver，接收来自web页面的数据
	startHttpServer(systemDataProvider.providers[0], systemDataProvider.providers[1], context);
	sleep(3000);
	// 注册命令
	registAllCommands(context);

}






/**
 * *******************************************************************************************************************
 * 弹出登录导航栏
 * @param context 
 * *******************************************************************************************************************
 */
export function openLoginTreeView(context: vscode.ExtensionContext) {
	let welcomeDataProvider = new EmptyDataProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('login-treeView', welcomeDataProvider);
	welcomeTreeView = vscode.window.createTreeView('login-treeView', { treeDataProvider: welcomeDataProvider });
	welcomeTreeView.reveal(null);
	welcomeTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible) {
			// 打开登录页
			OpenLoginPage(context);
		}
	});
}


/**
 * *******************************************************************************************************************
 * 只打开用户视图： 面向普通用户
 * @param context 
 * *******************************************************************************************************************
 */
export function openOnlyUserTreeView(context: vscode.ExtensionContext) {
	// 打开导航栏
	systemDataProvider.getOnlyUserTreeView();
	systemTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: systemDataProvider });

	systemTreeView.reveal(null);
	systemTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible && LoginInfo.currentUser.name != '' && LoginInfo.currentUser.userRole == 2) {
			UserAppHomePageProvide(context);
		}
	});
}


/**
 * *******************************************************************************************************************
 * 打开全部导航栏和页面：面向系统管理员和开发者
 * @param context 
 * *******************************************************************************************************************
 */
export function openAllTreeViews(context: vscode.ExtensionContext) {
	// 打开所有导航栏
	systemDataProvider.getAllTreeViews();
	systemTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: systemDataProvider });
	systemTreeView.reveal(null);
	systemTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible && LoginInfo.currentUser.name != '' && (LoginInfo.currentUser.userRole == 0 || LoginInfo.currentUser.userRole == 1)) {
			console.log("打开Home页面");
			//打开home页
			resourceHomePageProvideByPort(context);
		} else {
			console.log("导航栏无数据");  // 隐藏导航栏的时候执行
		}
	});

	//上传模型视图
	var uploadModelDataProvider = new EmptyDataProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('upload_model_view', uploadModelDataProvider);
	var uploadModelTreeView = vscode.window.createTreeView('upload_model_view', { treeDataProvider: uploadModelDataProvider });
	uploadModelTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible && LoginInfo.currentUser.name != '' && (LoginInfo.currentUser.userRole == 0 || LoginInfo.currentUser.userRole == 1)) {
			console.log("打开upload页面");
			uploadModelPageProvideByPort(context);
		}
	});
}


// 注册命令
export function registAllCommands(context: vscode.ExtensionContext) {
	vscode.commands.getCommands(true).then(allCommands => {
		console.log('获取所有命令：', allCommands.length);

		// 1. 资源视图
		if (allCommands.indexOf("resource_view.resOverview") == -1) {
			resourceViewOverviewBtnCommand = vscode.commands.registerCommand('resource_view.resOverview', () => {
				resourceHomePageProvideByPort(context);
			});
			context.subscriptions.push(resourceViewOverviewBtnCommand);
		}
		if (allCommands.indexOf("resource_view.refreshEntry") == -1) {
			resourceViewRefreshBtnCommand = vscode.commands.registerCommand('resource_view.refreshEntry', () => {
				if (systemDataProvider.data[0] != null) {
					systemDataProvider.providers[0].refresh();  // 更新
					systemDataProvider.data[0].children = systemDataProvider.providers[0].nodes;  // 更新导航栏子列表
					systemDataProvider.refresh(); // 更新导航栏
				}
			});
			context.subscriptions.push(resourceViewRefreshBtnCommand);
		}
		if (allCommands.indexOf("extension.openNodeHttpPage") == -1) {
			// 节点详情页面
			resourceViewOpenNodeHttpPageDisposable = vscode.commands.registerCommand('extension.openNodeHttpPage', (name, port, route) => {
				nodePageProvideByPort(context, name, port, route);
			});
			context.subscriptions.push(resourceViewOpenNodeHttpPageDisposable);
		}
		if (allCommands.indexOf("extension.openChipHttpPage") == -1) {
			// 芯片详情页面
			resourceViewOpenChipHttpPageDisposable = vscode.commands.registerCommand('extension.openChipHttpPage', (name, port, route) => {
				chipPageProvideByPort(context, name, port, route);
			});
			context.subscriptions.push(resourceViewOpenChipHttpPageDisposable);
		}

		// 2. 模型视图
		if (allCommands.indexOf("model_view.modelOverview") == -1) {
			modelViewOverviewBtnCommand = vscode.commands.registerCommand('model_view.modelOverview', () => {
				modelHomePageProvideByPort(context);
			});
			context.subscriptions.push(modelViewOverviewBtnCommand);
		}
		if (allCommands.indexOf("model_view.refreshEntry") == -1) {
			modelViewRefreshBtnCommand = vscode.commands.registerCommand('model_view.refreshEntry', () => {
				if (systemDataProvider.data[1] != null) {
					systemDataProvider.providers[1].refresh();
					systemDataProvider.data[1].children = systemDataProvider.providers[1].models;  // 更新导航栏子列表
					systemDataProvider.refresh(); // 更新导航栏
				}
			});
			context.subscriptions.push(modelViewRefreshBtnCommand);
		}

		// 3. 应用视图
		if (allCommands.indexOf("apps_view.appsOverview") == -1) {
			appViewOverviewBtnCommand = vscode.commands.registerCommand('apps_view.appsOverview', () => {
				AppsHomePageProvide(context);  // overview按钮打开应用视图首页
			});
			context.subscriptions.push(appViewOverviewBtnCommand);
		}
		if (allCommands.indexOf("apps_view.refreshEntry") == -1) {
			appViewRefreshBtnCommand = vscode.commands.registerCommand('apps_view.refreshEntry', () => {
				// systemDataProvider.providers[2].refresh();
				console.log("管理员用户：刷新按钮：apps_view.refreshEntry")
			});
			context.subscriptions.push(appViewRefreshBtnCommand);
		}
		if (allCommands.indexOf("extension.gotoAppPage") == -1) {
			// 应用视图导航栏子选项单击命令
			appViewGotoAppPageDisposable = vscode.commands.registerCommand('extension.gotoAppPage', (name, num) => {
				openCertainAppHomePage(context, num);
			});
			context.subscriptions.push(appViewGotoAppPageDisposable);
		}

		// 4. 用户视图
		if (allCommands.indexOf("user_view.appsOverview") == -1) {
			userViewOverviewBtnCommand = vscode.commands.registerCommand('user_view.appsOverview', () => {
				UserAppHomePageProvide(context);
			});
			context.subscriptions.push(userViewOverviewBtnCommand);
		}
		if (allCommands.indexOf("user_view.refreshEntry") == -1) {
			userViewRefreshBtnCommand = vscode.commands.registerCommand('user_view.refreshEntry', () => {
				// systemDataProvider.providers[3].refresh();
				console.log("管理员用户：刷新按钮：user_view.refreshEntry")
			});
			context.subscriptions.push(userViewRefreshBtnCommand);
		}
		if (allCommands.indexOf("extension.gotoOneKindUserAppPage") == -1) {
			// 用户视图导航栏子选项单击命令
			userViewGotoAppPageDisposable = vscode.commands.registerCommand('extension.gotoOneKindUserAppPage', (name, num) => {
				openOneKindUserAppPage(context, num);
			});
			context.subscriptions.push(userViewGotoAppPageDisposable);
		}

		// 5. 任务视图
		if (allCommands.indexOf("task_view.taskOverview") == -1) {
			taskViewOverviewBtnCommand = vscode.commands.registerCommand('task_view.taskOverview', () => {
				openImgAppTasksPage(context);
			});
			context.subscriptions.push(taskViewOverviewBtnCommand);
		}
		if (allCommands.indexOf("task_view.refreshEntry") == -1) {
			taskViewRefreshBtnCommand = vscode.commands.registerCommand('task_view.refreshEntry', () => {
				systemDataProvider.providers[4].refresh();  // 更新tasks
				systemDataProvider.data[4].children = systemDataProvider.providers[4].tasks;  // 更新导航栏子列表
				systemDataProvider.refresh(); // 更新导航栏
			});
			context.subscriptions.push(taskViewRefreshBtnCommand);
		}
		if (allCommands.indexOf("extension.gotoImgAppTaskPage") == -1) {
			// 任务视图导航栏子选项单击命令
			taskViewOpenTaskHttpPageDisposable = vscode.commands.registerCommand('extension.gotoImgAppTaskPage', (name, id, type) => {
				openImgAppRunTaskPage(context, id);
			});
			context.subscriptions.push(taskViewOpenTaskHttpPageDisposable);
		}


		// 6. 退出登录切换导航栏
		if (allCommands.indexOf("extension.logoutCloseSystemTreeView") == -1) {
			// 关闭导航栏的命令
			logoutCloseSystemTreeViewDisposable = vscode.commands.registerCommand('extension.logoutCloseSystemTreeView', () => {
				let emptyDataProvider = SystemTreeViewProvider.initTreeViewItem("system-treeView");
				let emptyTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: emptyDataProvider });
				emptyTreeView.reveal(null);
				welcomeTreeView.reveal(null);
			});
			context.subscriptions.push(logoutCloseSystemTreeViewDisposable);
		}


		//7. 定时自动刷新导航栏，显示信息
		resourceUpdateTimer = setInterval(function refreshEntrys() {
			vscode.commands.executeCommand('resource_view.refreshEntry');
			vscode.commands.executeCommand('model_view.refreshEntry');
		}, 60000);
	});
}


export function sleep(numberMillis: any) {
	var start = new Date().getTime();
	while (true) {
		if (new Date().getTime() - start > numberMillis) {
			break;
		}
	}
}


// this method is called when your extension is deactivated
export function deactivate() {
	// 取消计时器
	clearInterval(resourceUpdateTimer);
	// 关闭server
	LocalHttpServer.server.close();
}



