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
    this._imgSrc = MEDLEY.ASSETDIR + '/359-banana.png';

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
            // position: {
            //     my: "left",
            //     at: "center",
            //     of: window
            // },
            open: function (e) {
                //
            }.bind(this),
            close: function (e) {
                this._updateCard();
                this._dialogBody.remove();
            }.bind(this)
        });
        e.stopPropagation();
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

    var dialogBody = $('<div class="ui-widget"></div>');
    dialogBody.click(function (e) {
        if (MEDLEY.MatObj.__editableText != undefined) {
            this._name = MEDLEY.MatObj.__editableText.val();
            this.__makeNameLabel($('#divName'), this._name);
            MEDLEY.MatObj.__editableText.remove();
            MEDLEY.MatObj.__editableText = undefined;
        }
    }.bind(this));

    // workability
    var selWorkability = $('<select id="selWorkability"></select>');
    selWorkability.css('width', '100%');
    selWorkability.append('<option> - </option>');
    selWorkability.append('<option value=0> 0 - non-workable fixed-shaped objects </option>');
    selWorkability.append('<option value=1> 1 - wires, threads, strings, etc. </option>');
    selWorkability.append('<option value=2> 2 - sheets, panes, plates, etc. </option>');
    selWorkability.append('<option value=3> 3 - bars, blocks, lumps, etc. </option>');
    selWorkability.change(function (event) {
        this._dim = event.target.selectedIndex - 1;
    }.bind(this));

    // dropzone for 3d model files and thumbnails
    var __isImage = function (str) {
        if (str.endsWith('png') || str.endsWith('jpg'))
            return true;
    }
    var divDropZone = $('<div align="center">Drop thumbnail image or .stl files here</div>');
    divDropZone.css('width', '100%');
    divDropZone.css('height', '64px');
    divDropZone.css('border-style', 'dotted');
    divDropZone.css('border-width', '1px');
    divDropZone.css('line-height', '64px');
    divDropZone.css('color', '#888888');
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
        for (file of files) {
            var reader = new FileReader();
            if (file.name.endsWith('.stl')) {
                this._meshPath = MEDLEY.ASSETDIR + '/' + file.name;
            } else if (__isImage(file.name)) {
                this._imgSrc = MEDLEY.ASSETDIR + '/' + file.name;
                $('#imgDialogThumbnail').attr('src', this._imgSrc);
                this._updateCard();
            }
        }
    }.bind(this));

    dialogBody.load(MEDLEY.TABLEINFODIALOG, function (e) {
        $('#imgDialogThumbnail').attr('src', this._imgSrc);
        $('#imgDialogThumbnail').width(MEDLEY.WIDTHDIALOGTHUMBNAIL);

        this.__makeNameLabel($('#divName'), this._name);

        $('#divWorkability').append(selWorkability);
        if (this._dim != undefined)
            $('option[value=' + this._dim + ']').attr('selected', true);

        $('#divDropzone').append(divDropZone);

    }.bind(this));

    this._dialogBody = dialogBody;
    dialog.append(dialogBody);

    // name

    // var divName = $('<div name="divName"></div>');
    // __makeNameLabel(divName, this._name);
    // dialog.append(divName);


    // dialog.append('<h4 class="ui-widget">Workability</h4>');
    // dialog.append('<br/>');





    return dialog;
}

MEDLEY.MatObj.prototype._updateCard = function () {
    if (this._cardParent != undefined) {
        if (this._card != undefined) {
            this._card.remove();
            this._cardParent.append(this.getInfoCard(this._cardParent));
        }
    }
}

MEDLEY.MatObj.prototype.__makeNameLabel = function (div, name) {
    var lbName = $('<label>' + name + '</label>');
    lbName.css('font-weight', 'bold');
    div.append(lbName);
    MEDLEY.MatObj.__instance = this;
    lbName.click(function (e) {
        var lbHtml = $(this).html(); // notice "this" instead of a specific #myDiv
        MEDLEY.MatObj.__editableText = $('<input class="ui-widget" type="text" />');
        MEDLEY.MatObj.__editableText.css('font-weight', 'bold');
        MEDLEY.MatObj.__editableText.val(lbHtml);
        MEDLEY.MatObj.__editableText.keyup(function (e) {
            $('div[name="title"]').dialog('option', 'title', $(this).val() + ' material properties');
            MEDLEY.MatObj.__instance._name = $(this).val();
            MEDLEY.MatObj.__instance._updateCard();
        });
        MEDLEY.MatObj.__editableText.click(function (e) {
            e.stopPropagation();
        });
        $(this).replaceWith(MEDLEY.MatObj.__editableText);
        MEDLEY.MatObj.__editableText.focus();
        e.stopPropagation();
        this.remove();
    });
}