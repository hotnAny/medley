// ........................................................................................................
//
// handling different object-oriented input techniques by dispatching input events to them
//
// by xiangchen@acm.org, 2017/03
//
// ........................................................................................................

var XAC = XAC || {};

XAC.MOUSEDOWN = 0;
XAC.MOUSEMOVE = 1;
XAC.MOUSEUP = 2;

// XAC.inputTechniques = {};

XAC.mousedown = function(e) {
    XAC.dispatchInputEvents(e, XAC.MOUSEDOWN);
};

XAC.mousemove = function(e) {
    XAC.dispatchInputEvents(e, XAC.MOUSEMOVE);
};

XAC.mouseup = function(e) {
    XAC.dispatchInputEvents(e, XAC.MOUSEUP);
};

XAC.dispatchInputEvents = function(e, type) {
    if (type == XAC.MOUSEDOWN) {
        XAC._activeHits = rayCast(e.clientX, e.clientY, XAC.objects);
    }

    for (var hit of XAC._activeHits) {
        for (eventHandler of hit.object.eventHandlers) {
            // var inputTechnique = XAC.inputTechniques[hit.object];
            // if (inputTechnique != undefined) {
            switch (type) {
                case XAC.MOUSEDOWN:
                    if (eventHandler.mousedown(e, hit) == false) {
                        XAC._activeHits.remove(hit);
                    }
                    break;
                case XAC.MOUSEMOVE:
                    eventHandler.mousemove(e, hit);
                    break;
                case XAC.MOUSEUP:
                    eventHandler.mouseup(e, hit);
                    XAC._activeHits.remove(hit);
                    break;
            }
        }
    }
}

$(document).ready(function() {
    $(document.body).on('mousedown', XAC.mousedown);
    $(document.body).on('mousemove', XAC.mousemove);
    $(document.body).on('mouseup', XAC.mouseup);
    XAC._activeHits = [];
});
