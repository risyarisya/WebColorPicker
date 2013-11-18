var DEBUG = false;

function debuglog(message) {
	if (!DEBUG) return;
	console.log(message);
}

function DecToHex(dec) {
	if (dec == undefined) return 'FF';
	var str = dec.toString(16);
	str = (str.length < 2) ? "0"+str : str;
	return str;
}

function copyToClipBoard(text) {
    if (localStorage["auto_clip_board"] == 'true' || localStorage["auto_clip_board"] == undefined) {
	var input = document.getElementById("color");
	input.value = text;
	input.select();
	input.focus();

	document.execCommand("copy", false, null);
    }
}
