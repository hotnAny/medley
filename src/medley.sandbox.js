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
    // log(XAC.project([c, c1], nml))

    // var u1 = new THREE.Vector3(0, 0, 2);
    // var u2 = new THREE.Vector3(0, 1, 0);
    // var v1 = new THREE.Vector3(1, 0, 0);
    // var v2 = new THREE.Vector3(-1, 0, 0);
    // log(XAC.distanceBetweenLineSegments(u1, u2, v1, v2));

    var p = new THREE.Vector3(0, 0, 2);
    var v1 = new THREE.Vector3(2, 0, 0);
    var v2 = new THREE.Vector3(4, -2, 0);
    log(XAC.distanceBetweenPointLineSegment(p, v1, v2));
});

function onStlLoaded(object) {
    object.eventHandlers = [];

    var paintInput = new MEDLEY.PaintInput(XAC.scene);
    object.eventHandlers.push(paintInput);
    paintInput.addSubscriber(MEDLEY.initPlacementWithPainting);

    // XAC.inputTechniques[object] = new MEDLEY.PaintInput(XAC.scene);

    if (object.geometry.isBufferGeometry) {
        object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);
        log('buffergeometry converted.')
    }

    object.geometry.computeFaceNormals();
    object.geometry.computeVertexNormals();
}
