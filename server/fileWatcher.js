var fs = require('fs'),
	path = require('path'),
	events = require('events'),
	util = require('util'),
	_ = require('underscore');

var mediator = new events.EventEmitter();
var watchList = _([]);

var options = {
	extensions: "js|html|handlebars|mustache|css|scss|sass|styl",
	ignore: undefined,
	poll_interval: 100,
	emitFirstTime: true,
	verbose: false
};
exports.options = options;

var ignoredPaths = {};
var basePath = path.join(path.normalize(__dirname),'..');

function doWatch(watch) {
	var ignore = options.ignore,
		extensions = options.extensions,
		poll_interval = options.poll_interval,
		emitFirstTime = options.emitFirstTime;
	
	extensions = extensions.replace(/,/g, "|");
	var fileExtensionPattern = new RegExp("^.*\.(" + extensions + ")$");
	
	if (ignore) {
		var ignoreItems = ignore.split(',');
		ignoreItems.forEach(function(ignoreItem) {
			ignoreItem = path.resolve(ignoreItem);
			ignoredPaths[ignoreItem] = true;
			util.debug("Ignoring directory '" + ignoreItem + "'.");
		});
	}
	
	var watchItems = watch.split(',');
	watchItems.forEach(function(watchItem) {
		var normalizedWatchItem = path.join(basePath, watchItem);
		if(options.verbose)
			util.debug("Watching directory '" + normalizedWatchItem + "' for changes.");
		findAllWatchFiles(normalizedWatchItem, fileExtensionPattern, function(f) {
			watchGivenFile(watchItem , f, poll_interval, emitFirstTime);
		});
	});
};

function changed(watch, filename) {
	var relativeFilename = filename.substr(basePath.length);
	if(options.verbose)
		util.debug("file change (watch: " + watch + ", filename: " + filename + ", relativeFilename: " + relativeFilename + ")");
	mediator.emit(watch, filename, relativeFilename);
}

function changedWin(watch, event, filename) {
	var hasChanged = true;
	if (event === 'change') {
		if (filename) {
			filename = path.resolve(filename);
			Object.keys(ignoredPaths).forEach(function(ignorePath) {
				if (filename.indexOf(ignorePath + '\\') === 0) {
					hasChanged = false;
				}
			});
		}
		if (hasChanged)
			changed(watch,filename);
	}
}

function changedOther(watch, filename, oldStat, newStat) {
	// we only care about modification time, not access time.
	if (newStat.mtime.getTime() !== oldStat.mtime.getTime())
		changed(watch, filename);
}

var nodeVersion = process.version.split(".");
var isWindowsWithoutWatchFile = process.platform === 'win32'
		&& parseInt(nodeVersion[1]) <= 6;

function watchGivenFile(watch, watchFile, poll_interval, emitFirstTime) {
	if (isWindowsWithoutWatchFile)
		fs.watch(watchFile, {persistent : true, interval : poll_interval}, function(event, filename){
			changedWin(watch, event, filename);
		});
	else
		fs.watchFile(watchFile, {persistent : true, interval : poll_interval}, function(oldStat, newStat){
			changedOther(watch, watchFile, oldStat, newStat)
		});
	if (options.verbose)
		util.debug("watching file '" + watchFile + "'");
	if(emitFirstTime)
		changed(watch, watchFile);
}

var findAllWatchFiles = function(dir, fileExtensionPattern, callback) {
	dir = path.resolve(dir);
	if (ignoredPaths[dir])
		return;
	fs.stat(dir, function(err, stats) {
		if (err) {
			util.error('Error retrieving stats for file: ' + dir);
		} else {
			if (stats.isDirectory()) {
				if (isWindowsWithoutWatchFile)
					callback(dir);
				fs.readdir(dir, function(err, fileNames) {
					if (err) {
						util.error('Error reading path: ' + dir);
					} else {
						fileNames.forEach(function(fileName) {
							findAllWatchFiles(path.join(dir, fileName), fileExtensionPattern, callback);
						});
					}
				});
			} else {
				if (!isWindowsWithoutWatchFile && dir.match(fileExtensionPattern)) {
					callback(dir);
				}
			}
		}
	});
};


exports.watch = function(watch,callback){
	util.debug('watch on: ' + watch);
	if(!watchList.contains(watch)){
		watchList.push(watch);
		doWatch(watch);
	}
	mediator.on(watch,callback);
};