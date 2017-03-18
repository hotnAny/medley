//	........................................................................................................
//
//  medley placement
//      - automatically placing embeddables based on user input
//
//  by xiangchen@acm.org, 03/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

// XXX
MEDLEY._matobjSelected = {
    radius: 0.5, // mm
    dim: 2
};

//
//  initialize placement based on the painting technique (xac.input.painting.js)
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
                MEDLEY._init1dPlacement(info);
                break;
            case 2:
                MEDLEY._init2dPlacement(info);
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

//
//  initialize placement of 1d material based on user painting
//
MEDLEY._init1dPlacement = function(info) {
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

//
//  initialize placement of 2d material based on user painting
//
MEDLEY._init2dPlacement = function(info) {
    //
    //
    // 1. find enclosing cylinder
    var nmlCrossPlane = new THREE.Vector3(info.paramsCross.A, info.paramsCross.B, info.paramsCross.C).normalize();
    var projOnNormal = XAC.project(info.points, nmlCrossPlane);
    var heightEnclosing = projOnNormal[1] - projOnNormal[0];
    var projOnCrossPlane = [];
    var zAxis = new THREE.Vector3(0, 0, -1);
    var angleToRotate = nmlCrossPlane.angleTo(zAxis);
    var axisToRotate = new THREE.Vector3().crossVectors(nmlCrossPlane, zAxis).normalize();
    var projPoints = [];
    for (var i = 0; i < info.points.length; i++) {
        var proj = XAC.getProjection(info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        // _balls.remove(addABall(proj, 0x00ffff, 1));
        // projPoints.push(proj);
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        projOnCrossPlane.push(proj.clone());
        // _balls.remove(addABall(proj, 0x00ffff,  0.5));
    }
    var enclosingCircle = makeCircle(projOnCrossPlane);
    // log(enclosingCircle)
    var centerEnclosing = new THREE.Vector3(enclosingCircle.x, enclosingCircle.y,
        projOnCrossPlane[0].z);
    centerEnclosing.applyAxisAngle(axisToRotate, -angleToRotate);
    // centerEnclosing.add(nmlCrossPlane.clone())
    // _balls.remove(addABall(centerEnclosing, 0x0000ff, 1.5));
    var radiusEnclosing = enclosingCircle.r;

    //
    //
    // 2. find enclosing triangles
    var facesEnclosed = [];
    var vertices = info.object.geometry.vertices;
    for (var i = 0; i < info.object.geometry.faces.length; i++) {
        var face = info.object.geometry.faces[i];
        var v1 = vertices[face.a];
        var v2 = vertices[face.b];
        var v3 = vertices[face.c];

        if (XAC.testTriCylIntersection(v1, v2, v3, centerEnclosing, nmlCrossPlane.clone(),
                heightEnclosing, radiusEnclosing)) {
            facesEnclosed.push(face);
            addATriangle(v1, v2, v3, 0xffff00);
            // * Math.exp(1 + nmlCrossPlane.dot(face.normal))
            // log(nmlCrossPlane.dot(face.normal));
        }
    }

    //
    //
    // 3. remesh selected area
    var facesRemeshed = [];
    var facesOnBoundary = [];
    for (face of facesEnclosed) {
        // is it inside the selected points (boundary)?
        // if so directly add to remesh set
        var isInside = true;
        var vindices = [face.a, face.b, face.c];
        for (var i = 0; i < vindices.length; i++) {
            var p = XAC.getProjection(vertices[vindices[i]], info.paramsCross.A, info.paramsCross.B,
                info.paramsCross.C, info.paramsCross.D);
            p.applyAxisAngle(axisToRotate, angleToRotate);

            if (!XAC.testPointInPolygon(p, projOnCrossPlane)) {
                isInside = false;
                // _balls.remove(addABall(p, 0xff0000, 0.5));
                break;
            }
        }

        // XXX
        var v1 = vertices[face.a];
        var v2 = vertices[face.b];
        var v3 = vertices[face.c];
        if (isInside) {
            facesRemeshed.push(face);
            // XXX
            addATriangle(v1, v2, v3, 0xff00ff);
        }

        // break;

        // if not, is it intersecting with the selected points (boundary)?
        // record relative coordinate on each edge that intersects with the boundary
    }

    for (face of facesOnBoundary) {
        // internally remesh, then add to remesh set
    }
}

//
MEDLEY.initPlacementWithSelection = function(info) {};
