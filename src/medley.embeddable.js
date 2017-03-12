//	........................................................................................................
//
//
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
