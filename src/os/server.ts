var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
var express = require('express'); //express框架模块
var ip = require('ip');

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

// 手写板应用数据
export module handWriterData {
	export const localIP = ip.address();
	export let currentImgBs64Data = "";   // 手写板发送来的图像数据，base64编码
	export let currentImgEncodeSpikes = [];  // 手写板图像编码数据
	export let currentImgOutputSpikes = [];   // 手写板图像的芯片识别脉冲输出
	export let currentImgRecognitionRet = -1; // 手写板图像的芯片识别结果
	// 标志位，标识 当前手写板图像识别是否已经结束
	export let handWriterCouldNextRegFlag = true;   // true的时候可以显示下一幅， 进入编码流程置为false，芯片识别结果返回后置为true
}

// 本地server，与web页面通信，接收web页面的请求和数据
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




// 手写体应用，本地server
export function startHandWriterServer(context) {

	// 获取本机ip
	const hostName = handWriterData.localIP;
	console.log("本机ip地址为：", hostName);
	const port = 5003; //端口
	const app = express();

	// 1. 手写板应用接口
	// 1.1 提供手写板访问页面
	app.use('/', express.static(path.join(context.extensionPath, 'src/resources/hand-writer'))); //指定静态文件目录

	// app.get('/handwriter', function (req, res) {
	// 	res.sendfile(path.join(context.extensionPath, 'src/resources/hand-writer') + '/index.html')
	// });

	// 1.2 接收手写板页面提交的手写数字
	app.post('/post_img', function (req, res) {
		var currentData = ""
		req.on("data", function (data) {
			currentData += data;
		});
		req.on("end", function (data) {
			console.log(new Date().getTime(), " 收到图片");
			// 当前没有正在识别的图像时才记录下一副图像
			if (handWriterData.handWriterCouldNextRegFlag == true) {
				res.send("success");
				let obj = JSON.parse(currentData);
				handWriterData.currentImgBs64Data = obj.img;
			} else {
				res.send("refuse");
			}
		});
	});

	// 1.3 接收main.py中的脉冲数据，用于界面上绘制echart图
	app.post('/spike_tuples', function (req, res) {
		req.on("data", function (data) {
			let obj = JSON.parse(data);
			handWriterData.currentImgEncodeSpikes = obj.spikes;
		});
		req.on("end", function (data) {
			console.log("收到脉冲编码");
			res.send('脉冲已接收');
		});
	});

	// 1.4 接收send_input.py中的芯片识别结果，用于界面画图
	app.post('/get_result', function (req, res) {
		req.on("data", function (data) {
			let obj = JSON.parse(data);
			handWriterData.currentImgOutputSpikes = obj.spikes;
			handWriterData.currentImgRecognitionRet = obj.result;
		});
		req.on("end", function (data) {
			console.log("收到识别结果");
			res.send('结果已接收');
		});
	});


	// 2. 语音识别应用接口



	app.listen(port, hostName, function () {
		console.log(`类脑应用服务器运行在http://${hostName}:${port}`);
	});
}
