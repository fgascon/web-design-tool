(function($){
	
	var root = this;
	
	var socket = io.connect('http://localhost');
	
	$(function(){
		var body = $('body');
		var head = $('head');
		
		socket.emit('watch','/app');
		
		socket.on('changed:/app',function(filename,content){
			console.log('changed',filename);
			
			if(filename==='/body.html'){ // body.html
				body.html(content);
				
			}else if(filename.match(/^.*\.(css)$/)){ // *.css
				var tagId = 'style-' + CryptoJS.SHA1(filename);
				head.find('#' + tagId).remove();
				head.append($('<style />').attr('id',tagId).html(content));
				
			}else if(filename.match(/^.*\.(handlebars)$/)){ // *.handlebars
				var tagId = 'template-' + CryptoJS.SHA1(filename);
				head.find('#' + tagId).remove();
				head.append($('<script />').attr('id',tagId).attr('type','text/x-handlebars-template').html(content));
				
			}
		});
	});
	
}).call(this,jQuery);