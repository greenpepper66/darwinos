import axios from 'axios';

export function task_start(ip,model_id) {
    
    console.log("start a task: ", ip, model_id);

    axios.post("http://" + ip + "/choosed_input/", 
        {
            model_id: model_id,
        })
        .then((ret) => {
            console.log(ret);
        })
        .catch((err) => {
          console.error(err);          
        });
   
}



export function task_stop(ip,model_id) {
   
    console.log("stop a task: ", ip, model_id);

    axios.post("http://" + ip + "/terminate_input/",
        {
            model_id: model_id,
        })
        .then((ret) => {
            console.log(ret);
        })
        .catch((err) => {
          console.error(err);          
        });
    
}



// 任务重启
export function task_reset(ip,model_id) {
    console.log("reset a task: ", ip, model_id);
    axios.post("http://" + ip + "/asic_reset/",
        {
            model_id: model_id,
        })
        .then((ret) => {
            console.log(ret);
        })
        .catch((err) => {
          console.error(err);          
        });
    
}



/* 部署模型，发送给模型所在节点的ip */
// 部署后模型的status置为3-running
export function task_deploy(key_ip, model_id) {
    console.log("start deploy the model");
    axios.post("http://" + key_ip + "/choosed_config/",
        {
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

        axios.post("http://" + key_ip + "/get_result/",
            {
                temp: 0,
            })
            .then((ret)=>{
                console.log("get_result api: ", ret);
                if (ret.data == "task_deploy fails") {
                    console.log(ret);
                } else {
                    
                    clearInterval(interval);
                }
            })
            .catch((err) => {
                console.error(err);          
            });

        
    }, 3000);
}



/* 删除模型文件 */
// todo: 删除前加弹窗 确认+取消
export function task_delete(ip, model_id) {

    axios.post("http://" + ip + "/delete_file/",
        {
            model_id: model_id,
        })
        .then((ret)=>{          
            console.log(ret);
        });

    
    // 删除任务后要更新模型文件列表。
    //this.$router.go(0); // 会有短暂的闪烁现象
}