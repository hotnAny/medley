// ---------------------------------------------------------------------------------------
//
// handling different object-oriented input techniques by dispatching input events to them
//
// by xiangchen@acm.org, 2017/03
//
// ---------------------------------------------------------------------------------------

var XAC = XAC || {};

XAC.MOUSEDOWN = 0;
XAC.MOUSEMOVE = 1;
XAC.MOUSEUP = 2;

XAC.inputTechniques = {};

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
    var hits = rayCast(e.clientX, e.clientY, XAC.objects);
    for (var hit of hits) {
        var inputTechnique = XAC.inputTechniques[hit.object];
        if (inputTechnique != undefined) {
            inputTechnique.mousedown(e, hit);
            switch (type) {
                case XAC.MOUSEDOWN:
                    inputTechnique.mousedown(e, hit);
                    break;
                case XAC.MOUSEMOVE:
                    inputTechnique.mousemove(e, hit);
                    break;
                case XAC.MOUSEUP:
                    inputTechnique.mouseup(e, hit);
                    break;
            }
        }
    }
}

$(document).ready(function() {
    $(document.body).on('mousedown', XAC.mousedown);
    $(document.body).on('mousemove', XAC.mousemove);
    $(document.body).on('mouseup', XAC.mouseup);
});
