// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
//import * as fs from 'fs';
//import * as http from 'http';
//import * as handler from 'serve-handler';
import { Model, ModelProvider } from "./DataProvider/ModelProvider";
import { Task, TaskProvider } from "./DataProvider/TaskProvider";
import { ResProvider } from "./DataProvider/ResProvider";
import { AppsProvider } from "./DataProvider/AppsProvider";
import { EmptyDataProvider } from "./DataProvider/EmptyDataProvider";
import { PageProvideByPort, changeIndexHtmlCss } from "./PageProvider";
import { task_stop, task_reset, task_deploy, task_delete } from "./os/task_operations"
import { startHttpServer } from './os/server';
import { AppsHomePageProvide, openCertainAppHomePage } from "./pages/AppsHome";
import { openImgAppRunTaskPage, openImgAppTasksPage } from "./pages/ImgAppHome";
import { OpenLoginPage } from "./pages/UserLogin";
import { UserInfoData } from "./DataProvider/UserInfoJsonDataProvider";
import { SystemTreeViewProvider } from "./DataProvider/SystemProvider";
import { UserProvider } from './DataProvider/UserProvider';
import { UserAppHomePageProvide, openOneKindUserAppPage } from './pages/UserAppHome';

// 全局变量，保存用户登录信息
export module LoginInfo {
	export let test: boolean;
	export let currentUser: UserInfoData;
}

const PORT = 5001;

export module IDEPanels {
	export let loginPanel:vscode.WebviewPanel | undefined = undefined;
}




// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
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

	//自动弹出导航栏
	openLoginTreeView(context);

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
	let welcomeTreeView = vscode.window.createTreeView('login-treeView', { treeDataProvider: welcomeDataProvider });
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
	// 创建所有DataProvider
	let userDataProvider = SystemTreeViewProvider.initTreeViewItem("system-treeView");
	// 打开所有导航栏
	userDataProvider.getOnlyUserTreeView();
	let userTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: userDataProvider });

	userTreeView.reveal(null);
	userTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible) {
			UserAppHomePageProvide(context);
		}
	});

	// 获取所有命令
	vscode.commands.getCommands(true).then(allCommands => {
		console.log('所有命令：', allCommands);
		// console.log(allCommands.indexOf("extension.userTreeViewClose")); // 命令已存在 返回编号
		// console.log(allCommands.indexOf("extension.userTreeViewCloserrrrrrrrrr")); // 命令不存在 返回-1

		// 命令不存在的时候再注册, 重复注册会err
		if (allCommands.indexOf("extension.gotoOneKindUserAppPage") == -1) {
			let gotoDisposable = vscode.commands.registerCommand('extension.gotoOneKindUserAppPage', (name, num) => {
				openOneKindUserAppPage(context, num);
			});
			context.subscriptions.push(gotoDisposable);
		}
		// 任务视图相关命令
		if (allCommands.indexOf("extension.gotoImgAppTaskPage") == -1) {
			// 任务视图导航栏子选项单击命令
			let taskDisposable = vscode.commands.registerCommand('extension.gotoImgAppTaskPage', (name, id, type) => {
				openImgAppRunTaskPage(context, "byID", id);
			});
			context.subscriptions.push(taskDisposable);
		}

		// 普通用户和管理员用户 都能使用的命令，退出登录后需要清除命令，否则切换用户登录后命令不再重新注册，数据还是上个用户的
		if (allCommands.indexOf("user_view.appsOverview") == -1) {
			var userOvDisposable = vscode.commands.registerCommand('user_view.appsOverview', () => {
				UserAppHomePageProvide(context);
			});
			context.subscriptions.push(userOvDisposable);
		}
		if (allCommands.indexOf("user_view.refreshEntry") == -1) {
			var refDisposable = vscode.commands.registerCommand('user_view.refreshEntry', () => {
				// userDataProvider.providers[3].refresh()
				console.log("普通用户 刷新按钮: user_view.refreshEntry");
			});
			context.subscriptions.push(refDisposable);
		}
		if (allCommands.indexOf("task_view.refreshEntry") == -1) {
			var taskRefDisposable = vscode.commands.registerCommand('task_view.refreshEntry', () => {
				userDataProvider.providers[4].refresh();  // 更新tasks
				userDataProvider.data[1].children = userDataProvider.providers[4].tasks;  // 更新导航栏子列表
				userDataProvider.refresh(); // 更新导航栏
			});
			context.subscriptions.push(taskRefDisposable);
		}
		if (allCommands.indexOf("task_view.taskOverview") == -1) {
			var taskOvDisposable = vscode.commands.registerCommand('task_view.taskOverview', () => {
				openImgAppTasksPage(context);
			});
			context.subscriptions.push(taskOvDisposable);
		}


		if (allCommands.indexOf("extension.userTreeViewClose") == -1) {
			// 关闭导航栏的命令
			let closeDisposable = vscode.commands.registerCommand('extension.userTreeViewClose', () => {
				console.log("关闭用户导航栏");
				// 删除注册过的命令,否则切换登录用户后会混淆
				if (taskRefDisposable != undefined) {
					taskRefDisposable.dispose();
				}
				if (taskOvDisposable != undefined) {
					taskOvDisposable.dispose();
				}
				if (refDisposable != undefined) {
					refDisposable.dispose();
				}
				if (userOvDisposable != undefined) {
					userOvDisposable.dispose();
				}
				// 清空数据
				userDataProvider.clearTreeViewData();
				userTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: userDataProvider });
				userTreeView.reveal(null);
			});
			context.subscriptions.push(closeDisposable);
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
	// 创建所有DataProvider
	let systemDataProvider = SystemTreeViewProvider.initTreeViewItem("system-treeView");

	//启动httpserver，接收来自web页面的数据
	startHttpServer(systemDataProvider.providers[0], systemDataProvider.providers[1], context);

	// 打开所有导航栏
	systemDataProvider.getAllTreeViews();
	let allDTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: systemDataProvider });
	allDTreeView.reveal(null);
	allDTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible && LoginInfo.currentUser.name != '' && (LoginInfo.currentUser.userRole == 0 || LoginInfo.currentUser.userRole == 1)) {
			console.log("打开Home页面");
			//打开home页
			PageProvideByPort("类脑计算机", 5001, "")
		} else {
			console.log("导航栏无数据");  // 隐藏导航栏的时候执行
		}
	});

	//上传模型视图
	let uploadModelDataProvider = new EmptyDataProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('upload_model_view', uploadModelDataProvider);
	let uploadModelTreeView = vscode.window.createTreeView('upload_model_view', { treeDataProvider: uploadModelDataProvider });
	uploadModelTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible && LoginInfo.currentUser.name != '' && (LoginInfo.currentUser.userRole == 0 || LoginInfo.currentUser.userRole == 1)) {
			console.log("打开upload页面");
			PageProvideByPort("上传模型", 5001, "UploadModel");
		}
	});


	// 注册导航栏单击命令： 
	// 获取所有命令
	vscode.commands.getCommands(true).then(allCommands => {
		console.log('all所有命令：', allCommands);

		if (allCommands.indexOf("extension.openHttpPage") == -1) {
			// 节点和芯片页面
			let httpDisposable = vscode.commands.registerCommand('extension.openHttpPage', (name, port, route) => {
				PageProvideByPort(name, port, route)
			});
			context.subscriptions.push(httpDisposable);
		}

		if (allCommands.indexOf("extension.gotoAppPage") == -1) {
			// 应用视图导航栏子选项单击命令
			let appDisposable = vscode.commands.registerCommand('extension.gotoAppPage', (name, num) => {
				openCertainAppHomePage(context, num);
			});
			context.subscriptions.push(appDisposable);
		}


		if (allCommands.indexOf("extension.gotoImgAppTaskPage") == -1) {
			// 任务视图导航栏子选项单击命令
			let taskDisposable = vscode.commands.registerCommand('extension.gotoImgAppTaskPage', (name, id, type) => {
				openImgAppRunTaskPage(context, "byID", id);
			});
			context.subscriptions.push(taskDisposable);
		}

		if (allCommands.indexOf("extension.gotoOneKindUserAppPage") == -1) {
			// 用户视图导航栏子选项单击命令
			let userDisposable = vscode.commands.registerCommand('extension.gotoOneKindUserAppPage', (name, num) => {
				openOneKindUserAppPage(context, num);
			});
			context.subscriptions.push(userDisposable);
		}


		// 注册刷新按钮
		if (allCommands.indexOf("resource_view.refreshEntry") == -1) {
			var resRefDisposable = vscode.commands.registerCommand('resource_view.refreshEntry', () => {
				systemDataProvider.providers[0].refresh();  // 更新
				systemDataProvider.data[0].children = systemDataProvider.providers[0].nodes;  // 更新导航栏子列表
				systemDataProvider.refresh(); // 更新导航栏
			});
			context.subscriptions.push(resRefDisposable);
		}
		if (allCommands.indexOf("model_view.refreshEntry") == -1) {
			var modRefDisposable = vscode.commands.registerCommand('model_view.refreshEntry', () => {
				systemDataProvider.providers[1].refresh();
				systemDataProvider.data[1].children = systemDataProvider.providers[1].models;  // 更新导航栏子列表
				systemDataProvider.refresh(); // 更新导航栏
			});
			context.subscriptions.push(modRefDisposable);
		}
		if (allCommands.indexOf("apps_view.refreshEntry") == -1) {
			var appRefDisposable = vscode.commands.registerCommand('apps_view.refreshEntry', () => {
				// systemDataProvider.providers[2].refresh();
				console.log("管理员用户：刷新按钮：apps_view.refreshEntry")
			});
			context.subscriptions.push(appRefDisposable);
		}


		// 注册overView按钮
		if (allCommands.indexOf("resource_view.resOverview") == -1) {
			let resOvDisposable = vscode.commands.registerCommand('resource_view.resOverview', () => {
				PageProvideByPort("资源视图", 5001, "")
			});
			context.subscriptions.push(resOvDisposable);
		}
		if (allCommands.indexOf("model_view.modelOverview") == -1) {
			let modOvDisposable = vscode.commands.registerCommand('model_view.modelOverview', () => {
				PageProvideByPort("模型视图", 5001, "model")
			});
			context.subscriptions.push(modOvDisposable);
		}
		if (allCommands.indexOf("apps_view.appsOverview") == -1) {
			let appOvDisposable = vscode.commands.registerCommand('apps_view.appsOverview', () => {
				AppsHomePageProvide(context);  // overview按钮打开应用视图首页
			});
			context.subscriptions.push(appOvDisposable);
		}


		// 共有命令
		if (allCommands.indexOf("user_view.refreshEntry") == -1) {
			var allUserRefDisposable = vscode.commands.registerCommand('user_view.refreshEntry', () => {
				// systemDataProvider.providers[3].refresh();
				console.log("管理员用户：刷新按钮：user_view.refreshEntry")
			});
			context.subscriptions.push(allUserRefDisposable);
		}
		if (allCommands.indexOf("task_view.refreshEntry") == -1) {
			var allTaskRefDisposable = vscode.commands.registerCommand('task_view.refreshEntry', () => {
				systemDataProvider.providers[4].refresh();  // 更新tasks
				systemDataProvider.data[4].children = systemDataProvider.providers[4].tasks;  // 更新导航栏子列表
				systemDataProvider.refresh(); // 更新导航栏
			});
			context.subscriptions.push(allTaskRefDisposable);
		}
		if (allCommands.
			indexOf("task_view.taskOverview") == -1) {
			var allTaskOvDisposable = vscode.commands.registerCommand('task_view.taskOverview', () => {
				openImgAppTasksPage(context);
			});
			context.subscriptions.push(allTaskOvDisposable);
		}
		if (allCommands.indexOf("user_view.appsOverview") == -1) {
			var allUserOvDisposable = vscode.commands.registerCommand('user_view.appsOverview', () => {
				UserAppHomePageProvide(context);
			});
			context.subscriptions.push(allUserOvDisposable);
		}



		if (allCommands.indexOf("extension.allTreeViewClose") == -1) {
			// 关闭导航栏的命令
			let closeAllDisposable = vscode.commands.registerCommand('extension.allTreeViewClose', () => {
				console.log("关闭全部导航栏");
				// 取消命令注册
				if (allUserRefDisposable != undefined) {
					allUserRefDisposable.dispose();
				}
				if (allTaskRefDisposable != undefined) {
					allTaskRefDisposable.dispose();
				}
				if (allTaskOvDisposable != undefined) {
					allTaskOvDisposable.dispose();
				}
				if (allUserOvDisposable != undefined) {
					allUserOvDisposable.dispose();
				}

				if (resRefDisposable != undefined) {
					resRefDisposable.dispose();
				}
				if (modRefDisposable != undefined) {
					modRefDisposable.dispose();
				}
				if (appRefDisposable != undefined) {
					appRefDisposable.dispose();
				}
				// 清空数据
				systemDataProvider.clearTreeViewData();
				allDTreeView = vscode.window.createTreeView('system-treeView', { treeDataProvider: systemDataProvider });
				allDTreeView.reveal(null);

			});
			context.subscriptions.push(closeAllDisposable);
		}
	});


	//定时自动刷新导航栏，显示信息
	setTimeout(function refreshEntrys() {
		vscode.commands.executeCommand('resource_view.refreshEntry');
		vscode.commands.executeCommand('model_view.refreshEntry');
	}, 500);

}


























