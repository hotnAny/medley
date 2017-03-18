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
XAC.mousedownEventHandlers = {};

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
        // attached handlers
        switch (type) {
            case XAC.MOUSEDOWN:
                for (mousedown of hit.object.mousedowns) {
                    mousedown(hit);
                }
                break;
            case XAC.MOUSEMOVE:
                // TODO for mousemoves
                break;
            case XAC.MOUSEUP:
                // TODO for mouseups
                break;
        }

        // input technique
        for (technique of hit.object.inputTechniques) {
            switch (type) {
                case XAC.MOUSEDOWN:
                    if (technique.mousedown(e, hit) == false) {
                        XAC._activeHits.remove(hit);
                    }
                    break;
                case XAC.MOUSEMOVE:
                    technique.mousemove(e, hit);
                    break;
                case XAC.MOUSEUP:
                    technique.mouseup(e, hit);
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

THREE.Mesh.prototype.on = function(type, handler) {
    switch (type) {
        case XAC.MOUSEDOWN:
            this.mousedowns = this.mousedowns == undefined ? [] : this.mousedowns;
            this.mousedowns.push(handler);
            break;
        case XAC.MOUSEMOVE:
            break;
        case XAC.MOUSEUP:
            break;
    }
}
