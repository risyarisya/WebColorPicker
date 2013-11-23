var DEBUG =false;

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
	var input = document.createElement("input");
        input.type = 'text';
        document.body.appendChild(input);
	input.value = text;
	input.focus();
	input.select();
	document.execCommand("copy");
        document.body.removeChild(input);
    }
}
