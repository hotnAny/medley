var MEDLEY = MEDLEY || {};

// for testing functions
$(document).ready(function() {
    // var a = 0,
    //     b = 1,
    //     c = 0,
    //     d = -1,
    //     p0 = new THREE.Vector3(0, 0, 0),
    //     p1 = new THREE.Vector3(2, 3, 0),
    //     c = new THREE.Vector3(3, 1, -2),
    //     nml = new THREE.Vector3(0, 1, 1),
    //     va = new THREE.Vector3(0, 0, -3),
    //     vb = new THREE.Vector3(-3, 0, 0),
    //     vc = new THREE.Vector3(3, 0, 0),
    //     nml2 = new THREE.Vector3(3, 1, -1),
    //     c1 = c.clone().add(nml2);

    // log(XAC.pointNormalOfPlane(a, b, c, d))
    // log(XAC.findLinePlaneIntersection(p0, p1, a, b, c, d));
    // log(XAC.testTriCylIntersection(va, vb, vc, c, nml, 2, 1));
    // log(XAC.getRangeOfPointsOnAxis([c, c1], nml))

    // var u1 = new THREE.Vector3(0, 0, 2);
    // var u2 = new THREE.Vector3(0, 1, 0);
    // var v1 = new THREE.Vector3(1, 0, 0);
    // var v2 = new THREE.Vector3(-1, 0, 0);
    // log(XAC.distanceBetweenLineSegments(u1, u2, v1, v2));

    // var p = new THREE.Vector3(0, 0, 2);
    // var v1 = new THREE.Vector3(2, 0, 0);
    // var v2 = new THREE.Vector3(4, -2, 0);
    // log(XAC.distanceBetweenPointLineSegment(p, v1, v2));

    // var poly = [
    //     new THREE.Vector3(1, 0, 0),
    //     new THREE.Vector3(2, 0, 0),
    //     new THREE.Vector3(2, 1, 0),
    //     new THREE.Vector3(3, 2, 0),
    //     new THREE.Vector3(2, 3, 0),
    //     new THREE.Vector3(0, 2, 0),
    //     new THREE.Vector3(-1, 1, 0),
    //     new THREE.Vector3(0, -1, 0)
    // ];
    // var triangulation = XAC.triangulatePolygon(poly, new THREE.Vector3(0, 0, 1));
    // log(triangulation)
    // log(XAC.testPointInPolygon(new THREE.Vector3(0, 1, 0), poly));
    // log(XAC.testPointInPolygon(new THREE.Vector3(1, 3, 0), poly));

    // var arr = [1, 2, 3, 4, 5, 6]
    // arr.insert(7, 2);
    // log(arr)

    // var u1 = new THREE.Vector3(-1, 0, 0);
    // var u2 = new THREE.Vector3(-5, 2, 0);
    // var v1 = new THREE.Vector3(0, 3, 0);
    // var v2 = new THREE.Vector3(-2, 5, 0);
    // log(XAC.find2DLineLineIntersection(u1, u2, v1, v2))

    // var triangle = earcut([-1, -1, -1, 1, 1, 1, 1, -1]);
    // log(triangle)
    // var triangle2 = earcut([-1, -1, 1, 1, 1, -1, -1, 1]);
    // log(triangle2)

    // var array = [];
    // array.push(1, 2, 3)
    // log(array)
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
    object.geometry.computeCentroids();
    time('[loading object] computing normals');

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
    // XXX testing neighbor finding
    // object.on(XAC.MOUSEDOWN, function(hit){
    //     hit.object.geometry.highlightFace(hit.face, 0xff00ff, XAC.scene);
    //     log(hit.face.neighbors)
    //     for(neighbor of hit.face.neighbors) {
    //         hit.object.geometry.highlightFace(neighbor, 0xffff00, XAC.scene);
    //     }
    // });

    //
    // input
    object.inputTechniques = [];

    var paintInput = new MEDLEY.PaintInput(XAC.scene);
    object.inputTechniques.push(paintInput);
    paintInput.addSubscriber(MEDLEY.initPlacementWithPainting);
}
