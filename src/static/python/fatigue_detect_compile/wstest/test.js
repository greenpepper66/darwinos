let WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8188 });

wss.on('connection', function (ws) {
    console.log('客户端已连接');
    ws.on('message', function (message) {
        wss.clients.forEach(function each(client) {
            client.send(message);
        });
        console.log(message.length);
    });
});


