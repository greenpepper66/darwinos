var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
import { ResProvider } from "../DataProvider/ResProvider";
import { ModelProvider, Model } from "../DataProvider/ModelProvider";
import { TaskProvider } from "../DataProvider/TaskProvider";

// 定义全局变量，供外部文件调用
export module allData {
	export let modelFileList: any[];
	export let deployedModelList: any[]; // 部署后的模型列表，可以用来运行任务
}



export function startHttpServer(ResDataProvider: ResProvider,
	ModelDataProvider: ModelProvider,
	TaskDataProvider: TaskProvider,
	context) {
	var routes = {
		'/post': function (req, res) {
			var obj = {};
			var JSONdata = JSON.parse(req.msg);

			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('success');

			var nodes = JSONdata.nodes;
			var models = JSONdata.models;
			var tasks = JSONdata.tasks;

			// 保存在全局变量中
			allData.modelFileList = models;
			allData.deployedModelList = tasks;

			ResDataProvider.updateNodes(nodes);
			ModelDataProvider.updateModels(models);
			// TaskDataProvider.updateTasks(tasks);
		}
	}

	var server = http.createServer(function (req, res) {
		var pathObj = url.parse(req.url, true);
		//新添处理路由的代码
		var handleFn = routes[pathObj.pathname];
		if (handleFn) {
			var msg = '';
			req.on('data', function (chunk) {        //req的监听方法data
				msg += chunk;		      //拼接获取到数据
			}).on('end', function () {		      //数据接收完触发
				req.msg = msg;
				handleFn(req, res);
			});
		} else {
			res.writeHead(404, "Not Found");
			res.end('<h1>404 Not Found!</h1>');
		}
	});
	server.listen(5002);


	// test for newApp page
	let model_dep = {
		id: 11,
		name:"model_name",
		nodeID: 1,
		nodeIP: "192.168.1.1"              
	}
	allData.deployedModelList = [model_dep];

	// test for 导航栏
	let model = {
		id: 11,
		name:"model_name",
		nodeID: 1,
		nodeIP: "192.168.1.1"              
	}
	ModelDataProvider.updateModels([model]);

	let node = {
		id: 11,
		name:"node-test",
		chips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		usedNeureNums:[],
	}
	ResDataProvider.updateNodes([node]);
}



