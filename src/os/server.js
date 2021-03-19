"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startHttpServer = exports.allData = void 0;
var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
// 定义全局变量，供外部文件调用
var allData;
(function (allData) {
})(allData = exports.allData || (exports.allData = {}));
function startHttpServer(ResDataProvider, ModelDataProvider, TaskDataProvider, context) {
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
            TaskDataProvider.getTaskList(context);
        }
    };
    var server = http.createServer(function (req, res) {
        var pathObj = url.parse(req.url, true);
        //新添处理路由的代码
        var handleFn = routes[pathObj.pathname];
        if (handleFn) {
            var msg = '';
            req.on('data', function (chunk) {
                msg += chunk; //拼接获取到数据
            }).on('end', function () {
                req.msg = msg;
                handleFn(req, res);
            });
        }
        else {
            res.writeHead(404, "Not Found");
            res.end('<h1>404 Not Found!</h1>');
        }
    });
    server.listen(5002);
    // test
    // let model = {
    // 	id: 11,
    // 	name:"model_name",
    // 	nodeID: 1,
    // 	nodeIP: "192.168.1.1"              
    // }
    // allData.modelFileList = [model];
}
exports.startHttpServer = startHttpServer;
//# sourceMappingURL=server.js.map