var is_lock = false;
//var Benti = {
//	s : null,
//	e : null,
//	start : function() {
//		Benti.s = new Date;
//		console.log("[Benti] start");
//	},
//	stop : function() {
//		Benti.e = new Date;
//		console.log("[Benti] stop");
//	},
//	showDiff : function() {
//		if (Benti.s && Benti.e) {
//			var diff = Benti.e.getTime() - Benti.s.getTime();
//			console.log("[Benti] diff time = "+diff);
//			Benti.s = null;
//			Benti.e = null;
//		} else {
//			console.log("[Benti] Faild to show diff.");
//		}
//	}
//};

function setSampleColor(e) {

	var el = e.target;
	var color = el.style.backgroundColor;
	var data = color.slice(4, color.length-1).split(',');
	
	if (data.length != 3) return;
	var R = data[0];
	var G = data[1].slice(1);
	var B = data[2].slice(1);
	
	document.getElementById("color_r").value = R;
	document.getElementById("color_g").value = G;
	document.getElementById("color_b").value = B;
	
	var hexR = DecToHex(Number(R));
	var hexG = DecToHex(Number(G));
	var hexB = DecToHex(Number(B));
	var str = hexR+hexG+hexB;
	console.log(hexR+" "+hexG+" "+hexB);
	document.getElementById("color").value = str;
	document.getElementById("sample").style.backgroundColor = color;

	copyToClipBoard("#"+str);
}

function getHistory() {
	var items = null;

	if (!localStorage['color'] || localStorage['color'] == undefined) {
		items = [];
	} else {
		items = JSON.parse(localStorage['color']);
	}
	return items;
}

function clearHistory() {
	localStorage.clear();
	var history = document.getElementById("hs");
	for(var i=history.childNodes.length-1; i>=0; i--) {
		history.childNodes[i].removeEventListener('click', setSampleColor);
		history.removeChild(history.childNodes[i]);
	}
}

function isMac() {
    return (window.navigator.platform.indexOf("Mac")!=-1);
}

function appendHistory(color) {
	var items = [];

	if (!localStorage['color'] || localStorage['color'] == undefined) {
		items = [];
	} else {
		items = JSON.parse(localStorage['color']);
		if (items.length >= 20) {
			items.pop();
		}
	}
	items.unshift(color);
	localStorage['color'] = JSON.stringify(items);

//	console.log(color);
	var str = "";
	if (is_lock || !color) return;
	
	var hexR = DecToHex(color.R);
	var hexG = DecToHex(color.G);
	var hexB = DecToHex(color.B);
	
	var obj = document.createElement("div");
	obj.style.zIndex = '6500';
	obj.style.display = 'inline-block';
	obj.style.margin = '1px';
	obj.style.fontSize = '10px';
	obj.style.border = '1px solid  #464646';
	obj.style.width = '10px';
	obj.style.height = '10px';
	obj.style.padding = '0';
	obj.style.backgroundColor = '#'+hexR+hexG+hexB;
	obj.style.cursor = 'pointer';
	obj.className = 'history-color';
	obj.innerHtml = '&nbsp;';

	var history = document.getElementById("hs");
	var list = history.childNodes;
	
//	console.log("length="+list.length);
	if (list.length >= 20) {
		var target = list[list.length-1];
		target.removeEventListener('click', setSampleColor);
		history.removeChild(target);
	}
	obj.addEventListener('click', setSampleColor, true);
	history.insertBefore(obj, list[0]);
	
	copyToClipBoard("#"+DecToHex(color.R)+DecToHex(color.G)+DecToHex(color.B));
	chrome.windows.getCurrent(function(win) {
		chrome.windows.update(win.id, {focused: !isMac() }, function() {});
	});
}

function removeElement(el) {
	if (el.parentNode) {
		el.parentNode.removeChild(el);
	}
}

function closeWindow(e) {
	e.preventDefault();
//	console.log("close window");
	document.getElementById("close_window").removeEventListener('click', closeWindow);
	document.getElementById("clear_history").removeEventListener('click', clearHistory);
	document.getElementById("unlock").removeEventListener('click', lock);
	document.getElementById("lock").removeEventListener('click', unlock);
	var history = document.getElementById("hs");
	for(var i=history.childNodes.length-1; i>=0; i--) {
		history.childNodes[i].removeEventListener('click', setSampleColor);
	}
	window.removeEventListener("load", init, false);
	window.removeEventListener("unload", closeWindow, false);

	removeElement(history);
	removeElement(document.getElementById("color-set"));
	removeElement(document.getElementById("zoom"));
	removeElement(document.getElementById("clear_history"));
	removeElement(document.getElementById("close_window"));

	var el = document.getElementsByTagName('html')[0];
	el.removeChild(document.body);
	window.close();
}
function lock() {
	document.getElementById("unlock").style.display = "none";
	document.getElementById("lock").style.display = "inline";
	is_lock = true;
}
function unlock() {
	document.getElementById("lock").style.display = "none";
	document.getElementById("unlock").style.display = "inline";
	is_lock = false;
}

function setColorInfo(color, url) {
	if (is_lock) return;
	var img = document.getElementById("zoom");
	img.src = url;

//	console.log(color);
	document.getElementById("color_r").value = color.R;
	document.getElementById("color_g").value = color.G;
	document.getElementById("color_b").value = color.B;

	var str = DecToHex(color.R)+DecToHex(color.G)+DecToHex(color.B);

	document.getElementById("color").value = str;
	document.getElementById("sample").style.backgroundColor =  "#"+str;
//	console.log("[recv] updateColor");
}

function init() {
	is_lock = false;
	document.getElementById("close_window").addEventListener("click", closeWindow, true);
	document.getElementById("clear_history").addEventListener("click", clearHistory, true);
	document.getElementById("unlock").addEventListener("click", lock, true);
	document.getElementById("lock").addEventListener("click", unlock, true);

	var hs = getHistory().reverse();
	for (var i=0; i<hs.length; i++) {
		appendHistory(hs[i]);
	}

	chrome.extension.onConnect.addListener(function(port) {
		port.onMessage.addListener(function(request) {
			switch(request.action) {
			case "setColor": 
//				console.log("[recv] setColor");
				setColorInfo(request.color, request.zoom);
				//response({});
				port.postMessage({});
				break;
			case "saveColor":
//				console.log("[recv] saveColor");
				appendHistory(request.color);
				break;
			}
		});
	});
}
window.addEventListener("load", init, false);
window.addEventListener("unload", closeWindow, false);
