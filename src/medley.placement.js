//	........................................................................................................
//
//
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

//
MEDLEY.initPlacementWithPainting = function(info) {
    var diagnal = info.maxPoint.distanceTo(info.minPoint);
    var ctrPlane = new THREE.Vector3().addVectors(info.minPoint, info.maxPoint).divideScalar(2);

    // find cross plane
    var paramsCross = XAC.findPlaneToFitPoints(info.points);
    var planeCross = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALCONTRAST);
    planeCross.fitTo(ctrPlane, paramsCross.A, paramsCross.B, paramsCross.C);
    XAC.scene.add(planeCross.m);

    // find normal plane
    var numPoints = info.points.length;
    for (var i = 0; i < numPoints; i++) {
        var p = info.points[i].clone().add(info.normals[i].clone().multiplyScalar(diagnal));
        info.points.push(p);
        // addABall(p, info.colorPaint, info.radiusPaint);
    }

    var paramsNormal = XAC.findPlaneToFitPoints(info.points);
    var planeNormal = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALHIGHLIGHT);
    planeNormal.fitTo(ctrPlane, paramsNormal.A, paramsNormal.B, paramsNormal.C);
    XAC.scene.add(planeNormal.m);

    setTimeout(function() {
        XAC.scene.remove(planeCross.m);
        XAC.scene.remove(planeNormal.m);
        removeBalls();
    }, 1000);
};

//
MEDLEY.initPlacementWithSelection = function(info) {};
