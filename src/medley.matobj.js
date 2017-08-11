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
    this._meshPath = undefined;
    this._properties = {};

    this._radius = MEDLEY.MINRADIUS1D;
    this._bendRadius = MEDLEY.MINBENDRADIUS;
    this._thickness = MEDLEY.MINTHICKNESS;
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
    this._meshPath = json._meshPath;
    this._properties = json._properties;
    this._radius = json._radius;
    this._bendRadius = json._bendRadius;
    this._thickness = json._thickness;
}

//
//
//
MEDLEY.MatObj.prototype.getInfoCard = function (parent) {
    this._cardParent = parent;

    var card = $('<div class="w3-panel w3-card"></div>');
    card.css('min-height', MEDLEY.MINHEIGHTINFOCARD);
    card.css('padding', '3px');
    var tblCard = $('<table border="0"></table>');
    tblCard.css('width', '100%');
    var trCard = $('<tr></tr>');

    var tdThumbnail = $('<td></td>');
    var thumbnail = $('<img src="' + this._imgSrc + '"></img>');
    thumbnail.width(MEDLEY.WIDTHSEARCHTHUMBNAIL);
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
        if (nproperties++ >= MEDLEY.MAXNUMPROPERTIESONCARD) break;
        var nstars = properties[propName];
        var strStars = '';
        for (var i = 0; i < nstars; i++) strStars += MEDLEY.CODEBLACKSTAR;
        for (var i = 0; i < MEDLEY.NUMSTARS - nstars; i++) strStars += MEDLEY.CODEWHITESTAR;
        divProperties.append(propName.replace('_', ' ') + ': ' + strStars + '<br/>');
    }
    tdInfo.append(divProperties);

    divProperties.append(nproperties > MEDLEY.MAXNUMPROPERTIESONCARD ? '...' : '<br/>');


    var btnMore = $('<a href="">Edit</a>')
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
        if (!selected) {
            card.addClass('ui-state-highlight');
            if (this._mesh == undefined) {
                time();
                XAC.readFile(this._meshPath, function (data) {
                    var stlLoader = new THREE.STLLoader();
                    var geometry = stlLoader.parse(data);
                    var object = new THREE.Mesh(geometry, XAC.MATERIALCONTRAST);
                    if (object.geometry.isBufferGeometry)
                        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);

                    this._mesh = object;
                    // this._paxis = XAC.findPrincipalAxis(this._mesh.geometry.vertices).multiplyScalar(-1);
                    // // this._paxis = XAC.findPrincipalAxis(XAC.getBoundingBoxMesh(this._mesh).geometry.vertices);
                    var convexGeometry = new THREE.ConvexGeometry(this._mesh.geometry.vertices);
                    convexGeometry.center();
                    this._paxis = XAC.findPrincipalAxis(convexGeometry.vertices);
                    // XAC.tmpadd(addAnArrow(object.position, this._paxis, 10, 0xff0000))
                    // XAC.tmpadd(object);
                    this._mesh.geometry.center();
                    time('loaded embeddable mesh for ' + this._name);
                }.bind(this));
            }
            MEDLEY._matobjSelected = this;
        } else {
            MEDLEY._matobjSelected = undefined;
        }
    }.bind(this));

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
        this._updateMeshPathInfo();
        this._showSliders();
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
                this._updateMeshPathInfo();
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
        if (this._dim != undefined) {
            $('option[value=' + this._dim + ']').attr('selected', true);
            this._showSliders();
        }

        this._updateMeshPathInfo();


        $('#divDropzone').append(divDropZone);

        $('#divProperties').append(selMaterialProperty);

        for (property in this._properties) this._addPropertyRow(property);

        $('#btnSave').button();
        $('#btnSave').click(function (e) {
            if (this._matobjs != undefined && this._matobjs.indexOf(this) < 0) {
                this._matobjs.push(this);
                MEDLEY.showSearchResults([''], this);
            }
        }.bind(this));

        dialogBody.children().css('font-size', 'large');

        // for (c of dialogBody.children()) {
        //     $(c).css('font-size', 'large');
        // }

    }.bind(this));

    this._dialogBody = dialogBody;
    dialog.append(dialogBody);



    return dialog;
}

//
//
//
MEDLEY.MatObj.prototype._updateCard = function () {
    if (this._cardParent != undefined) {
        if (this._card != undefined) {
            this._card.remove();
            this._cardParent.append(this.getInfoCard(this._cardParent));
        }
    }
}

