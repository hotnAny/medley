//	........................................................................................................
//
//  medley material object (found objects as material), v0.0
//
//  by xiangchen@acm.org, 06/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

//
//
//
MEDLEY.MatObj = function (matobjs) {
    this._matobjs = matobjs;

    // [debug]
    this._name = 'Banana';
    this._imgSrc = MEDLEY.ASSETDIR + '/359-banana.png';
    this._dim = 1;
    this._properties = {};
    this._lbStars = {};
};

MEDLEY.MatObj.prototype = {
    constructor: MEDLEY.MatObj
};

//
//
//
MEDLEY.MatObj.prototype.loadValues = function (json) {
    this._name = json._name;
    this._imgSrc = json._imgSrc;
    this._dim = json._dim;
    this._properties = json._properties;
}


//
//
//
MEDLEY.MatObj.prototype.getInfoCard = function (parent) {
    this._cardParent = parent;

    var card = $('<div class="w3-panel w3-card"></div>');
    var tblCard = $('<table border="0"></table>');
    tblCard.css('width', '100%');
    var trCard = $('<tr></tr>');

    var tdThumbnail = $('<td></td>');
    var thumbnail = $('<img src="' + this._imgSrc + '"></img>');
    thumbnail.width(MEDLEY.WIDTHSEARCHRESULTITEM);
    tdThumbnail.append(thumbnail);

    trCard.append(tdThumbnail);

    var tdInfo = $('<td></td>');
    tdInfo.css('vertical-align', 'top');
    tdInfo.css('font-size', 'x-small');
    tdInfo.css('width', '100%');
    tdInfo.append($('<b>' + this._name + '</b>'));
    var divProperties = $('<div></div>');
    // divProperties.css('font-size', 'x-small');
    var properties = this._selectProperties();
    var nproperties = 0;
    for (propName in properties) {
        if (nproperties++ >= MEDLEY.MAXNUMPROPERTIESONCARD) {
            divProperties.append('...');
            break;
        }
        var nstars = properties[propName];
        var strStars = '';
        for (var i = 0; i < nstars; i++) strStars += MEDLEY.CODEBLACKSTAR;
        for (var i = 0; i < MEDLEY.NUMSTARS - nstars; i++) strStars += MEDLEY.CODEWHITESTAR;
        divProperties.append(propName.replace('_', ' ') + ': ' + strStars + '<br/>');
    }
    tdInfo.append(divProperties);

    var btnMore = $('<a href="">Edit</a>')
    // btnMore.css('font-size', 'x-small');
    btnMore.css('float', 'right');
    btnMore.click(function (e) {
        e.preventDefault();
        this.openDialog();
        e.stopPropagation();
    }.bind(this));
    tdInfo.append(btnMore);

    trCard.append(tdInfo);

    tblCard.append(trCard);
    card.append(tblCard);

    card.click(function (e) {
        var selected = card.hasClass('ui-state-highlight');
        $('.w3-panel.w3-card').removeClass('ui-state-highlight');
        if (!selected) card.addClass('ui-state-highlight');
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
        $('#inputName').css('disabled', 'disabled');
        $('#inputName').css('border', '1px solid #ffffff');
    }.bind(this));

    // workability
    var selWorkability = $('<select id="selWorkability"></select>');
    selWorkability.css('width', '100%');
    selWorkability.append('<option> - </option>');
    selWorkability.append('<option value=0> 0 - non-workable fixed-shaped objects </option>');
    selWorkability.append('<option value=1> 1 - wires, threads, strings, etc. </option>');
    selWorkability.append('<option value=2> 2 - sheets, panes, plates, etc. </option>');
    selWorkability.append('<option value=3> 3 - bars, blocks, lumps, etc. </option>');
    selWorkability.change(function (e) {
        this._dim = e.target.selectedIndex - 1;
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

    // material properties
    var selMaterialProperty = $('<select id="selMaterialProperty"></select>');
    selMaterialProperty.css('width', '100%');
    for (var i = 0; i < MEDLEY.MATERIALPROPERTIES.length; i++) {
        var property = MEDLEY.MATERIALPROPERTIES[i];
        selMaterialProperty.append('<option value=' + i + '>' + property + '</option>');
    }
    selMaterialProperty.change(function (e) {
        var idx = e.target.selectedIndex;
        if (idx >= 0) {
            var property = MEDLEY.MATERIALPROPERTIES[idx];
            if (property.replace(' ', '_') in this._properties) return;
            // this._properties[property.replace(' ', '_')] = 0;
            this._addPropertyRow(property);
            // this._updateCard();
        }
    }.bind(this));

    dialogBody.load(MEDLEY.TABLEINFODIALOG, function (e) {
        $('#imgDialogThumbnail').attr('src', this._imgSrc);
        $('#imgDialogThumbnail').width(MEDLEY.WIDTHDIALOGTHUMBNAIL);

        this._makeNameLabel($('#divName'), this._name);

        $('#divWorkability').append(selWorkability);
        if (this._dim != undefined)
            $('option[value=' + this._dim + ']').attr('selected', true);

        $('#divDropzone').append(divDropZone);

        $('#divProperties').append(selMaterialProperty);

        for (property in this._properties) this._addPropertyRow(property);

        $('#btnSave').button();
        $('#btnSave').click(function (e) {
            if (this._matobjs != undefined && this._matobjs.indexOf(this) < 0) {
                this._matobjs.push(this);
                MEDLEY.showSearchResults(this);
            }
        }.bind(this));

    }.bind(this));

    this._dialogBody = dialogBody;
    dialog.append(dialogBody);

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

MEDLEY.MatObj.prototype._makeNameLabel = function (div, name) {
    var inputName = $('#inputName');
    inputName.attr('disabled', 'disabled');
    inputName.val(name);
    MEDLEY.MatObj.__instance = this;
    div.click(function (e) {
        $('#inputName').removeAttr('disabled');
        $('#inputName').css('border', '1px solid #cccccc');
        if ($(e.target).attr('id') == 'inputName') e.stopPropagation();
    });
}

//
//
//
MEDLEY.MatObj.prototype._getInteractiveStars = function (property) {
    var __lbStars = [];
    var divStars = $('<div></div>');
    var value = this._properties[property]
    for (var i = 0; i < MEDLEY.NUMSTARS; i++) {
        var star = i < value ? MEDLEY.CODEBLACKSTAR : MEDLEY.CODEWHITESTAR;
        var lbStar = $('<label>' + star + '</label>');
        lbStar.attr('star', i + 1);
        lbStar.attr('matprop', property);
        lbStar.click(function (e) {
            var value = $(e.target).attr('star');
            var __lbStars = this._lbStars[$(e.target).attr('matprop')];
            for (var j = 0; j < value; j++) __lbStars[j].html(MEDLEY.CODEBLACKSTAR);
            for (var j = value; j < MEDLEY.NUMSTARS; j++) __lbStars[j].html(MEDLEY.CODEWHITESTAR);
            this._properties[$(e.target).attr('matprop').replace(' ', '_')] = value;
            this._updateCard();
        }.bind(this));
        divStars.append(lbStar);
        __lbStars.push(lbStar);
    }

    this._lbStars[property] = __lbStars;

    return divStars;
}

MEDLEY.MatObj.prototype._addPropertyRow = function (property) {
    var trProperty = $('<tr id="tr' + property.replace(' ', '_') + '"></tr>');

    var tdName = $('<td width="60%"><div>' + property + '</div></td>');
    tdName.css('padding-bottom', '0px');
    trProperty.append(tdName);

    var tdStars = $('<td></td>');
    tdStars.css('padding-bottom', '0px');
    tdStars.append(this._getInteractiveStars(property.replace(' ', '_')));
    trProperty.append(tdStars);

    var tdRemove = $('<td></td>');
    tdRemove.css('padding-bottom', '0px');
    tdRemove.css('vertical-align', 'middle');
    var btnRemove = $('<a style="text-decoration:none" href="">' + MEDLEY.CODECROSS + '</a>')
    // btnRemove.button();
    btnRemove.attr('matprop', property.replace(' ', '_'));
    btnRemove.click(function (e) {
        e.preventDefault();
        var _property = $(e.target).attr('matprop');
        $('#tr' + _property).remove();
        delete this._properties[_property];
        this._updateCard();
    }.bind(this));
    tdRemove.append(btnRemove);
    trProperty.append(tdRemove);

    $('#tblProperties').append(trProperty);
}

//
//
//
MEDLEY.MatObj.prototype.openDialog = function () {
    var dialog = this.getDialog();
    dialog.dialog({
        width: MEDLEY.WIDTHDIALOG,
        height: MEDLEY.HEIGHTDIALOG,
        // position: {
        //     my: "left",
        //     at: "center",
        //     of: window
        // },
        open: function (e) {
            MEDLEY._isDialogOpen = true;
        }.bind(this),
        close: function (e) {
            this._updateCard();
            this._dialogBody.remove();
            MEDLEY._isDialogOpen = false;
        }.bind(this)
    });
}

MEDLEY.MatObj.prototype.saveToLibrary = function () {

}