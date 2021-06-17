let echarts = require("echarts");

// 显示脉冲图像
function display_spike_scatter_chart(datas) {
    var opt = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        xAxis: {
            type: 'category',
            min: 0,
            max: 50,
            name: "时间(brian2 ms)",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                textStyle: {
                    color: "#999999"
                }
            }
        },
        yAxis: {
            type: 'value',
            scale: true,
            name: "Neuron",
            nameTextStyle: {
                color: "#999999"
            },
            axisLabel: {
                formatter: '{value}',
                textStyle: {
                    color: "#999999"
                }
            }
        },
        series: [{
            symbolSize: 5,
            data: datas,
            type: 'scatter'
        }]
    };
    var spike_chart = echarts.init(document.getElementById("handWriter_spikes_charts"));
    spike_chart.setOption(opt);
}


export { display_spike_scatter_chart }