//
//
//
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

    $('#inputName').keyup(function (e) {
        $('div[name="title"]').dialog('option', 'title', $(this).val() + ' material properties');
        MEDLEY.MatObj.__instance._name = $(this).val();
        MEDLEY.MatObj.__instance._updateCard();
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

//
//
//
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

//
//
//
MEDLEY.MatObj.prototype._showSliders = function () {
    $('#tblMatObjSliders').html('');

    var sldrValueRadius = 100 * (this._radius - MEDLEY.MINRADIUS1D) /
        (MEDLEY.MAXRADIUS1D - MEDLEY.MINRADIUS1D);
    var sldrValueBendRadius = 100 * (this._bendRadius - MEDLEY.MINBENDRADIUS) /
        (MEDLEY.MAXBENDRADIUS - MEDLEY.MINBENDRADIUS);
    var sldrValueThickness = 100 * (this._thickness - MEDLEY.MINTHICKNESS) /
        (MEDLEY.MAXTHICKNESS - MEDLEY.MINTHICKNESS);

    switch (this._dim) {
        case 0:
            //none
            break;
        case 1:
            // radius, bend radius
            this._sldrRadius = XAC.makeSlider('sldrRadius', 'Radius', 0, 100, sldrValueRadius,
                $('#tblMatObjSliders'), true);
            this._sldrBendRadius = XAC.makeSlider('sldrBendRadius', 'Bend radius', 0, 100, sldrValueBendRadius,
                $('#tblMatObjSliders'), true);
            $('#tblMatObjSliders').append($('<br/>'))
            break;
        case 2:
            // thickness, bend radius
            this._sldrThickness = XAC.makeSlider('sldrThickness', 'Thickness', 0, 100, sldrValueThickness,
                $('#tblMatObjSliders'), true);
            this._sldrBendRadius = XAC.makeSlider('sldrBendRadius', 'Bend radius', 0, 100, sldrValueBendRadius,
                $('#tblMatObjSliders'), true);
            $('#tblMatObjSliders').append($('<br/>'))
            break;
        case 3:
            // none
            break;
    }

    if (this._sldrRadius != undefined) {
        var updateFunction = function (e, ui) {
            var max = $(e.target).slider('option', 'max');
            var min = $(e.target).slider('option', 'min');
            var value = (ui.value * 1.0 - min) / (max - min);
            this._radius = MEDLEY.MINRADIUS1D * (1 - value) + MEDLEY.MAXRADIUS1D * value;
            $('#' + $(e.target).attr('idValueLabel')).html(XAC.trim(this._radius, 1) + ' mm');
        }.bind(this);
        this._sldrRadius.slider({
            slide: updateFunction,
            change: updateFunction
        });
        this._sldrRadius.slider('value', sldrValueRadius);
        // XAC.updateSlider(this._sldrRadius, this._radius, MEDLEY.sldrMapFunc);
    }

    if (this._sldrBendRadius != undefined) {
        var updateFunction = function (e, ui) {
            var max = $(e.target).slider('option', 'max');
            var min = $(e.target).slider('option', 'min');
            var value = (ui.value * 1.0 - min) / (max - min);
            this._bendRadius = MEDLEY.MINBENDRADIUS * (1 - value) + MEDLEY.MAXBENDRADIUS * value;
            $('#' + $(e.target).attr('idValueLabel')).html(XAC.trim(this._bendRadius, 0) + ' mm');
        }.bind(this);
        this._sldrBendRadius.slider({
            slide: updateFunction,
            change: updateFunction
        });
        this._sldrBendRadius.slider('value', sldrValueBendRadius);
        // XAC.updateSlider(this._sldrBendRadius, this._bendRadius, MEDLEY.sldrMapFunc);
    }

    if (this._sldrThickness != undefined) {
        var updateFunction = function (e, ui) {
            var max = $(e.target).slider('option', 'max');
            var min = $(e.target).slider('option', 'min');
            var value = (ui.value * 1.0 - min) / (max - min);
            this._thickness = MEDLEY.MINTHICKNESS * (1 - value) + MEDLEY.MAXTHICKNESS * value;
            $('#' + $(e.target).attr('idValueLabel')).html(XAC.trim(this._thickness, 1) + ' mm');
        }.bind(this);
        this._sldrThickness.slider({
            slide: updateFunction,
            change: updateFunction
        });
        this._sldrThickness.slider('value', sldrValueThickness);
        // XAC.updateSlider(this._sldrThickness, this._thickness, MEDLEY.sldrMapFunc);
    }
}

//
//
//
MEDLEY.MatObj.prototype.package = function () {
    var jsonObj = {
        _name: this._name,
        _imgSrc: this._imgSrc,
        _dim: this._dim,
        _meshPath: this._meshPath,
        _properties: this._properties
    };

    switch (this._dim) {
        case 0:
            //none
            break;
        case 1:
            jsonObj._radius = this._radius;
            jsonObj._bendRadius = this._bendRadius;
            break;
        case 2:
            jsonObj._thickness = this._thickness;
            jsonObj._bendRadius = this._bendRadius;
            break;
        case 3:
            // none
            break;
    }

    return jsonObj;
}

//
//
//
MEDLEY.MatObj.prototype._updateMeshPathInfo = function () {
    var msgStl;
    if (this._dim != 0) msgStl = '3D model file not required';
    else {
        if (this._meshPath == undefined) msgStl = '3D model file missing!';
        else msgStl = '3D model file: ' + this._meshPath;
    }
    $('#divInfoMeshPath').html(msgStl);
}