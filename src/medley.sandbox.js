var MEDLEY = MEDLEY || {};

var _fitInfo;

// XXX
MEDLEY._matobjSelected = {
    radius: 0.375, // mm
    dim: 2,
    thickness: 1, // mm
    bendRadius: 30 //mm
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
    XAC.on(XAC.SHIFT, function() {
        MEDLEY.shiftPressed = true;
    });
    XAC.on(XAC.KEYUP, function() {
        MEDLEY.shiftPressed = false;
    });
    XAC.on(XAC.ENTER, function() {
        var embeddable = MEDLEY._embeddables.last();
        // embeddable.fitBendRadius(25)
        time()
        for (var i = 0; i < 100; i++) {
            embeddable._smoothen23dGeometry(embeddable._facesInner);
            embeddable._smoothen23dGeometry(embeddable._facesOuter);
        }

        time('smoothened 2/3d geometry')

        // XAC.scene.remove(embeddable._meshes);
        // embeddable._meshes = undefined;
        // embeddable._generate3dGeometry();

        for (mesh of embeddable._meshes.children) {
            mesh.geometry.verticesNeedUpdate = true;
        }
    });

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

});



//
//  fit an array of THREE.Vector3 points in p to a circle
//
XAC.fitSphere = function(points) {
    var p = [];
    for (point of points) {
        p.push([point.x, point.y, point.z]);
    }

    var M = [],
        X = [],
        Y = [],
        y = [],
        MT, B, c, z, n, l;

    n = p.length;

    for (i = 0; i < n; i++) {
        M.push([p[i][0], p[i][1], p[i][2], 1.0]);
        y.push(p[i][0] * p[i][0] + p[i][1] * p[i][1] + p[i][2] * p[i][2]);
    }

    MT = numeric.transpose(M);
    B = numeric.dot(MT, M);
    c = numeric.dot(MT, y);
    z = numeric.solve(B, c);

    var xm = z[0] * 0.5;
    var ym = z[1] * 0.5;
    var zm = z[2] * 0.5;
    var r = Math.sqrt(z[3] + xm * xm + ym * ym + zm * zm);

    return {
        x0: xm,
        y0: ym,
        z0: zm,
        r: r
    };
}


//
//  find availabel width range of an object at a given point,
//  using the given direction as an axis
//
MEDLEY._findAvailableWidthRange = function(object, point, direction) {
    var materialBbox = XAC.MATERIALINVISIBLE.clone();
    materialBbox.side = THREE.DoubleSide;
    var bbox = XAC.getBoundingBoxMesh(object, materialBbox);
    bbox.geometry.applyMatrix(object.matrixWorld);
    var projCenter = direction.dot(point);
    var projRange = XAC.getRangeOfPointsOnAxis(gettg(bbox).vertices, direction);
    var margin = 0.1;
    return Math.min(projCenter - projRange[0], projRange[1] - projCenter) * (2 - margin);
}
