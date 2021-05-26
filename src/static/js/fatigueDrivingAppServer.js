Stream = require('node-rtsp-stream')
stream = new Stream({
  name: 'name',
  streamUrl: 'rtsp://admin:admin123@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0',
  wsPort: 9999,
  ffmpegOptions: { // options ffmpeg flags
    '-stats': '', // an option with no neccessary value uses a blank string
    '-r': 25, // options with required values specify the value after the key
    '-s': '600x600',
    '-b:v': '400k',  // -b:v bitrate 设置比特率，缺省200kb/s
    '-fflags': 'nobuffer',
    '-analyzeduration': 1000000,
    '-rtsp_transport': 'tcp',
    '-g': 5,
    '-b': 700000,
    '-max_delay': 100,
    '-qscale': 1,
    '-max_muxing_queue_size': 1024,
    '-q': 0,
    '-f': 'mpegts',
    '-codec:v': 'mpeg1video'
  }
})