/** 原来为区分用户角色的功能 */
export function startSystemForAdmin(context) {

	//启动一个terminal，运行网页服务端
	const resourcePath = path.join(context.extensionPath, 'src/resources');
	const terminal1 = vscode.window.createTerminal('webServer')
	terminal1.sendText("cd " + resourcePath);
	terminal1.sendText("serve -s dist -l 5001");

	//打开home页
	PageProvideByPort("类脑计算机", 5001, "")

	const ResDataProvider = new ResProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('resource_view', ResDataProvider);

	const ModelDataProvider = new ModelProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('model_view', ModelDataProvider);

	const TaskDataProvider = new TaskProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('task_view', TaskDataProvider);

	const AppsDataProvider = new AppsProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('apps_view', AppsDataProvider);

	const UserDataProvider = new UserProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('user_view', UserDataProvider);




	//自动弹出导航栏
	let ResTreeView = vscode.window.createTreeView('resource_view', { treeDataProvider: ResDataProvider });
	ResTreeView.reveal(ResDataProvider.nodes[0]);


	//上传模型
	vscode.commands.registerCommand('model_view.uploadModel', () => {
		PageProvideByPort("上传模型", 5001, "UploadModel");
		vscode.window.showInformationMessage(`Successfully called upload model.`);
	});

	const uploadModelDataProvider = new EmptyDataProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('upload_model_view', uploadModelDataProvider);
	let uploadModelTreeView = vscode.window.createTreeView('upload_model_view', { treeDataProvider: uploadModelDataProvider });
	uploadModelTreeView.onDidChangeVisibility((evt) => {
		if (evt.visible) {
			vscode.commands.executeCommand('model_view.uploadModel');
		}
	});



	// 刷新
	vscode.commands.registerCommand('resource_view.refreshEntry', () => ResDataProvider.refresh());
	vscode.commands.registerCommand('model_view.refreshEntry', () => ModelDataProvider.refresh());
	vscode.commands.registerCommand('apps_view.refreshEntry', () => AppsDataProvider.refresh());
	vscode.commands.registerCommand('user_view.refreshEntry', () => UserDataProvider.refresh());
	vscode.commands.registerCommand('task_view.refreshEntry', () => TaskDataProvider.refresh());

	vscode.commands.registerCommand('extension.openHttpPage', (name, port, route) => {
		PageProvideByPort(name, port, route)
	});


	// OverView
	vscode.commands.registerCommand('resource_view.resOverview', () => {
		PageProvideByPort("资源视图", 5001, "")
	});
	vscode.commands.registerCommand('model_view.modelOverview', () => {
		PageProvideByPort("模型视图", 5001, "model")
	});
	vscode.commands.registerCommand('apps_view.appsOverview', () => {
		AppsHomePageProvide(context);  // overview按钮打开应用视图首页
	});
	vscode.commands.registerCommand('task_view.taskOverview', () => {
		openImgAppTasksPage(context);
	});
	vscode.commands.registerCommand('user_view.appsOverview', () => {
		UserAppHomePageProvide(context);
	});


	// 应用视图
	// 应用视图导航栏子选项单击命令
	vscode.commands.registerCommand('extension.gotoAppPage', (name, num) => {
		openCertainAppHomePage(context, num);
	});
	// 任务视图导航栏子选项单击命令
	vscode.commands.registerCommand('extension.gotoImgAppTaskPage', (name, id, type) => {
		openImgAppRunTaskPage(context, "byID", id);
	});

	// 用户视图导航栏子选项单击命令
	vscode.commands.registerCommand('extension.gotoOneKindUserAppPage', (name, num) => {
		openOneKindUserAppPage(context, num);
	});


	//定时自动刷新导航栏，显示信息
	setTimeout(function refreshEntrys() {
		vscode.commands.executeCommand('resource_view.refreshEntry');
		vscode.commands.executeCommand('model_view.refreshEntry');
		vscode.commands.executeCommand('user_view.refreshEntry');
		vscode.commands.executeCommand('task_view.refreshEntry');
	}, 500);


	//model view  
	vscode.commands.registerCommand('model_view.deployTask', (model: Model) => {
		task_deploy(model.nodeIp, model.modelId);
		vscode.window.showInformationMessage(`Successfully called deploy task.`);
		ModelDataProvider.refresh();
	});

	vscode.commands.registerCommand('model_view.deleteTask', (model: Model) => {
		task_delete(model.nodeIp, model.modelId);
		vscode.window.showInformationMessage(`Successfully called delete task.`);
		ModelDataProvider.refresh();
	});



	//task view
	// 启动任务
	// vscode.commands.registerCommand('task_view.startTask', (task: Task) => {
	// 	task_start(task.nodeIp,task.modelId);		
	// 	vscode.window.showInformationMessage(`Successfully called start task.`);
	// });

	require('./pages/TaskStart')(context); // 

	vscode.commands.registerCommand('task_view.stopTask', (task: Task) => {
		task_stop(task.nodeIp, task.modelId);
		vscode.window.showInformationMessage(`Successfully called stop task.`);
	});

	vscode.commands.registerCommand('task_view.resetTask', (task: Task) => {
		task_reset(task.nodeIp, task.modelId);
		vscode.window.showInformationMessage(`Successfully called reset task.`);
	});
}



// this method is called when your extension is deactivated
export function deactivate() { }



