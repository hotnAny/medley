var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.375, // mm
    dim: 1,
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
    XAC.on(XAC.ENTER, function() {
        time();
        var embeddable = MEDLEY._embeddables.last();
        embeddable.fitBendRadius(25)
            //
            // if (XAC._points == undefined) {
            //     XAC._points = [];
            //     var d = embeddable._mapDepth(embeddable._depthRatio);
            //     for (var i = 0; i < embeddable.points0.length; i++) {
            //         XAC._points.push(embeddable.points0[i].clone().multiplyScalar(1 - d)
            //             .add(embeddable.points1[i].clone().multiplyScalar(d)));
            //     }
            // }
            //
            // // for (j = 0; j < 100; j++) {
            //     XAC._points.copy(smoothen1dGeometry(XAC._points));
            //
            //     // XAC._lines = XAC._lines || [];
            //     // for (line of XAC._lines) XAC.scene.remove(line);
            //     // for (var i = 0; i < XAC._points.length - 1; i++) {
            //     //     XAC._lines.push(addALine(XAC._points[i], XAC._points[i + 1], 0xff0000, 1));
            //     // }
            // // }
            // // if (embeddable != undefined) embeddable.selfDestroy();
            // // log(XAC._points[1].toArray());
            // // for (var i = 0; i < XAC._points.length - 1; i++) {
            // //     embeddable._segments[i].updateEfficiently(XAC._points[i], XAC._points[i + 1], embeddable._matobj.radius);
            // // }
            //
            // XAC.scene.remove(embeddable._meshes);
            // embeddable._meshes = new THREE.Object3D();
            // embeddable._segments = [];
            // for (var i = 0; i < XAC._points.length - 1; i++) {
            //     var segment = new XAC.ThickLine(XAC._points[i], XAC._points[i + 1], embeddable._matobj
            //         .radius, embeddable._material.clone());
            //     embeddable._meshes.add(segment.m);
            //     embeddable._segments.push(segment);
            // }
            // XAC.scene.add(embeddable._meshes);

        time('smoothened 1d geometry')
    });

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

});
