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
    panel.css('background-color', 'rgba(192, 192, 192, 0.50)');
    panel.css('top', '0px');
    panel.css('position', 'absolute');
    panel.css('font-family', 'Helvetica');
    // panel.css('font-size', '12px');
    panel.css('overflow', 'auto');
    panel.css('padding', MEDLEY.PADDINGPANEL + 'px');
    panel.css('overflow', 'hidden');

    panel.load(MEDLEY.TABLEPANEL, function (e) {
        //
        //  add button
        //
        $('#btnAdd').button();
        $('#btnAdd').css('padding', '.0em .6em');

        $('#btnAdd').click(function (e) {
            e.preventDefault();
            var matobj = new MEDLEY.MatObj(MEDLEY._matobjs);
            matobj.openDialog();
        });

        //
        //  download button
        //
        $('#btnDownload').button();
        $('#btnDownload').css('padding', '.0em .6em');
        $('#btnDownload').click(function (e) {
            var jsonObj = {};
            var matobjs = [];
            for (matobj of MEDLEY._matobjs) {
                matobjs.push(matobj.package());
            }
            jsonObj['library'] = matobjs;
            var blob = new Blob([JSON.stringify(jsonObj)], {
                type: 'text/plain'
            });
            saveAs(blob, 'library.json');
        });

        var tbSearchQuery = $('#tbSearchQuery');
        tbSearchQuery.width(MEDLEY.WIDTHSEARCHBOX);
        tbSearchQuery.keyup(function (e) {
            var queries = $(this).val().split(',');
            MEDLEY.showSearchResults(queries, undefined)
        });

        MEDLEY._listSearchOutput = $('#listSearchOutput');
        MEDLEY._listSearchOutput.css('background-color', 'rgba(255, 255, 255, 0.5)');
        MEDLEY._listSearchOutput.css('padding', MEDLEY.PADDINGSEARCHRESULTS);
        MEDLEY.showSearchResults([''], undefined);

        //
        //  sliders to manipulate embeddables
        //
        MEDLEY._sldrDepth = XAC.makeSlider('sldr_depth', 'Depth', 0, 100, 0, $('#tblSliders'));
        MEDLEY._sldrDepth.slider({
            slide: function (event, ui) {
                // log('[embeddable] setDepth')
                var max = $(event.target).slider('option', 'max');
                var min = $(event.target).slider('option', 'min');
                var value = (ui.value * 1.0 - min) / (max - min);

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
                var max = $(event.target).slider('option', 'max');
                var min = $(event.target).slider('option', 'min');
                var value = (ui.value * 1.0 - min) / (max - min);

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
                var max = $(event.target).slider('option', 'max');
                var min = $(event.target).slider('option', 'min');
                var value = (ui.value * 1.0 - min) / (max - min);

                var selected = XAC._selecteds.clone();
                for (object of selected) {
                    if (object.embeddable != undefined) object.embeddable.setWidth(value, true);
                }
            },

            change: function (event, ui) {
                var max = $(event.target).slider('option', 'max');
                var value = ui.value * 1.0 / max;

                var selected = XAC._selecteds.clone();
                for (object of selected) {
                    if (object.embeddable != undefined) object.embeddable.setWidth(value);
                }
            }
        });

        MEDLEY.sldrMapFunc = function (value, sldr) {
            var min = sldr.slider('option', 'min');
            var max = sldr.slider('option', 'max');
            return (value - min) * 1.0 / (max - min);
        }

        //
        //  make embeddable button
        //
        $('#btnMakeEmbeddable').button();
        $('#btnMakeEmbeddable').click(function (e) {
            var selected = XAC._selecteds.clone();
            for (object of selected) {
                if (object.embeddable != undefined && !object.embeddable._removed) {
                    if ($('#rbInprint')[0].checked)
                        MEDLEY.findInPrintInsertion(object.embeddable);
                    else
                        MEDLEY.findPostPrintInsertion(object.embeddable);
                }
            }
        });

        $('#rbInprint').attr('checked', 'true');

        //
        //  info area
        //
        $('#taInfo').attr('disabled', 'disabled');
        MEDLEY.showInfo('Welcome to Medley!')
        // $('#btnExport').button();

    });

    $(document.body).append(panel);

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

    // hide embeddable
    XAC.on('H', function () {
        for (embeddable of MEDLEY.embeddables) {
            // var selected = XAC._selecteds.clone();
            // for (object of selected) {
            if (embeddable != undefined && !embeddable._removed) {
                // if (XAC.scene.children.indexOf(embeddable._meshes) >= 0)
                //     XAC.scene.remove(embeddable._meshes);
                // else XAC.scene.add(embeddable._meshes);
                embeddable._meshes.visible = !embeddable._meshes.visible;
            }

        }
    });

    return;

});

//
//
//
MEDLEY.showSearchResults = function (queries, matobj) {
    var ul = MEDLEY._listSearchOutput;
    if (matobj == undefined) ul.html('');
    var matobjs = matobj == undefined ? MEDLEY._matobjs.clone() : [matobj];
    var shown = [];
    for (q of queries) {
        for (_matobj of matobjs) {
            if (shown.indexOf(_matobj) >= 0) continue;
            for (property in _matobj._properties) {
                if (property.startsWith(q)) {
                    var result = $('<li></li>');
                    result.css('padding', MEDLEY.PADDINGSEARCHRESULTITEM);
                    result.append(_matobj.getInfoCard(result));
                    ul.prepend(result);
                    shown.push(_matobj);
                    break;
                }
            }
        }
    }
}

//
//
//
MEDLEY.showInfo = function (msg) {
    log(msg);
    var timeNow = new Date().toLocaleTimeString(); //toJSON().substring(0,19).replace('T',' ');
    $('#taInfo').append(timeNow + ' ' + msg + '\n');
    $('#taInfo').scrollTop($('#taInfo')[0].scrollHeight);
}