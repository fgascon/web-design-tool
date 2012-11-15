(function($){
	
	var root = this;

	var bodyContent = '';
	var templates = {};
	function renderTemplate(filename,data){
		return templates[filename].call(root,data||{});
	}
	
	var socket = io.connect('http://localhost');
	
	var watch = function(dirname,callback){
		socket.on('changed:' + dirname, callback);
		socket.emit('watch', dirname);
	};
	
	$(function(){
		var body = $('body');
		var head = $('head');
		
		function render(){
			body.html(bodyContent);
			for(var filename in templates){
				body.append(renderTemplate(filename));
			}
		}
		
		watch('/app',function(filename,content){
			console.log('changed',filename);
			
			if(filename==='/body.html'){ // body.html
				bodyContent = content;
				render();
				
			}else if(filename.match(/^.*\.(css)$/)){ // *.css
				var tagId = 'style-' + CryptoJS.SHA1(filename);
				head.find('#' + tagId).remove();
				head.append($('<style />').attr('id',tagId).html(content));
				
			}else if(filename.match(/^.*\.(handlebars)$/)){ // *.handlebars
				templates[filename] = Handlebars.compile(content);
				render();
				
			}
		});
	});
	
}).call(this,jQuery);