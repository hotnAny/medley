var MEDLEY = MEDLEY || {};

var _fitInfo;

XAC._tempElements = [];

// XXX
// MEDLEY._matobjSelected = {
//     radius: 0.75, // mm
//     dim: 0,
//     thickness: 1, // mm
//     bendRadius: 50, // mm
//     meshPath: 'embeddables/penny.stl'
//     // meshPath: 'embeddables/screw_phillips.stl'
//     // meshPath: 'embeddables/screw_fh1.5in.stl'
//     // meshPath: 'things/spoon.stl'
//     // meshPath: 'embeddables/rod1.stl'
// };


// for testing functions
$(document).ready(function () {
    XAC.on('1', function () {
        MEDLEY._matobjSelected.dim = 1;
    });
    XAC.on('2', function () {
        MEDLEY._matobjSelected.dim = 2;
    });
    XAC.on('3', function () {
        MEDLEY._matobjSelected.dim = 3;
    });
    XAC.on(XAC.SHIFT, function () {
        MEDLEY.shiftPressed = true;
    });
    XAC.on(XAC.KEYUP, function () {
        MEDLEY.shiftPressed = false;
    });
    XAC.on(XAC.ESC, function () {
        for (elm of XAC._tempElements) XAC.scene.remove(elm);
    });
    XAC.on('I', function () {
        var embeddable = MEDLEY.embeddables.last();
        MEDLEY.getInstructions(embeddable);

        for (selcted of XAC._selecteds) {
            MEDLEY.getInstructions(selcted.embeddable);
        }
    });
    // XAC.on('S', function () {
    //     time();
    //     var meshReady; // = embeddable._object;
    //     for (selcted of XAC._selecteds) {
    //         if (selcted.embeddable == undefined) continue;
    //         meshReady = meshReady || selcted.embeddable._object;
    //         meshReady = MEDLEY.getFabReady(meshReady, selcted.embeddable);
    //     }
    //     time('merged all embeddable components');

    //     XAC.scene.remove(MEDLEY.everything);

    //     var stlStr = stlFromGeometry(meshReady.geometry);
    //     var blob = new Blob([stlStr], {
    //         type: 'text/plain'
    //     });

    //     MEDLEY.addToDownloadDropdown('object', blob, 'object.stl');
    //     saveAs(blob, 'embeddable.stl');
    // });
    // hide embeddable
    // XAC.on('H', function () {
    //     for (embeddable of MEDLEY.embeddables) {
    //         if (embeddable != undefined && !embeddable._removed) {
    //             embeddable._meshes.visible = !embeddable._meshes.visible;
    //         }

    //     }
    // });
});