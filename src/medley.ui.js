//	........................................................................................................
//
//  medley ui js
//
//  by xiangchen@acm.org, 04/2017
//
//	........................................................................................................

$(document).ready(function() {
    var panel = $('<div></div>');
    panel.css('width', WIDTHPANEL + 'px');
    panel.css('height', '100%');
    panel.css('color', '#000000');
    panel.css('background-color', 'rgba(192, 192, 192, 0.5)');
    panel.css('top', '0px');
    panel.css('position', 'absolute');
    panel.css('font-family', 'Helvetica');
    panel.css('font-size', '12px');
    panel.css('overflow', 'auto');

    var title = $('<h3></h3>');
    title.html('Medley');
    title.css('margin-top', '10px');
    title.css('margin-bottom', '10px');
    title.css('margin-left', '10px');
    title.css('margin-right', '10px');
    panel.append(title);

    $(document.body).append(panel);

    XAC.enableDragDrop(function(files){
        for (var i = files.length - 1; i >= 0; i--) {
			var reader = new FileReader();
			reader.onload = (function(e) {
				XAC.loadStl(e.target.result, MEDLEY.onStlLoaded);
			});
			reader.readAsBinaryString(files[i]);
		}
    });

    XAC.ignoreMouseFromPanel = true;

    //
    //  sliders to manipulate embeddables
    //
    var tblSliders = $('<table class="ui-widget tbwidgets"></table>');
    MEDLEY._sldrDepth = XAC.makeSlider('sldr_depth', 'Depth', 0, 100, 0, tblSliders);
    MEDLEY._sldrDepth.slider({
        slide: function(event, ui) {
            // log('[embeddable] setDepth')
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            var selected = XAC._selecteds.clone();
            for (object of selected) {
                if (object.embeddable != undefined) object.embeddable.setDepth(
                    value);
            }
        }
    });

    MEDLEY._sldrThickness = XAC.makeSlider('sldr_thickness', 'Thickness', 0, 100, 0, tblSliders);
    MEDLEY._sldrThickness.slider({
        slide: function(event, ui) {
            // log('[embeddable] setThickness')
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            var selected = XAC._selecteds.clone();
            for (object of selected) {
                if (object.embeddable != undefined) object.embeddable.setThickness(
                    value);
            }
        }
    });

    MEDLEY._sldrWidth = XAC.makeSlider('sldr_width', 'Width', 0, 100, 0, tblSliders);
    MEDLEY._sldrWidth.slider({
        slide: function(event, ui) {
            // log('[embeddable] setWidth')
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            var selected = XAC._selecteds.clone();
            for (object of selected) {
                if (object.embeddable != undefined) object.embeddable.setWidth(value, true);
            }
        },

        change: function(event, ui) {
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            var selected = XAC._selecteds.clone();
            for (object of selected) {
                if (object.embeddable != undefined) object.embeddable.setWidth(value);
            }
        }
    });

    MEDLEY.sldrMapFunc = function(sldr) {
        var max = sldr.slider("option", "max");
        return sldr.slider('option', 'value') * 1.0 / max;
    }

    // delete using keyboard
    XAC.on(XAC.DELETE, function() {
        for (object of XAC._selecteds) {
            if (object.embeddable != undefined) object.embeddable.selfDestroy();
        }
    });

    panel.append(tblSliders);
});
