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
};

MEDLEY.MatObj.prototype = {
    constructor: MEDLEY.MatObj
};

//
//
//
MEDLEY.MatObj.prototype.getInfoCard = function () {
    var card = $('<div class="w3-panel w3-card"></div>');
    card.css('padding', '5px');
    var tblCard = $('<table border="0"></table>');
    var trCard = $('<tr></tr>');
    
    var tdThumbnail = $('<td></td>');
    var thumbnail = $('<img src="' + this._imgSrc + '"></img>');
    thumbnail.width(MEDLEY.WIDTHSEARCHRESULTITEM);
    thumbnail.css('border-color', '#cccccc');
    tdThumbnail.append(thumbnail);
    
    trCard.append(tdThumbnail);

    var tdInfo = $('<td align="top"></td>');
    tdInfo.css('font-size', 'smaller');
    tdInfo.append($('<b>' + this._name + '</b>'));
    trCard.append(tdInfo);

    tblCard.append(trCard);
    card.append(tblCard);
    return card;
}