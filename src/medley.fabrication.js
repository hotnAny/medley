//	........................................................................................................
//
//  medley fabrication
//      - smoothen geometry to fit material's bend radius
//
//  by xiangchen@acm.org, 04/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

MEDLEY.fit1dBendRadius = function(info, points, r) {
    var minRadiusPrev;
    var eps = 10e-3;
    while (true) {
        var minRadius = MEDLEY._compute1dCurvature(points,info.paramsNormal, r);
        // log(minRadius)
        if (minRadius > r || Math.abs(minRadius - minRadiusPrev) < eps) break;
        MEDLEY._smoothen1dGeometry(points, (r + 1 - minRadius));
        minRadiusPrev = minRadius;
    }
}

MEDLEY._smoothen1dGeometry = function(points, nitr) {
    var c = 0;
    for (j = 0; j < nitr; j++) {
        var pointsSmooth = [points[0]];
        for (var i = 1; i < points.length - 1; i++) {
            var p0 = points[i - 1];
            var p1 = points[i];
            var p2 = points[i + 1];
            var p01 = new THREE.Vector3().addVectors(p0, p1).multiplyScalar(0.5);
            var p12 = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            var q = new THREE.Vector3().addVectors(p01, p12).multiplyScalar(0.5);
            pointsSmooth.push(p1.clone().multiplyScalar(c).add(q.multiplyScalar(1 - c)));
        }
        pointsSmooth.push(points.last());
        points.copy(pointsSmooth);
    }
}

MEDLEY._compute1dCurvature = function(points, paramsPlane, bendRadius) {
    // time();
    // var bendRadius = 50;
    var theta = 30;
    var wing = bendRadius * Math.tan(theta * Math.PI / 180) / 2;

    var pointwiseDists = [0];
    var maxPointwiseDist = 0;
    var footprint = 0;
    for (var i = 0; i < points.length - 1; i++) {
        var dist = points[i].distanceTo(points[i + 1]);
        pointwiseDists.push(dist);
        maxPointwiseDist = Math.max(dist, maxPointwiseDist);
        footprint += dist;
    }
    wing = Math.max(wing, maxPointwiseDist);
    wing = Math.min(footprint / 3, wing);
    // log('wing: ' + wing)

    var start = 0;
    for (var dist = 0; dist < wing; start += 1, dist += pointwiseDists[start]);
    var end = pointwiseDists.length - 1;
    for (var dist = 0; dist < wing; end -= 1, dist += pointwiseDists.lastBut(end));

    // log([start, end])
    var minRadius = bendRadius;
    for (var i = start; i <= end; i++) {
        var localPoints = [];

        // find neighboring points with wing radius
        for (var j = i - 1, dist = 0; j >= 0; j--) {
            dist += points[j].distanceTo(points[j + 1]);
            if (dist > wing) break;
            localPoints.push(points[j]);
        }
        for (var j = i + 1, dist = 0; j < points.length; j++) {
            dist += points[j].distanceTo(points[j - 1]);
            if (dist > wing) break;
            localPoints.push(points[j]);
        }

        // fit to circle and obtain radius
        var paramsLocalPlane;
        try {
            paramsLocalPlane = XAC.findPlaneToFitPoints(localPoints);
        } catch (e) {
            console.error(e);
            paramsLocalPlane = paramsPlane;
        }

        var nml = new THREE.Vector3(paramsLocalPlane.A, paramsLocalPlane.B, paramsLocalPlane.C);
        var zAxis = new THREE.Vector3(0, 0, -1);
        var angleToRotate = nml.angleTo(zAxis);
        var axisToRotate = new THREE.Vector3().crossVectors(nml, zAxis).normalize();
        var projPoints = [];
        for (var j = 0; j < localPoints.length; j++) {
            var proj = XAC.getPointProjectionOnPlane(
                localPoints[j], paramsLocalPlane.A, paramsLocalPlane.B,
                paramsLocalPlane.C, paramsLocalPlane.D);
            proj.applyAxisAngle(axisToRotate, angleToRotate);
            projPoints.push(proj.clone());
        }
        var fitInfo = XAC.fitCircle(projPoints);
        // log(i + ': ' + localPoints.length + ' ' + fitInfo.r);
        minRadius = Math.min(minRadius, fitInfo.r);
    }
    // time('computed curvature')

    return minRadius;
}
