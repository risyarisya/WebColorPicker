function save_options() {

	localStorage["image_format"] = (document.getElementById("image_format_png").checked) ? 'png' : 'jpeg';
	localStorage["auto_clip_board"] = (document.getElementById("auto_clip_board").checked) ? 'true' : 'false';
	localStorage["zoom_drawing"] = (document.getElementById("zoom_drawing_pixelated").checked) ? 'pixel' : 'normal';
	
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {
		status.innerHTML = "";
	}, 1500);
}

function restore_options() {
	if (localStorage["image_format"]=='png') {
		document.getElementById("image_format_png").checked = true;
	} else {
		document.getElementById("image_format_jpeg").checked = true;
	}

	if (localStorage["zoom_drawing"]=='normal') {
		document.getElementById("zoom_drawing_normal").checked = true;
	} else {
		document.getElementById("zoom_drawing_pixelated").checked = true;
	}
	
	document.getElementById("auto_clip_board").checked = (localStorage["auto_clip_board"]==false) ? false : true;
}


function init(){
    document.getElementById("save").addEventListener("click", save_options, false);
    document.getElementById("reset").addEventListener("click", restore_options, false);
    restore_options()
}

window.addEventListener("load", init, false);
