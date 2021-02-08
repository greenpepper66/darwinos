import { Struct } from "../utils/jsStruct";

import { byteLength } from "byte-length";

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { document } = (new JSDOM('<!doctype html><html><body></body></html>')).window;
global.document = document;
const window = document.defaultView;
const $ = require('jquery')(window);

///import $ = require("jquery");
//import { ajax } from "jquery";


/* get board list from back end*/
function get_slave_boards(call_back) {
  let ip_str = "192.168.1.254"; // master 节点的ip
  console.log("发送请求。。。。")

  $.ajax({
    url: "http://" + ip_str + "/request_file_list/",
    type: "post",
    data: { placeholder: 1 },
    cache: false,
    xhr: function () {
      var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
      var xhr = new XMLHttpRequest();
      xhr.responseType = "blob";
      return xhr;
    },
    success: function (blob_buf) {
      var reader = new FileReader();
      reader.onload = function () {
        var array_buffer = reader.result; // 原始的二进制数据，可以被jsStruct使用的数据类型
        var MAX_NAME_LEN = 32;
        var MAX_FILE_NUM = 20;
        let struct_size = 2100;
        let struct_num = Math.floor(array_buffer.byteLength / struct_size);
        // var MAX_SLAVE_NUM = 80;
        var model_file = Struct.create(
          Struct.uint16("model_id"),
          Struct.uint32("model_size"),
          Struct.string("model_name", MAX_NAME_LEN),
          Struct.string("real_model_name", MAX_NAME_LEN),
          Struct.string("md5", 32),
          Struct.uint8("model_status")
        );
        var board_info = Struct.create(
          Struct.uint16("board_id"),
          Struct.array("ip_address", Struct.uint8(), 4),
          Struct.uint8("board_status"),
          Struct.uint8("noresp"),
          Struct.array("chips", Struct.uint8(), 12),
          Struct.string("version", 8),
          Struct.array("file_list", model_file, MAX_FILE_NUM),
          Struct.uint32("_config_list"),
          Struct.uint32("_app_list"),
          Struct.uint32("_slave_tcpb")
        );
        // slave_boards_0 系统中返回所有节点数据，包含master节点
        var slave_boards_0 = board_info.readStructs(
          /* readStructs 函数解析二进制数据， 包含master节点*/
          array_buffer,
          0,
          struct_num
        );


        /*
        // 调试用：取数据
        var FileSaver = require('file-saver'); 
        var sFile = "/home/ubuntu/Desktop/nodeInfo.txt";
        var content = JSON.stringify(slave_boards_0);
        console.log("content", content)
        var blob = new Blob([content ], {type: "text/plain;charset=utf-8"}); 
        console.log("blob", blob)
        FileSaver.saveAs(blob, sFile);
        console.log("slave_boards_0: ", slave_boards_0)
        */

        /* select board with  board_status==1 */
        // slave_boards 返回的是在线节点
        let slave_boards = [];
        for (let i = 0; i < slave_boards_0.length; i++) {
          let board_info = slave_boards_0[i];
          if (board_info["board_status"] == 1) {
            slave_boards.push(board_info);
          }
        }

        console.log("在线节点个数: ", slave_boards.length);

        call_back(slave_boards);
      };
      // reader.readAsArrayBuffer(blob_buf);
    },
    error: function (xhr) {
      console.log("err: ", xhr);
      // let slave_boards = [];
      // call_back(slave_boards);
    }
  });
}


export default { get_slave_boards };
