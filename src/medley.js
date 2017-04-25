//	........................................................................................................
//
//  medley main js
//
//  by xiangchen@acm.org, 04/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

$(document).ready(function() {
    MEDLEY.embeddables = [];
    MEDLEY.everything = new THREE.Object3D();
    XAC.scene.add(MEDLEY.everything);
});

MEDLEY.onStlLoaded = function(object) {
    MEDLEY.everything.add(object);

    //
    // geometry processing
    //
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

    object.inputTechniques = [];

    var paintInput = new MEDLEY.PaintInput(XAC.scene);
    object.inputTechniques.push(paintInput);
    paintInput.addSubscriber(MEDLEY.selectToCreateEmbeddables);

}

//
//
//
MEDLEY.updateEverything = function(object) {
    var everythingOld = MEDLEY.everything;
    XAC.scene.remove(everythingOld);
    MEDLEY.everything = new THREE.Object3D();
    MEDLEY.everything.add(everythingOld);
    MEDLEY.everything.add(object);
    XAC.scene.add(MEDLEY.everything);

}
