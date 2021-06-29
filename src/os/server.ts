var http = require('http');
var https = require('https');
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
	export let currentImgBs64Data = "";       // 手写板发送来的图像数据，base64编码
	// 标志位，标识 当前手写板图像识别是否已经结束
	export let handWriterCouldNextRegFlag = true;   // true的时候可以显示下一幅， 进入编码流程置为false，芯片识别结果返回后置为true
	export let handWriterImgShowedFlag = true;   // 标记这幅图是否已经在前端显示，true表示已经显示，其他页面不得再显示
}

/**
 * 本地server
 * 功能1：与vue_darwinos web页面通信，接收web页面的请求和数据
 * 
 * @param ResDataProvider 
 * @param ModelDataProvider 
 * @param context 
 */
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


	// // test for newApp page
	// let model_dep = {
	// 	id: 11,
	// 	name: "model_name",
	// 	nodeID: 1,
	// 	nodeIP: "192.168.1.1"
	// }
	// allData.deployedModelList = [model_dep];

	// // test for 导航栏
	// let model = {
	// 	id: 11,
	// 	name: "model_name",
	// 	nodeID: 1,
	// 	nodeIP: "192.168.1.1"
	// }
	// ModelDataProvider.updateModels([model]);

	// let node = {
	// 	id: 1,
	// 	name: "node-test",
	// 	chips: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	// 	usedNeureNums: [],
	// }
	// ResDataProvider.updateNodes([node]);
}




/**
 * 本地http server
 * 功能1：客户端手写板应用server
 * @param context 
 */
export function startHandWriterServer(context) {

	// 获取本机ip
	const hostName = handWriterData.localIP;
	console.log("本机ip地址为：", hostName);
	const port = 5003; //端口
	const app = express();

	// 1. 手写板应用接口
	// 1.1 提供手写板访问页面：pc端和手机端都可访问，用于输入手写数字
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
				// // 数据写入json
				// updataHandWriterBase64Data(context, obj.img);
				handWriterData.currentImgBs64Data = obj.img;
				handWriterData.handWriterImgShowedFlag = false;
			} else {
				res.send("refuse");
			}
		});
	});


	app.listen(port, hostName, function () {
		console.log(`类脑应用服务器运行在http://${hostName}:${port}`);
	});
}



// 语音识别应用 本地https server
export function startRecorderHttpsServer(context) {
	// 获取本机ip
	const hostName = handWriterData.localIP;
	console.log("本机ip地址为：", hostName);
	const port = 5004; //端口
	const app = express();

	const WAVFile = path.join(context.extensionPath, 'src/static/cache/audio.wav');

	// ssl证书文件
	const sslKeyFile = path.join(context.extensionPath, 'src/resources/certs/server.key');
	const sslCertFile = path.join(context.extensionPath, 'src/resources/certs/server.cert');

	app.use('/', express.static(path.join(context.extensionPath, 'src/resources/recorder'))); //指定静态文件目录

	app.post('/post_audio', function (req, res) {
		var currentData = ""
		req.on("data", function (data) {
			currentData += data;
		});
		req.on("end", function (data) {
			console.log(new Date().getTime(), "收到音频");

			let obj = JSON.parse(currentData);
			var buf = new Buffer(obj.blob, 'base64'); // decode
			fs.writeFile(WAVFile, buf, function (err) {
				if (err) {
					console.log("err", err);
				} else {
					console.log("保存成功");
				}
			})


			res.send("success");
		});
	});


	https.createServer({
		key: fs.readFileSync(sslKeyFile),
		cert: fs.readFileSync(sslCertFile)
	}, app)
		.listen(port, function () {
			console.log(`Recorder app running on https://${hostName}:${port}/`)
		})

}

