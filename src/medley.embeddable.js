//	........................................................................................................
//
//  medley embeddable
//
//  by xiangchen@acm.org, 03/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.Embeddable = function(matobj) {
    if (matobj != undefined) {
        this._matobj = matobj;
        this._dim = matobj.dim;
        this._geometry = undefined;
    }
}
