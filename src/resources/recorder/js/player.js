"use strict";
// exports.__esModule = true;
var source = null;
var playTime = 0; // 相对时间，记录暂停位置
var playStamp = 0; // 开始或暂停后开始的时间戳(绝对)
var context = null;
var analyser = null;
var audioData = null;
// let hasInit: boolean = false;           // 是否已经初始化了
var isPaused = false;
var totalTime = 0;
var endplayFn = function () { };


function throwError(message) {
    throw new Error(message);
}


/**
 * 初始化
 */
function init() {
    context = new (window.AudioContext || window.webkitAudioContext)();
    analyser = context.createAnalyser();
    analyser.fftSize = 2048; // 表示存储频域的大小
}
/**
 * play
 * @returns {Promise<{}>}
 */
function playAudio() {
    isPaused = false;
    return context.decodeAudioData(audioData.slice(0), function (buffer) {
        source = context.createBufferSource();
        // 播放结束的事件绑定
        source.onended = function () {
            if (!isPaused) { // 暂停的时候也会触发该事件
                // 计算音频总时长
                totalTime = context.currentTime - playStamp + playTime;
                endplayFn();
            }
        };
        // 设置数据
        source.buffer = buffer;
        // connect到分析器，还是用录音的，因为播放时不能录音的
        source.connect(analyser);
        analyser.connect(context.destination);
        source.start(0, playTime);
        // 记录当前的时间戳，以备暂停时使用
        playStamp = context.currentTime;
    }, function (e) {
        throwError(e);
    });
}
// 销毁source, 由于 decodeAudioData 产生的source每次停止后就不能使用，所以暂停也意味着销毁，下次需重新启动。
function destroySource() {
    if (source) {
        source.stop();
        source = null;
    }
}
var Player = /** @class */ (function () {
    function Player() {
    }
    /**
     * play record
     * @static
     * @param {ArrayBuffer} arraybuffer
     * @memberof Player
     */
    Player.play = function (arraybuffer) {
        if (!context) {
            // 第一次播放要初始化
            init();
        }
        this.stopPlay();
        // 缓存播放数据
        audioData = arraybuffer;
        totalTime = 0;
        return playAudio();
    };
    /**
     * 暂停播放录音
     * @memberof Player
     */
    Player.pausePlay = function () {
        destroySource();
        // 多次暂停需要累加
        playTime += context.currentTime - playStamp;
        isPaused = true;
    };
    /**
     * 恢复播放录音
     * @memberof Player
     */
    Player.resumePlay = function () {
        return playAudio();
    };
    /**
     * 停止播放
     * @memberof Player
     */
    Player.stopPlay = function () {
        playTime = 0;
        audioData = null;
        destroySource();
    };
    Player.destroyPlay = function () {
        this.stopPlay();
    };
    Player.getAnalyseData = function () {
        var dataArray = new Uint8Array(analyser.frequencyBinCount);
        // 将数据拷贝到dataArray中。
        analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    };
    /**
     * 增加录音播放完成的事件绑定
     *
     * @static
     * @param {*} [fn=function() {}]
     * @memberof Player
     */
    Player.addPlayEnd = function (fn) {
        if (fn === void 0) { fn = function () { }; }
        endplayFn = fn;
    };
    // 获取已经播放的时长
    Player.getPlayTime = function () {
        var pTime = isPaused ? playTime : context.currentTime - playStamp + playTime;
        return totalTime || pTime;
    };
    return Player;
}());
// exports["default"] = Player;
