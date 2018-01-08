var fs = require('fs');
var url = require('url');
var http = require('http');
var WebSocket = require('ws').Server;

var server = http.createServer((req,res)=>{
    var urlObj = url.parse(req.url,true);
    if(urlObj.pathname == '/'){
        fs.createReadStream('./index.html').pipe(res);
    }else{
        res.end();
    }
}).listen(8083);

function noop() {} 
function heartbeat() {
    this.isAlive = true;
}
function send(data) {
    let i = wsArr.length;
    while(i--){
        if (wsArr[i].ws.isAlive){
          try{
            wsArr[i].ws.send(data);
          }catch(e){
            console.log(e);
          }  
        } 
    }
}

var wsArr = [];
var wss = new WebSocket({port: 8091});
wss.on('connection',(ws,req)=>{
    let clientIp = req.connection.remoteAddress;
    ws.isAlive = true;
    ws.on('error', err => {
        
    })
    ws.on('pong',heartbeat);
    ws.on('message',data=>{
        let tempData = {
            message: data,
            name: clientIp.slice(7)
        }
        send(JSON.stringify({
            type: 'message',
            data: tempData
        }))
    })

    //判断是否已经存在
    let isExist = false;
    let i = wsArr.length;
    while (i--) {
        if (wsArr[i].ip == clientIp){
            wsArr.splice(i, 1, {ws: ws, ip: clientIp});
            break;
        }
    }
    if(i == -1){
        send(JSON.stringify({
            type: 'admin',
            data: `用户${clientIp.slice(7)}进入了聊天室`
        }));
        wsArr.push({ ws: ws, ip: clientIp });
    }
    ws.send(JSON.stringify({
        type: 'admin',
        data: `欢迎进入聊天室，当前有${wsArr.length}人`
    }));
})

setInterval(()=>{
    wss.clients.forEach(client=>{
        if(client.isAlive === false) return client.terminate();
        client.isAlive = false;
        client.ping(noop);
    })
},10000)