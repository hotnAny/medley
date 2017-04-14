/*------------------------------------------------------------------------------------*
 *
 * ui logic (event handlers, etc.), based on jquery
 *
 * by xiang 'anthony' chen, xiangchen@acm.org
 *
 *------------------------------------------------------------------------------------*/

var XAC = XAC || {};

XAC.initPanel = function() {
	// drag & drop 3d model file
	$(document).on('dragover', function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer = e.originalEvent.dataTransfer;
		e.dataTransfer.dropEffect = 'copy';
	});

	$(document).on('drop', function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer = e.originalEvent.dataTransfer;
		var files = e.dataTransfer.files;

		for (var i = files.length - 1; i >= 0; i--) {
			var reader = new FileReader();
			reader.onload = (function(e) {
				XAC.loadStl(e.target.result, onStlLoaded);
			});
			reader.readAsBinaryString(files[i]);
		}
	});
}

//
//
//
XAC.makeSlider = function(id, label, min, max, value, parent) {
	var sldrRow = $('<tr></tr>');
	var sldrCell = $('<td><label class="ui-widget">' + label + '</label></td><td width="200px"></td>');
	var sldr = $('<div id="' + id + '"></div>');
	sldrCell.append(sldr);
	sldrRow.append(sldrCell);

	sldr.slider({
		max: max,
		min: min,
		range: 'max'
	});

	sldr.slider('value', value);

	parent.append(sldrRow);
	sldr.row = sldrRow;
	return sldr;

}
