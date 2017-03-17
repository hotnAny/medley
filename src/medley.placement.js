//	........................................................................................................
//
//
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.5, // mm
    dim: 2
};

//
MEDLEY.initPlacementWithPainting = function(info) {
    var diagnal = info.maxPoint.distanceTo(info.minPoint);
    var ctrPlane = new THREE.Vector3().addVectors(info.minPoint, info.maxPoint).divideScalar(2);

    // find cross plane
    info.paramsCross = XAC.findPlaneToFitPoints(info.points);
    var planeCross = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALCONTRAST);
    planeCross.fitTo(ctrPlane, info.paramsCross.A, info.paramsCross.B, info.paramsCross.C);
    XAC.scene.add(planeCross.m);

    // find normal plane
    var pointsExtended = [];
    for (var i = 0; i < info.points.length; i++) {
        var p = info.points[i].clone().add(info.normals[i].clone().multiplyScalar(diagnal));
        pointsExtended.push(p);
    }

    info.paramsNormal = XAC.findPlaneToFitPoints(info.points.concat(pointsExtended));
    var planeNormal = new XAC.Plane(diagnal * 2, diagnal * 2, XAC.MATERIALHIGHLIGHT);
    planeNormal.fitTo(ctrPlane, info.paramsNormal.A, info.paramsNormal.B, info.paramsNormal.C);
    XAC.scene.add(planeNormal.m);

    if (MEDLEY._matobjSelected != undefined) {
        var embeddable = new MEDLEY.Embeddable(MEDLEY._matobjSelected);
        // embeddable.generateGeometry(info);
        switch (embeddable._dim) {
            case 0:
                break;
            case 1:
                MEDLEY.init1dPlacement(info);
                break;
            case 2:
                MEDLEY.init2dPlacement(info);
                break;
            case 3:
                //
                break;
        }
    }

    // remove any temp visualization stuff
    setTimeout(function() {
        XAC.scene.remove(planeCross.m);
        XAC.scene.remove(planeNormal.m);
    }, 500);
};

MEDLEY.init1dPlacement = function(info) {
    // generative material
    embeddable.generateGeometry = function(points) {
        if (this._geometry == undefined) {
            this._geometry = [];
            for (var i = 0; i < points.length - 1; i++) {
                var segment = new XAC.ThickLine(points[i], points[i + 1], this._matobj
                    .radius, XAC.MATERIALHIGHLIGHT);
                this._geometry.push(segment);
                XAC.scene.add(segment.m);
            }
        } else {
            for (var i = 0; i < points.length - 1; i++) {
                var segment = this._geometry[i];
                segment.update(points[i], points[i + 1], this._matobj.radius);
            }
        }
    };
    // embeddable.generateGeometry(info.points);

    // impose ranges for each point
    info.object.material.side = THREE.DoubleSide;
    info.object.material.needsUpdate = true;
    embeddable.points0 = [];
    embeddable.points1 = [];
    for (var i = 0; i < info.points.length; i++) {
        var rayCaster = new THREE.Raycaster();
        var nml = info.normals[i].multiplyScalar(-1).normalize();
        rayCaster.ray.set(info.points[i].clone().add(nml.clone().multiplyScalar(0.01)), nml);
        var hits = rayCaster.intersectObjects([info.object]);
        // _balls.remove(addABall(hits[0].point, 0xff0000, 1));
        if (hits.length > 0) {
            embeddable.points0.push(info.points[i]);
            embeddable.points1.push(hits[0].point);
        }
    }
    info.object.material.side = THREE.FrontSide;
    info.object.material.needsUpdate = true;

    // XXX
    var t = 0.5;
    var points = [];
    for (var i = 0; i < embeddable.points0.length; i++) {
        points.push(embeddable.points0[i].multiplyScalar(1 - t).add(embeddable.points1[i].multiplyScalar(
            t)));
    }
    embeddable.generateGeometry(points);
}

MEDLEY.init2dPlacement = function(info) {
    // 1. find enclosing cylinder
    var nmlCrossPlane = new THREE.Vector3(info.paramsCross.A, info.paramsCross.B, info.paramsCross.C).normalize();
    var projOnNormal = XAC.project(info.points, nmlCrossPlane);
    var heightEnclosing = projOnNormal[1] - projOnNormal[0];
    var projOnCrossPlane = [];
    var zAxis = new THREE.Vector3(0, 0, -1);
    var angleToRotate = nmlCrossPlane.angleTo(zAxis);
    var axisToRotate = new THREE.Vector3().crossVectors(nmlCrossPlane, zAxis).normalize();
    for (var i = 0; i < info.points.length; i++) {
        var proj = getProjection(info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        projOnCrossPlane.push(proj);
        // _balls.remove(addABall(proj, 0x00ffff, 1));
    }
    var enclosingCircle = makeCircle(projOnCrossPlane);
    log(enclosingCircle)
    var centerEnclosing = new THREE.Vector3(enclosingCircle.x, enclosingCircle.y,
        projOnCrossPlane[0].z);
    centerEnclosing.applyAxisAngle(axisToRotate, -angleToRotate);
    // _balls.remove(addABall(centerEnclosing, 0x0000ff, 1.5));
    var radiusEnclosing = enclosingCircle.r;

    // 2. find enclosing triangles
    var facesEnclosed = [];
    var vertices = info.object.geometry.vertices;
    for (var i = 0; i < info.object.geometry.faces.length; i++) {
        var face = info.object.geometry.faces[i];
        var v1 = vertices[face.a];
        var v2 = vertices[face.b];
        var v3 = vertices[face.c];

        if(XAC.testTriCylIntersection(v1, v2, v3, centerEnclosing, nmlCrossPlane.clone(), heightEnclosing, radiusEnclosing)) {
            addATriangle(v1, v2, v3, 0xffff00);
        }
    }
}

//
MEDLEY.initPlacementWithSelection = function(info) {};
