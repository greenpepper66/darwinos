var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
import { ResProvider } from "../DataProvider/ResProvider";
import { ModelProvider, Model } from "../DataProvider/ModelProvider";
import { uploadModelPageProvideByPort, modelHomePageProvideByPort, nodePageProvideByPort, chipPageProvideByPort } from "../PageProvider";
import { LocalHttpServer } from "../extension";
// 定义全局变量，供外部文件调用
export module allData {
	export let nodeList: any[];
	export let modelFileList: any[];
	export let deployedModelList: any[]; // 部署后的模型列表，可以用来运行任务
}


export function startHttpServer(ResDataProvider: ResProvider, ModelDataProvider: ModelProvider, context) {
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
			allData.nodeList = nodes;
			allData.modelFileList = models;
			allData.deployedModelList = tasks;

			ResDataProvider.updateNodes(nodes);
			ModelDataProvider.updateModels(models);
		},

		// 模型上传成功，弹出框关闭后跳转到模型视图首页
		'/uploadOkGotoModelList': function (req, res) {
			console.log("web page upload modelsuccess, and get web req, uploadOkGotoModelList");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('close success');

			modelHomePageProvideByPort(context);
		},

		// 模型视图首页 点击“上传模型”按钮， 跳转到模型上传页面
		'/modelListGotoUploadPage': function (req, res) {
			console.log("from modelist page to upload page, and get web req, modelListGotoUploadPage");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('goto success');

			uploadModelPageProvideByPort(context);
		},

		// 资源视图首页拓扑图 点击每个圆圈（节点） 跳转到节点详情页面
		'/gotoNodeDetailPage': function (req, res) {
			console.log("from resHome echarts to nodeDetail page, and get web req, gotoNodeDetailPage");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('goto success');

			console.log("请求体数据：", req);
			let JSONdata = JSON.parse(req.msg);
			let nodeID = JSONdata.nodeID;  // number类型
			console.log("节点ID为： ", nodeID);

			let name = "节点" + nodeID + "详情";
			let route = "node?nodeID=" + nodeID;
			nodePageProvideByPort(context, name, 5001, route);

		},

		// 节点详情页面，点击芯片组成图，跳转到芯片详情页面
		'/gotoChipDetailPage': function (req, res) {
			console.log("from node page echarts to chipDetail page, and get web req, gotoChipDetailPage");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('goto success');

			console.log("请求体数据：", req);
			let JSONdata = JSON.parse(req.msg);
			let nodeID = JSONdata.nodeID.replace(/^\s*|\s*$/g, "");  //string类型
			let chipID = JSONdata.chipID.replace(/^\s*|\s*$/g, "");  // string类型
			console.log("ID为： ", nodeID, chipID);

			let name = "节点" + nodeID + "芯片" + chipID + "详情";
			let route = "chip?nodeID=" + nodeID + "&chipID=" + chipID;
			chipPageProvideByPort(context, name, 5001, route);

		},

		// 手写板数据上传接收
		'/uploadHandWriteImg': function (req, res) {
			console.log("from hand-writer");
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.end('upload success');

			console.log("请求体数据：", req);
			let JSONdata = JSON.parse(req.msg);
			let base64Img = JSONdata.img;  // number类型
			// console.log("图像为： ", base64Img);

			// 发送给前端页面显示
			
		},

	}

	LocalHttpServer.server = http.createServer(function (req, res) {
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
	LocalHttpServer.server.listen(5002);


	// test for newApp page
	let model_dep = {
		id: 11,
		name: "model_name",
		nodeID: 1,
		nodeIP: "192.168.1.1"
	}
	allData.deployedModelList = [model_dep];

	// test for 导航栏
	let model = {
		id: 11,
		name: "model_name",
		nodeID: 1,
		nodeIP: "192.168.1.1"
	}
	ModelDataProvider.updateModels([model]);

	let node = {
		id: 1,
		name: "node-test",
		chips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		usedNeureNums: [],
	}
	ResDataProvider.updateNodes([node]);
}



