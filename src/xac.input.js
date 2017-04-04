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

XAC._selecteds = [];
// XAC.inputTechniques = {};
XAC.mousedownEventHandlers = {};

//
//  [internal helper] compute mouse footprint since last mousedown
//
XAC._updateFootprint = function(x, y) {
    if (x == undefined || y == undefined) {
        XAC._prevCooord = undefined;
        return;
    }

    if (XAC._prevCooord == undefined) {
        XAC._footprint = 0;
    } else {
        XAC._footprint += Math.sqrt(
            Math.pow(x - XAC._prevCooord[0], 2) +
            Math.pow(y - XAC._prevCooord[1], 2));
    }

    XAC._prevCooord = [x, y];
}

XAC.mousedown = function(e) {
    XAC._updateFootprint();
    XAC._dispatchInputEvents(e, XAC.MOUSEDOWN);
};

XAC.mousemove = function(e) {
    XAC._updateFootprint(e.clientX, e.clientY);
    XAC._dispatchInputEvents(e, XAC.MOUSEMOVE);
};

XAC.mouseup = function(e) {
    XAC._updateFootprint(e.clientX, e.clientY);
    XAC._dispatchInputEvents(e, XAC.MOUSEUP);
};

XAC.keydown = function(e) {
    XAC._dispatchInputEvents(e, XAC.KEYDOWN);
}

XAC._dispatchInputEvents = function(e, type) {
    if (type == XAC.MOUSEDOWN) {
        XAC._activeHits = rayCast(e.clientX, e.clientY, XAC.objects);
    }

    // select or de-select objects
    var tempSelecteds = XAC._selecteds.clone();
    for (object of tempSelecteds) {
        switch (type) {
            case XAC.MOUSEUP:
                if (e.which == LEFTMOUSE && XAC._footprint < 25) {
                    if (hit.object._selectable) {
                        if (hit.object._selected) {
                            if (hit.object._onDeselected) hit.object._onDeselected(hit.object);
                            XAC._selecteds.remove(object);
                        } else {
                            if (hit.object._onSelected) hit.object._onSelected(hit.object);
                        }
                        hit.object._selected = !hit.object._selected;
                    }
                }
                break;
        }
    }

    // objects currently being manipulated
    for (hit of XAC._activeHits) {
        // attached handlers
        switch (type) {
            case XAC.MOUSEDOWN:
                if (hit.object.mousedowns != undefined) {
                    for (mousedown of hit.object.mousedowns) {
                        mousedown(hit);
                    }
                }

                if (XAC._selecteds.indexOf(hit.object) < 0)
                    XAC._selecteds.push(hit.object);

                break;
            case XAC.MOUSEMOVE:
                // TODO for mousemoves
                break;
            case XAC.MOUSEUP:
                // TODO
                break;
            case XAC.KEYDOWN:
                if (hit.object.keydowns != undefined) {
                    (hit.object.keydowns[e.keyCode] || console.error)();
                }
                break;
        }

        // input techniques
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
    $(document.body).on('keydown', XAC.keydown);
    XAC._activeHits = [];
});
