// ........................................................................................................
//
// handling different object-oriented input techniques by dispatching input events to them
//
// by xiangchen@acm.org, 2017/03
//
// ........................................................................................................

var XAC = XAC || {};

// mouse events
XAC.MOUSEDOWN = 0;
XAC.MOUSEMOVE = 1;
XAC.MOUSEUP = 2;

// TODO global mouse event handlers

// keyboard events
XAC.LEFTARROW = 37;
XAC.UPARROW = 38;
XAC.RIGHTARROW = 39;
XAC.DOWNARROW = 40;

XAC.keydowns = {};

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
    if (e.target.nodeName != 'CANVAS') return;
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
    if (XAC.keydowns != undefined) {
        (XAC.keydowns[e.keyCode] || console.error)();
    }
}

XAC.on = function(cue, handler) {
    switch (cue) {
        case XAC.MOUSEDOWN:
            // TODO:
            break;
        case XAC.MOUSEMOVE:
            // TODO
            break;
        case XAC.MOUSEUP:
            // TODO
            break;
        default:
            XAC.keydowns = XAC.keydowns || {};
            if (typeof(cue) == 'string') {
                var key = cue.charCodeAt(0);
                XAC.keydowns[key] = handler;
            } else {
                XAC.keydowns[cue] = handler;
            }
            break;
    }
}

XAC._dispatchInputEvents = function(e, type) {
    if (type == XAC.MOUSEDOWN) {
        XAC._activeHits = rayCast(e.clientX, e.clientY, XAC.objects);
    }

    // select or de-select objects
    switch (type) {
        case XAC.MOUSEUP:
            var tempSelecteds = XAC._selecteds.clone();
            log(tempSelecteds);
            for (object of tempSelecteds) {
                if (e.which == LEFTMOUSE && XAC._footprint < 50) {
                    if (object._selectable) {
                        if (object._selected) {
                            if (object._onDeselected) object._onDeselected();
                            XAC._selecteds.remove(object);
                            object._selected = false;
                        } else {
                            if (object._onSelected) object._onSelected();
                            object._selected = true;
                        }
                    }
                }
            }
            break;
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

                var hitObject = hit.object.object3d || hit.object;
                if (XAC._selecteds.indexOf(hitObject) < 0)
                    XAC._selecteds.push(hitObject);

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
        if (hit.object.inputTechniques != undefined) {
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
}

$(document).ready(function() {
    $(document.body).on('mousedown', XAC.mousedown);
    $(document.body).on('mousemove', XAC.mousemove);
    $(document.body).on('mouseup', XAC.mouseup);
    $(document.body).on('keydown', XAC.keydown);
    XAC._activeHits = [];
});
