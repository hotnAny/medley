var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.5, // mm
    dim: 3,
    thickness: 2 // mm
};


// for testing functions
$(document).ready(function() {

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

    log(!(undefined))

});

function onStlLoaded(object) {
    //
    // geometry processing
    if (object.geometry.isBufferGeometry) {
        time();
        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        time('[loading object] buffergeometry converted');
    }

    object.geometry.computeFaceNormals();
    object.geometry.computeVertexNormals();
    time('[loading object] computed normals');
    object.geometry.computeCentroids();
    time('[loading object] computed centroid');
    object.geometry.assignVerticesToFaces();
    time('[loading object] assigned vertices to faces');
    // var nremoved = object.geometry.removeRedundantFaces();
    // time('[loading object] removed ' + nremoved + ' redundant faces');


    if (XAC.octree != undefined) {
        XAC.octree.add(object, {
            useFaces: true
        });
        XAC.octree.update();
        time('[loading object] added object to octree');
        XAC.octree.setVisibility(false);
    }

    object.geometry.createNeighborList(XAC.octree);
    time('[loading object] created neighbor list for each face');
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
    object.inputTechniques = [];
    object.selectable(true, function(object) {
        object.material.opacity /= 2;
        // object.material.color = 0xcccccc;
        // object.material.needsUpdate = true;
    }, function(object) {
        object.material.opacity *= 2;
        // object.material.color = 0x888888;
        // object.material.needsUpdate = true;
    });

    var paintInput = new MEDLEY.PaintInput(XAC.scene);
    object.inputTechniques.push(paintInput);
    paintInput.addSubscriber(MEDLEY.initPlacementWithPainting);
}
