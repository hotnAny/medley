var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.375, // mm
    dim: 2,
    thickness: 2 // mm
};


// for testing functions
$(document).ready(function() {

    XAC.on('1', function() {
        MEDLEY._matobjSelected.dim = 1;
    });
    XAC.on('2', function() {
        MEDLEY._matobjSelected.dim = 2;
    });
    XAC.on('3', function() {
        MEDLEY._matobjSelected.dim = 3;
    });

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

});

function onStlLoaded(object) {

    // var nremoved = object.geometry.removeRedundantFaces();
    // time('[loading object] removed ' + nremoved + ' redundant faces');

    // for (face of object.geometry.faces) {
    //     // log(face.neighbors.length);
    //     if (face.neighbors.length > 3) {
    //         object.geometry.highlightFace(face, 0x00ff00, XAC.scene);
    //         for(neighbor of face.neighbors) {
    //             log(neighbor)
    //             object.geometry.highlightFace(neighbor, 0xff00ff, XAC.scene);
    //         }
    //         return;
    //     }
    // }
    // XXX testing neighbor finding
    // object.on(XAC.MOUSEDOWN, function(hit){
    //     hit.object.geometry.highlightFace(hit.face, 0xff00ff, XAC.scene);
    //     log(hit.face.neighbors)
    //     for(neighbor of hit.face.neighbors) {
    //         hit.object.geometry.highlightFace(neighbor, 0xffff00, XAC.scene);
    //     }
    // });

    // object.on(XAC.UPARROW, function() {
    //     //
    //
    // });

    //
    // input
    // object.inputTechniques = [];
    // object.selectable(true, function(object) {
    //     object.material.opacity /= 2;
    //     // object.material.color = 0xcccccc;
    //     // object.material.needsUpdate = true;
    // }, function(object) {
    //     object.material.opacity *= 2;
    //     // object.material.color = 0x888888;
    //     // object.material.needsUpdate = true;
    // });

    // var paintInput = new MEDLEY.PaintInput(XAC.scene);
    // object.inputTechniques.push(paintInput);
    // paintInput.addSubscriber(MEDLEY.initPlacementWithPainting);



    // XAC.on('Z', function() {
    //     var embeddable = MEDLEY._embeddables.pop();
    //     if (embeddable != undefined) {
    //         embeddable.cleanUp();
    //     }
    // });
}
