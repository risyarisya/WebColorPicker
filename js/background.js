var ZOOM_WIDTH = 96;

var CP = {
    active_tabid: 0,	// 現在activateなTABのID
    win_id: 0,		// windowのID
    
    is_capturing: false,
    installed: false,

    isActivated : function(id) {
	return (CP.active_tabid == id);
    },

    // TabのScreenShotを撮る
    capture : function(wid, w, h, res) {
	var format = localStorage['image_format'];
	var op = (format == 'png') ? { format: 'png' } : {format:'jpeg', quality: 100};
	
	chrome.tabs.captureVisibleTab(wid, op, function(data) {
	    res.postMessage({action:"imageUpdateRes", data:data });
	});
    },
    
    deactivate : function(option) {
	if (CP.is_windowopen && option.window_close) {
	    debuglog("deactivate called. window close.");
	    if (CP.win_id != 0) {
		chrome.windows.remove(CP.win_id, function() {
			CP.win_id = 0;
			CP.is_windowopen=false;
			CP.active_tabid = 0;
		});
	    }
	} else {
	    debuglog("deactivate called. remove overlay.");
	    CP.updateBadge(false);
	    var tabid = CP.active_tabid;
	    CP.active_tabid = 0;
	    chrome.tabs.sendMessage(tabid, { "action": "deactivate" }, function() {
		    console.log("[recv] deactivated."); 
	    });
	}
    },
    
    activate : function(tab) {

	var zoom_drawing = (localStorage["zoom_drawing"] == 'normal') ? 'normal' : 'pixel';
	if (!CP.isActivated(tab.id)) {
	    CP.active_tabid = tab.id;
	    debuglog("send activate");
	    CP.updateBadge(true);
	    chrome.tabs.sendMessage(CP.active_tabid, 
				{ "action": "activate", "zoom_drawing":zoom_drawing }, 
				   function(response) { debuglog("activated."); });
	}
    },
    
    updateBadge: function(flag) {
	if (flag) {
	    var bg_color = {color:[200, 0, 0, 255], tabId: CP.active_tabid};
	    chrome.browserAction.setBadgeBackgroundColor(bg_color);
	    chrome.browserAction.setBadgeText({"text": "ON", tabId: CP.active_tabid});
	} else {
	    var bg_color = {color:[200, 0, 0, 0], tabId:CP.active_tabid };
	    chrome.browserAction.setBadgeBackgroundColor(bg_color);
	    chrome.browserAction.setBadgeText({"text": "", tabId: CP.active_tabid});
	}
    },

    onBadgeClick: function(tab) {

	if (CP.is_windowopen) {
	    // 既にWindowが開いている場合
	    if (CP.active_tabid != tab.id) { // Tab移動後の場合
		// 現在activateなTabをdeactivate後、新しいTabをactivate
		CP.deactivate({window_close:false});
		setTimeout(function() { CP.activate(tab); }, 500);
	    }
	    chrome.windows.update(CP.win_id, {focused: true }, function() {});
	} else {
	    // Windowがない場合
	    var panelURL = chrome.extension.getURL("nw.html");
	    var height = (window.navigator.platform.indexOf("Mac")!=-1) ? 135 : 175;

	    chrome.windows.create({url: panelURL, type: "popup", focused: true, width:290, height:height}, function(window){
		    debuglog("window create");
	            CP.win_id = window.id;
	            CP.is_windowopen = true;
	            CP.activate(tab);
	    });
	}
    },
    execScript: function(id) {
	chrome.tabs.executeScript(id, {file:"./dist/content_script.js"}, function() {
	    debuglog("exec script "+id);
	    if (chrome.extension.lastError != undefined) {
		console.log("Faild to exeuteScript. "+chrome.extension.lastError.message);
	    }
	});

    },
    init : function() {
	chrome.browserAction.onClicked.addListener(function(tab) {
		var NGList = ["https://chrome.google.com/extensions",
			      "https://chrome.google.com/webstore",
			      "file://",
			      "chrome://"
			      ];
		for (var i=0; i<NGList.length; i++) {
		    if (tab.url.indexOf(NGList[i]) >= 0) {
			alert("Sorry, you cannot pick color from this page.");
			return;
		    }
		}

		CP.onBadgeClick(tab);
	    });
	
	chrome.windows.onRemoved.addListener(function(wid) {
		debuglog("window close handler called."+CP.win_id+" "+wid+" "+CP.is_windowopen);
		if (CP.win_id == wid) {
		    if (CP.is_windowopen) {
			CP.is_windowopen = false;
			//CP.win_id = 0;
			CP.deactivate({window_close: false });
		    }
		}
	    });
	
	chrome.runtime.onConnect.addListener(function(port) {
		port.onMessage.addListener(function(request) {
			switch(request.action) {
			case "imageUpdate":
			    debuglog("[recv] imageUpdate");
			    CP.capture(port.sender.tab.windowId, request.width, request.height, port);
			    break;
			    
			}
		    });
	    });
	
	// タブが閉じられたとき→deactivate
	chrome.tabs.onRemoved.addListener(function(tabid) {
		if (CP.active_tabid && CP.active_tabid == tabid) {
		    CP.deactivate({window_close: true });
		}
	    });
	
	// タブが更新されたとき→deactivate&tablistから削除
	chrome.tabs.onUpdated.addListener(function(tabid, info) {
		if (CP.active_tabid != 0 && CP.active_tabid == tabid) {
		    debuglog("window update! ");
		    CP.deactivate({window_close: true });
		}
	    });
	
	// タブがWindowを出て行ったとき
	chrome.tabs.onDetached.addListener(function(tabid, info) {
		// カラーピッカーwindowがWindow移動したとき
		if (CP.win_id == info.oldWindowId) {
		    // タブを閉じてdeactivate
		    chrome.tabs.remove(tabid, function() {});
		    CP.deactivate({window_close: false });
		}
	    });
	
	chrome.runtime.onInstalled.addListener(function(details) {
		console.log("installed");

		chrome.tabs.getAllInWindow(function(tabs) {
			console.log(tabs);
			for (tabid in tabs) {
			    var id = tabs[tabid].id;
			    CP.execScript(id);
			}
		    });
	    });
	chrome.runtime.onRestartRequired.addListener(function(details) {
		console.log("restart");
		chrome.tabs.getAllInWindow(function(tabs) {
			for (tabid in tabs) {
			    chrome.tabs.executeScript(tabs[tabid].id, {file:"./dist/content_script.js"}, function() {
				    if (chrome.extension.lastError != undefined) {
					console.log("Faild to exeuteScript.");
				    }
				});
			}
		    });
	    });
    },
    
};

CP.init();
//window.addEventListener("load", CP.init, false);