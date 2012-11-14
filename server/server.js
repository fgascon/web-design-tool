var program = require('commander')
	http = require('http'),
	express = require('express'),
	socketio = require('socket.io'),
	socketServer = require('./socketServer');

var packageFile = require('./package.json');

program
	.version(packageFile.version)
	.option('-p, --port [value]','Specify a port on wich to run the server')
	.parse(process.argv);

var app = express(),
	server = http.createServer(app),
	io = socketio.listen(server);

app.use(express.static(__dirname + '/public'));

server.listen(program.port || process.env.PORT || 80);
console.log("Server listening on %s:%d", server.address().address, server.address().port);

app.get('/', function(req, res){
	res.sendfile(__dirname + '/views/preview.html');
});
app.get('/editor', function(req, res){
	res.sendfile(__dirname + '/views/editor.html');
});

io.sockets.on('connection', socketServer);