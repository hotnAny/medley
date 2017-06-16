//	........................................................................................................
//
//  medley ui js, v0.1
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

$(document).ready(function () {
    // $('*').each(function () {
    //     $(this).css('font-size', 'small');
    // });

    var panel = $('<div></div>');
    panel.css('width', MEDLEY.WIDTHPANEL + 'px');
    panel.css('height', '100%');
    panel.css('color', '#000000');
    panel.css('background-color', 'rgba(192, 192, 192, 0.5)');
    panel.css('top', '0px');
    panel.css('position', 'absolute');
    panel.css('font-family', 'Helvetica');
    panel.css('font-size', '12px');
    panel.css('overflow', 'auto');
    panel.css('padding', MEDLEY.PADDINGPANEL + 'px');

    var title = $('<h2 class="ui-widget"><b>MEDLEY</b></h2>');
    panel.append(title);

    $(document.body).append(panel);

    XAC.enableDragDrop(function (files) {
        for (var i = files.length - 1; i >= 0; i--) {
            var reader = new FileReader();
            reader.onload = (function (e) {
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

    MEDLEY._sldrThickness = XAC.makeSlider('sldr_thickness', 'Thickness', 0, 100, 0, tblSliders);
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

    MEDLEY._sldrWidth = XAC.makeSlider('sldr_width', 'Width', 0, 100, 0, tblSliders);
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

    //
    //  search box
    //
    var tblSearchBox = $('<table class="ui-widget tbwidgets"></table>');

    var trSearchInput = $('<tr></tr>');
    var tdSearchQuery = $('<td></td>');
    var tbSearchQuery = $('<input class="ui-widget type="text">')
    tbSearchQuery.width(MEDLEY.WIDTHSEARCHBOX);
    tdSearchQuery.append(tbSearchQuery);
    trSearchInput.append(tdSearchQuery);


    var tdAddButton = $('<td></td>');
    var btnAdd = $('<div>&#10133;</div>');
    btnAdd.button();
    // btnAdd.css('padding-top padding-bottom', '0px')
    // btnAdd.css('padding-left padding-right', '3px')
    tdAddButton.append(btnAdd);
    trSearchInput.append(tdAddButton);
    tblSearchBox.append(trSearchInput);

    tblSearchBox.append($('<tr></tr>'));

    var trSearchOutput = $('<tr></tr>');
    var tdSearchOutput = $('<td colspan=2></td>');
    
    var listSearchOutput = $('<ul></ul>');
    listSearchOutput.css('background-color', 'rgba(255, 255, 255, 0.5)');
    // listSearchOutput.css('columns', MEDLEY.NUMSEARCHRESULTSCOLS.toString());
    listSearchOutput.css('padding', MEDLEY.PADDINGSEARCHRESULTS);
    MEDLEY.showSearchResults(listSearchOutput, MEDLEY.WIDTHSEARCHRESULTITEM);
    tdSearchOutput.append(listSearchOutput);
    // tdSearchOutput.append(div);
    trSearchOutput.append(tdSearchOutput);
    tblSearchBox.append(trSearchOutput);

    //
    //  global arrangement
    //
    panel.append(tblSearchBox);
    panel.append(tblSliders);

    // delete using keyboard
    XAC.on(XAC.DELETE, function () {
        for (object of XAC._selecteds) {
            if (object.embeddable != undefined) {
                object.embeddable.selfDestroy();
                XAC.scene.remove(object.embeddable.extra);
            }
        }
    });
});

MEDLEY.showSearchResults = function (ul, width) {
    for(matobj of MEDLEY._matobjs){
        // var imgSrc = 'assets/359-banana.png';
        var result = $('<li></li>');
        result.css('padding', MEDLEY.PADDINGSEARCHRESULTITEM);
        // var thumbnail = $('<img width=' + width +
        //     ' src="' + imgSrc + '"' +
        //     ' border="1"' +
        //     '">');
        // thumbnail.css('border-color', '#cccccc');
        result.append(matobj.getInfoCard(result));
        ul.append(result);
    }
}