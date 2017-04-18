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

    XAC.initPanel();

    XAC.ignoreMouseFromPanel = true;

    //
    //  sliders to manipulate embeddables
    //
    var tblSliders = $('<table class="ui-widget tbwidgets"></table>');
    MEDLEY._sldrDepth = XAC.makeSlider('sldr_depth', 'Depth', 0, 100, 0, tblSliders);
    MEDLEY._sldrDepth.slider({
        slide: function(event, ui) {
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            var eps = 0.1;
            if (XAC._depthValue != undefined) {
                if (Math.abs(value - XAC._depthValue) > eps) {
                    for (object of XAC._selecteds) {
                        if (object.embeddable != undefined) object.embeddable.setDepth(
                            value);
                    }
                }
            } else {
                XAC._depthValue = value;
            }
        }
    });

    MEDLEY._sldrThickness = XAC.makeSlider('sldr_thickness', 'Thickness', 0, 100, 0, tblSliders);
    MEDLEY._sldrThickness.slider({
        slide: function(event, ui) {
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            for (object of XAC._selecteds) {
                if (object.embeddable != undefined) object.embeddable.setThickness(
                    value);
            }
        }
    });

    MEDLEY._sldrWidth = XAC.makeSlider('sldr_width', 'Width', 0, 100, 0, tblSliders);
    MEDLEY._sldrWidth.slider({
        slide: function(event, ui) {
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            for (object of XAC._selecteds) {
                if (object.embeddable != undefined) object.embeddable.setWidth(value);
            }
        },

        change: function(event, ui) {
            var max = $(event.target).slider("option", "max");
            var value = ui.value * 1.0 / max;

            if (MEDLEY._embeddables.length > 0) {
                MEDLEY._embeddables.last().setWidth(value);
            }
        }
    });

    // delete using keyboard
    XAC.on(46, function() {
        for (object of XAC._selecteds) {
            if (object.embeddable != undefined) object.embeddable.selfDestroy();
        }
    });

    panel.append(tblSliders);
});
