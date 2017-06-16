//	........................................................................................................
//
//  medley material object (found objects as material), v0.0
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.MatObj = function () {
    // [debug]
    this._name = 'Banana';
    this._imgSrc = 'assets/359-banana.png';

    this._dim = 1;

    this._properties = {};
    this._properties[MEDLEY.HEATCONDUCTIVITY] = 5;
    this._properties[MEDLEY.TENSILESTRENGTH] = 4;
    this._properties[MEDLEY.SOFTNESS] = 0;
};

MEDLEY.MatObj.prototype = {
    constructor: MEDLEY.MatObj
};

//
//
//
MEDLEY.MatObj.prototype.getInfoCard = function (parent) {
    this._cardParent = parent;

    var card = $('<div class="w3-panel w3-card"></div>');
    // card.css('margin', '5px');
    var tblCard = $('<table border="0"></table>');
    tblCard.css('width', '100%');
    var trCard = $('<tr></tr>');

    var tdThumbnail = $('<td></td>');
    var thumbnail = $('<img src="' + this._imgSrc + '"></img>');
    thumbnail.width(MEDLEY.WIDTHSEARCHRESULTITEM);
    tdThumbnail.append(thumbnail);

    trCard.append(tdThumbnail);

    var tdInfo = $('<td></td>');
    tdInfo.css('font-size', 'smaller');
    tdInfo.append($('<b>' + this._name + '</b>'));
    var divProperties = $('<div></div>');
    divProperties.css('font-size', 'x-small');
    var properties = this._selectProperties();
    for (propName in properties) {
        var nstars = properties[propName];
        var strStars = '';
        for (var i = 0; i < nstars; i++) strStars += MEDLEY.CODEBLACKSTAR;
        for (var i = 0; i < 5 - nstars; i++) strStars += MEDLEY.CODEWHITESTAR;
        divProperties.append(propName + ': ' + strStars + '<br/>');
    }
    tdInfo.append(divProperties);

    var btnMore = $('<a href="..">More</a>')
    btnMore.css('font-size', 'x-small');
    btnMore.css('float', 'right');
    btnMore.click(function (e) {
        e.preventDefault();
        var dialog = this.getDialog();
        dialog.dialog({
            width: MEDLEY.WIDTHDIALOG,
            position: {
                my: "left",
                at: "center",
                of: window
            },
            open: function (e) {
                if (this._dim != undefined)
                    $('option[value=' + this._dim + ']').attr('selected', true);

            }.bind(this),
            close: function (e) {
                if (this._cardParent != undefined) {
                    if (this._card != undefined) {
                        this._card.remove();
                        this._cardParent.append(this.getInfoCard(this._cardParent));
                    }
                }
            }.bind(this)
        });
    }.bind(this));
    tdInfo.append(btnMore);

    trCard.append(tdInfo);

    tblCard.append(trCard);
    card.append(tblCard);

    card.click(function (e) {
        $('.w3-panel.w3-card').removeClass('ui-state-highlight');
        card.addClass('ui-state-highlight');
    })

    this._card = card;
    return card;
}

//
//
//
MEDLEY.MatObj.prototype._selectProperties = function (query) {
    return this._properties;
}

MEDLEY.MatObj.prototype.getDialog = function () {
    var dialog = $('<div name="title" title="' + this._name + ' material properties">');
    dialog.css('font-size', 'small');
    dialog.css('width', '640px');
    dialog.click(function (e) {
        if (MEDLEY.__editableText != undefined) {
            this._name = MEDLEY.__editableText.val();
            __makeNameLabel($('div[name="divName"]'), this._name);
            MEDLEY.__editableText.remove();
            MEDLEY.__editableText = undefined;
        }
    }.bind(this));

    // name
    var __makeNameLabel = function (div, name) {
        var lbName = $('<label>' + name + '</label>');
        lbName.css('font-weight', 'bold');
        div.append(lbName);
        lbName.click(function (e) {
            var lbHtml = $(this).html(); // notice "this" instead of a specific #myDiv
            MEDLEY.__editableText = $('<input class="ui-widget" type="text" />');
            MEDLEY.__editableText.val(lbHtml);
            MEDLEY.__editableText.keyup(function (e) {
                $('div[name="title"]').dialog('option', 'title', $(this).val() + ' material properties');
            });
            MEDLEY.__editableText.click(function (e) {
                e.stopPropagation();
            });
            $(this).replaceWith(MEDLEY.__editableText);
            MEDLEY.__editableText.focus();
            e.stopPropagation();
            this.remove();
        });
    }
    var divName = $('<div name="divName"></div>');
    __makeNameLabel(divName, this._name);
    dialog.append(divName);

    // workability
    dialog.append('<h4 class="ui-widget">Workability</h4>');
    var selWorkability = $('<select id="selWorkability"></select>');
    selWorkability.css('width', '80%');
    selWorkability.append('<option> - </option>');
    selWorkability.append('<option value=0> 0 - non-workable fixed-shaped objects </option>');
    selWorkability.append('<option value=1> 1 - wires, threads, strings, etc. </option>');
    selWorkability.append('<option value=2> 2 - sheets, panes, plates, etc. </option>');
    selWorkability.append('<option value=3> 3 - bars, blocks, lumps, etc. </option>');
    dialog.append(selWorkability);
    selWorkability.change(function (event) {
        this._dim = event.target.selectedIndex - 1;
    }.bind(this));


    // dropzone for 3d model files and thumbnails
    dialog.append('<br/><br/>');
    var divDropZone = $('<div align="center">Drop thumbnail image or .stl files here</div>');
    divDropZone.css('width', '95%');
    divDropZone.css('height', '64px');
    divDropZone.css('border-style', 'dotted');
    divDropZone.css('border-width', '1px');
    divDropZone.css('line-height', '64px');
    divDropZone.css('color', '#888888');
    dialog.append(divDropZone);
    divDropZone.on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer = e.originalEvent.dataTransfer;
        e.dataTransfer.dropEffect = 'copy';
    });
    divDropZone.on('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer = e.originalEvent.dataTransfer;
        var files = e.dataTransfer.files;
    });

    return dialog;
}