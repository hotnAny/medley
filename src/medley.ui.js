//	........................................................................................................
//
//  medley ui js, v0.1
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

$(document).ready(function () {
    var panel = $('<div></div>');
    panel.css('width', MEDLEY.WIDTHPANEL + 'px');
    panel.css('height', '100%');
    panel.css('color', '#000000');
    panel.css('background-color', 'rgba(192, 192, 192, 0.5)');
    panel.css('top', '0px');
    panel.css('position', 'absolute');
    panel.css('font-family', 'Helvetica');
    // panel.css('font-size', '12px');
    panel.css('overflow', 'auto');
    panel.css('padding', MEDLEY.PADDINGPANEL + 'px');

    panel.load(MEDLEY.TABLEPANEL, function (e) {
        var tbSearchQuery = $('#tbSearchQuery');
        tbSearchQuery.width(MEDLEY.WIDTHSEARCHBOX);

        var btnAdd = $('#btnAdd');
        btnAdd.button();
        btnAdd.click(function (e) {
            var matobj = new MEDLEY.MatObj(MEDLEY._matobjs);
            matobj.openDialog();

        });

        MEDLEY._listSearchOutput = $('#listSearchOutput');
        MEDLEY._listSearchOutput.css('background-color', 'rgba(255, 255, 255, 0.5)');
        // listSearchOutput.css('columns', MEDLEY.NUMSEARCHRESULTSCOLS.toString());
        MEDLEY._listSearchOutput.css('padding', MEDLEY.PADDINGSEARCHRESULTS);
        MEDLEY.showSearchResults();

        //
        //  sliders to manipulate embeddables
        //
        MEDLEY._sldrDepth = XAC.makeSlider('sldr_depth', 'Depth', 0, 100, 0, $('#tblSliders'));
        MEDLEY._sldrDepth.slider({
            slide: function (event, ui) {
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

        MEDLEY._sldrThickness = XAC.makeSlider('sldr_thickness', 'Thickness', 0, 100, 0, $('#tblSliders'));
        MEDLEY._sldrThickness.slider({
            slide: function (event, ui) {
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

        MEDLEY._sldrWidth = XAC.makeSlider('sldr_width', 'Width', 0, 100, 0, $('#tblSliders'));
        MEDLEY._sldrWidth.slider({
            slide: function (event, ui) {
                // log('[embeddable] setWidth')
                var max = $(event.target).slider("option", "max");
                var value = ui.value * 1.0 / max;

                var selected = XAC._selecteds.clone();
                for (object of selected) {
                    if (object.embeddable != undefined) object.embeddable.setWidth(value, true);
                }
            },

            change: function (event, ui) {
                var max = $(event.target).slider("option", "max");
                var value = ui.value * 1.0 / max;

                var selected = XAC._selecteds.clone();
                for (object of selected) {
                    if (object.embeddable != undefined) object.embeddable.setWidth(value);
                }
            }
        });

        MEDLEY.sldrMapFunc = function (value, sldr) {
            var max = sldr.slider("option", "max");
            // return sldr.slider('option', 'value') * 1.0 / max;
            return value * max;
        }

    });

    $(document.body).append(panel);

    // var title = $('<h2 class="ui-widget"><b>MEDLEY</b></h2>');
    // panel.append(title);


    XAC.enableDragDrop(function (files) {
        if (MEDLEY._isDialogOpen) return;
        for (var i = files.length - 1; i >= 0; i--) {
            var reader = new FileReader();
            reader.onload = (function (e) {
                XAC.loadStl(e.target.result, MEDLEY.onStlLoaded);
            });
            reader.readAsBinaryString(files[i]);
        }
    });

    XAC.ignoreMouseFromPanel = true;

    // delete using keyboard
    XAC.on(XAC.DELETE, function () {
        for (object of XAC._selecteds) {
            if (object.embeddable != undefined) {
                object.embeddable.selfDestroy();
                XAC.scene.remove(object.embeddable.extra);
            }
        }
    });

    return;

});

MEDLEY.showSearchResults = function (matobj) {
    var ul = MEDLEY._listSearchOutput;
    var matobjs = matobj == undefined ? MEDLEY._matobjs : [matobj];
    for (_matobj of matobjs) {
        var result = $('<li></li>');
        result.css('padding', MEDLEY.PADDINGSEARCHRESULTITEM);
        result.append(_matobj.getInfoCard(result));
        ul.prepend(result);
    }
}