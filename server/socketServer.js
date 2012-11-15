var path = require('path'),
	fs = require('fs'),
	fileWatcher = require('./fileWatcher');

function serverPathToClientPath(serverPath){
	if(path.sep==='\\')
		return serverPath.replace(/\\/g,'/');
	else
		return serverPath;
}

var states = {
	view:'wireframe',
};

module.exports = function(socket,mediator){
	
	socket.on('watch',function(dirname){
		
		fileWatcher.watch(dirname,function(filename, relativeFilename){
			var clientFilename = serverPathToClientPath(relativeFilename.substr(dirname.length));
			fs.readFile(filename, 'utf-8', function(err, content){
				if(err){
					throw err;
				}else{
					socket.emit('changed:' + dirname, clientFilename, content);
				}
			});
		});
		
	});
	
	socket.on('changeStates',function(changes){
		for(var stateName in changes){
			states[stateName] = changes[stateName];
		}
	});
	
};