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
    MEDLEY.everything.children = [];

    MEDLEY.everything.add(object);

    //
    // geometry processing
    //
    if (object.geometry.isBufferGeometry) {
        time();
        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        time('[loading object] buffergeometry converted');
    }

    object.geometry.center();

    object.geometry.computeFaceNormals();
    object.geometry.computeVertexNormals();
    time('[loading object] computed normals');
    object.geometry.computeCentroids();
    time('[loading object] computed centroid');
    object.geometry.assignVerticesToFaces();
    time('[loading object] assigned vertices to faces');

    //
    //  octree
    //
    XAC.octree = new THREE.Octree({
        undeferred: true,
        depthMax: Infinity,
        objectsThreshold: 8,
    });

    XAC.octree.add(object, {
        useFaces: true
    });
    XAC.octree.update();
    time('[loading object] added object to octree');
    XAC.octree.setVisibility(false);


    object.geometry.createNeighborList(XAC.octree);
    time('[loading object] created neighbor list for each face');


    //
    //  input techniques
    //
    $(document.body).on('mousedown', XAC.mousedown);
    $(document.body).on('mousemove', XAC.mousemove);
    $(document.body).on('mouseup', XAC.mouseup);
    $(document.body).on('keydown', XAC.keydown);
    $(document.body).on('keyup', XAC.keyup);
    XAC._activeHits = [];

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