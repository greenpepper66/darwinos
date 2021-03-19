"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.task_delete = exports.task_deploy = exports.task_reset = exports.task_stop = exports.task_start = void 0;
const axios_1 = require("axios");
function task_start(ip, model_id) {
    console.log("start a task: ", ip, model_id);
    axios_1.default.post("http://" + ip + "/choosed_input/", {
        model_id: model_id,
    })
        .then((ret) => {
        console.log(ret);
    })
        .catch((err) => {
        console.error(err);
    });
}
exports.task_start = task_start;
function task_stop(ip, model_id) {
    console.log("stop a task: ", ip, model_id);
    axios_1.default.post("http://" + ip + "/terminate_input/", {
        model_id: model_id,
    })
        .then((ret) => {
        console.log(ret);
    })
        .catch((err) => {
        console.error(err);
    });
}
exports.task_stop = task_stop;
// 任务重启
function task_reset(ip, model_id) {
    console.log("reset a task: ", ip, model_id);
    axios_1.default.post("http://" + ip + "/asic_reset/", {
        model_id: model_id,
    })
        .then((ret) => {
        console.log(ret);
    })
        .catch((err) => {
        console.error(err);
    });
}
exports.task_reset = task_reset;
/* 部署模型，发送给模型所在节点的ip */
// 部署后模型的status置为3-running
function task_deploy(key_ip, model_id) {
    console.log("start deploy the model");
    axios_1.default.post("http://" + key_ip + "/choosed_config/", {
        model_id: model_id,
    })
        .then((ret) => {
        console.log(ret);
    })
        .catch((err) => {
        console.error(err);
    });
    var task_deploy_interval_cnt = 0;
    var interval = setInterval(function () {
        task_deploy_interval_cnt++;
        if (task_deploy_interval_cnt > 5) {
            alert("task_deploy time out");
            clearInterval(interval);
        }
        axios_1.default.post("http://" + key_ip + "/get_result/", {
            temp: 0,
        })
            .then((ret) => {
            console.log("get_result api: ", ret);
            if (ret.data == "task_deploy fails") {
                console.log(ret);
            }
            else {
                clearInterval(interval);
            }
        })
            .catch((err) => {
            console.error(err);
        });
    }, 3000);
}
exports.task_deploy = task_deploy;
/* 删除模型文件 */
// todo: 删除前加弹窗 确认+取消
function task_delete(ip, model_id) {
    axios_1.default.post("http://" + ip + "/delete_file/", {
        model_id: model_id,
    })
        .then((ret) => {
        console.log(ret);
    });
    // 删除任务后要更新模型文件列表。
    //this.$router.go(0); // 会有短暂的闪烁现象
}
exports.task_delete = task_delete;
//# sourceMappingURL=task_operations.js.map