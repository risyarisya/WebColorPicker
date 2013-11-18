var CS = {
	is_activated: false,
	is_pos_updating: false,
	is_updating_img: false,
	is_loading: false,
	
	zoom_drawing: 'pixelated',
	
	_x: -1,
	_y: -1,

	last_pos_timeout: 0,
	last_img_updating_timeout: 0, 

	overlay: null,
	canvas: null,
	ctx: null,
	img_obj: null,

	port_to_win: null,
	port_to_bg: null,

	createOverLay: function() {
		if (CS.is_activated) return;
		// console.log("createOverlay");		
		CS.overlay = document.createElement('div');
		CS.overlay.innerHtml = '&nbsp;';
		CS.overlay.style.width = document.body.clientWidth+"px";
		var height = Math.max.apply( null, [document.body.clientHeight , document.body.scrollHeight, document.documentElement.scrollHeight, document.documentElement.clientHeight] );
		CS.overlay.style.height = height+"px";
		CS.overlay.style.position = 'absolute';
		CS.overlay.style.zIndex = '2147483647';
		CS.overlay.style.top = '0px';
		CS.overlay.style.left = '0px';
		CS.overlay.style.backgroundColor = 'transparent';
		CS.overlay.id = 'overlay';
		CS.overlay.style.cursor = 'crosshair';
		document.body.appendChild(CS.overlay);
	},
		
	activate: function() {
		if (CS.is_activated) return;
		
		CS.createOverLay();

		CS.is_activated = true;

		CS.changeScreen();
		
		CS.overlay.addEventListener("mousemove", CS.onMouseMove);
		window.addEventListener("scroll", CS.onScrollStop);
		window.addEventListener("resize", CS.onWindowResize);
		CS.overlay.addEventListener("click", CS.onMouseClick, true);

	},
	
	deactivate: function() {
		if (!CS.is_activated) return;
		document.removeEventListener("mousemove", CS.onMouseMove);
		CS.overlay.removeEventListener("click", CS.onMouseClick);
		window.removeEventListener("scroll", CS.onScrollStop);
		window.removeEventListener("resize", CS.onWindowResize);
		document.body.removeChild(CS.overlay);

		CS.overlay = null;
		CS.canvas = null;
		CS.ctx = null;
		CS.img_obj = null;

		CS.is_activated = false;
		CS.is_pos_updating = false;
		CS.is_loading = false;
		CS.is_updating_img = false;

		CS._x = -1;
		CS._y = -1;
		CS.last_img_updating_timeout = 0;
		CS.last_pos_timeout = 0;

		CS.port_to_bg.disconnect();
		CS.port_to_bg = null;
		CS.port_to_win.disconnect();
		CS.port_to_win = null;
		// console.log("deactivated! "+CS.is_activated);
	},

	changeScreen: function() {
		if (!CS.is_activated) return;
		if (CS.is_updating_img) {
			window.clearTimeout(CS.last_img_updating_timeout);
			CS.last_img_updating_timeout = window.setTimeout(function() { CS.changeScreen(); }, 500);
			return;
		}

		CS.is_updating_img = true;
		if (!CS.port_to_bg) {
		    CS.port_to_bg = chrome.extension.connect({name: "cs_to_bg"});
		}
		CS.port_to_bg.postMessage({"action":"imageUpdate"});
		CS.port_to_bg.onMessage.addListener(function(res) {
			// console.log("image captured!");
			CS.is_updating_img = false;
			CS.loadCapture(res.data);
		});
	},

	loadCapture: function(data) {
		if (!CS.canvas) {
		        // console.log("create canvas");
			CS.canvas = document.createElement("canvas");
			CS.ctx = CS.canvas.getContext("2d");
		}
		CS.img_obj = document.createElement('img');
		CS.img_obj.src = data;
		CS.canvas.width = window.innerWidth;
		CS.canvas.height = window.innerHeight;
		CS.is_loading = true;
	},	
	
	pixelatedZoom : function(canvas, x, y, width) {
		var center= width/2;
		var context = canvas.getContext("2d");
		context.drawImage(CS.canvas, -x+center, -y+center);
		
		for(var i=0;i<center/2;i++){
			var m = center-i*2;
			var p = center+i*2;
			// 隣のピクセル(4*4)と同じ色を使ってジャギーに拡大する
			// 中心から1px右へずらす
			context.drawImage(canvas, p, 0, m, 96, p+1, 0, m, 96);

			// 中心から1px左へずらす
			context.drawImage(canvas, 0, 0, m+1, 96, -1, 0, m+1, 96);

			// 中心から1px下へずらす
			context.drawImage(canvas, 0, p, 96, m, 0, p+1, 96, m);
			
			// 中心から1px上へずらす							
			context.drawImage(canvas, 0, 0, 96, m+1, 0, -1, 96, m+1);
		}
		
	},
	
	zoom : function(px, py) {
		if (CS.is_loading) return '';
		var ret = CS.convertPos(px, py);
		var x = ret.x;
		var y = ret.y;
		var canvas = document.createElement("canvas");
		canvas.width = 96;
		canvas.height = 96;
		var context = canvas.getContext("2d");
		
		var start = 48;

		if (CS.zoom_drawing == 'normal') {
			context.scale(2,2);
			context.drawImage(CS.canvas, -x+start/2, -y+start/2);
			context.scale(0.5, 0.5);
		} else {
			CS.pixelatedZoom(canvas, x, y, 96);
		}
		
		context.fillStyle = "rgba(0,0,0,0.3)";
		context.beginPath();
		context.moveTo(start, 0);
		context.lineTo(start, 96);
		context.lineTo(start+1, 96);
		context.lineTo(start+1, 0);
		context.closePath();
		context.fill();
		
		context.beginPath();
		context.moveTo(0, start);
		context.lineTo(96, start);
		context.lineTo(96, start+1);
		context.lineTo(0, start+1);
		context.closePath();
		context.fill();
		
		var ret = canvas.toDataURL();
		canvas = null;
		context = null;
		
		return ret;

	},
	
	pick: function(x, y) {
		if (!CS.ctx) return null;
		var pos = CS.convertPos(x, y);
		var data = CS.ctx.getImageData(pos.x, pos.y, 1, 1).data;
		var color = {
			"R":data[0],
			"G":data[1],
			"B":data[2],
		};
		data = null;
		return color;
	},
	convertPos: function(x, y) {
    		var imgWidth = CS.canvas.width;
		var imgHeight = CS.canvas.height;
		var winWidth = window.innerWidth;
		var winHeight = window.innerHeight;

		var rateX = imgWidth / winWidth;
		var rateY = imgHeight / winHeight;
		return {"x":rateX*x, "y":rateY*y};
        },
	setPos: function() {

		if (!CS.is_activated) return;
		var imgWidth = 0;
		var imgHeight = 0;
		var winWidth = window.innerWidth;
		var winHeight = window.innerHeight;
 
		if (CS.is_loading) {
			if (CS.img_obj.complete) {
			    imgWidth = CS.img_obj.width;
			    imgHeight = CS.img_obj.height;

			    CS.canvas.width = CS.img_obj.width;
			    CS.canvas.height = CS.img_obj.height;
			    CS.ctx.drawImage(CS.img_obj, 0, 0);
			    CS.img_obj.src = '';
			    CS.img_obj = null;
			    CS.is_loading = false;
			    // console.log("capture complete");
			} else {
				return null;
			}
		}

		if (CS.is_pos_updating) {
			window.clearTimeout(CS.last_pos_update);
			CS.last_pos_timeout = window.setTimeout(function() { CS.setPos(); }, 500);
			return;
		}
		var x = CS._x - window.pageXOffset;
		var y = CS._y - window.pageYOffset;
		var color = CS.pick(x, y);
		
		if (color) {
		    var img = CS.zoom(x, y);
		    if (img) {
			CS.is_pos_updating = true;
			if (!CS.port_to_win) {
			    CS.port_to_win = chrome.extension.connect({name: "cs_to_win"});
			}
			CS.port_to_win.postMessage({"action":"setColor", "color":color, "zoom":img});
			CS.port_to_win.onMessage.addListener(function(res) {
				CS.is_pos_updating = false;
			    });
		    }
		}
	},
	
	onScrollStop: function() {
		if (!CS.is_activated) return;
		window.setTimeout(function() { CS.changeScreen(); }, 50);
	},
	
	onMouseMove: function(e) {
		if (!CS.is_activated) return;
		
		if (CS._x != e.pageX || CS._y != e.pageY) {
			CS._x = e.pageX;
			CS._y = e.pageY;
			CS.setPos();
		}
		e.preventDefault();
	},

	onMouseClick: function(e) {
		if (!CS.is_activated || CS.is_capturing) return;
		// console.log("[recv] onMouseClick");
		
		var x = e.pageX - window.pageXOffset;
		var y = e.pageY - window.pageYOffset;
		var color = CS.pick(x, y);

		if (color != null) {
		    if (!CS.port_to_win) {
			CS.port_to_win = chrome.extension.connect({name: "cs_to_win"});
		    }
		    CS.port_to_win.postMessage({"action":"saveColor", "color":color});
		}
		e.preventDefault();
	},
	
	onWindowResize: function(e) {
		if (!CS.is_activated) return;
		CS.overlay.style.width = document.body.clientWidth+"px";
		var height = Math.max.apply( null, [document.body.clientHeight , document.body.scrollHeight, document.documentElement.scrollHeight, document.documentElement.clientHeight] );
		CS.overlay.style.height = height+"px";
		CS.changeScreen();
	},

	init: function() {
		chrome.extension.onMessage.addListener(function(request, sender, response) {
			switch(request.action) {
			case "activate":
			//console.log("[recv] activate.");
				CS.zoom_drawing = request.zoom_drawing;
				CS.activate();
				break;
			case "deactivate":
			//console.log("[recv] deactivate.");
			        CS.deactivate();
				break;
			case "isInjected":
			//console.log("[recv] isInjected.");
				response({});
				break;
			}
		});
	}
};
CS.init();
