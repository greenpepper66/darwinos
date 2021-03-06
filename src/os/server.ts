var http = require('http');
var path = require('path');
var fs = require('fs');
var url = require('url');
import {ResProvider} from "../DataProvider/ResProvider";
import {ModelProvider} from "../DataProvider/ModelProvider";
import {TaskProvider} from "../DataProvider/TaskProvider";

export function startHttpServer(ResDataProvider:ResProvider,
    ModelDataProvider:ModelProvider,
    TaskDataProvider:TaskProvider)
{
var routes = {
    '/post':function(req,res){
    	var obj = {};
    var JSONdata= JSON.parse(req.msg);
	
	res.setHeader("Content-Type","text/plain; charset=utf-8");
    res.setHeader("Access-Control-Allow-Origin","*");  
	res.end('success');

    var nodes=JSONdata.nodes;
    var models=JSONdata.models;
    var tasks=JSONdata.tasks;

    ResDataProvider.updateNodes(nodes);
    ModelDataProvider.updateModels(models);
    TaskDataProvider.updateTasks(tasks);
    }
}
 
var server = http.createServer(function(req,res){
		  
	var pathObj = url.parse(req.url, true);
	
	//新添处理路由的代码
	var handleFn = routes[pathObj.pathname];
	if(handleFn){
	    var msg = '';				  
	    req.on('data',function(chunk){        //req的监听方法data
	       msg += chunk;		      //拼接获取到数据
	    }).on('end',function(){		      //数据接收完触发
		req.msg = msg;		 
		handleFn(req, res);	
            });
	}else{

 		res.writeHead(404,"Not Found");
        res.end('<h1>404 Not Found!</h1>');
	   
	}
});
server.listen(5002);



}



