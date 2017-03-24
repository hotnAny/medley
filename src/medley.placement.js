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
    // 1. find enclosing circle
    //
    var nmlCrossPlane = new THREE.Vector3(info.paramsCross.A, info.paramsCross.B, info.paramsCross.C).normalize();
    var projOnCrossPlane = [];
    var zAxis = new THREE.Vector3(0, 0, -1);
    var angleToRotate = nmlCrossPlane.angleTo(zAxis);
    var axisToRotate = new THREE.Vector3().crossVectors(nmlCrossPlane, zAxis).normalize();
    var projPoints = [];
    for (var i = 0; i < info.points.length; i++) {
        var proj = XAC.getPointProjectionOnPlane(
            info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        // _balls.remove(addABall(proj, 0x00ffff, 1));
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        projOnCrossPlane.push(proj.clone());
    }
    var enclosingCircle = makeCircle(projOnCrossPlane);
    var centerEnclosing = new THREE.Vector3(enclosingCircle.x, enclosingCircle.y,
        projOnCrossPlane[0].z);
    centerEnclosing.applyAxisAngle(axisToRotate, -angleToRotate);
    var radiusEnclosing = enclosingCircle.r;

    //
    // 2. find enclosing triangles
    //
    var vertices = info.object.geometry.vertices;
    // recursively find neighbors located within the given circle
    var __findEnclosingNeighbors = function(f, ctr, r) {
        f.visited = true;
        var enclosingNeighbors = [];
        for (ff of f.neighbors) {
            if (ff.visited) continue;
            var vindices = [ff.a, ff.b, ff.c];
            for (idx of vindices) {
                if (vertices[idx].distanceTo(ctr) < r) {
                    enclosingNeighbors.push(ff);
                    enclosingNeighbors
                        = enclosingNeighbors.concat(__findEnclosingNeighbors(ff, ctr, r));
                    break;
                }
            }
        }
        return enclosingNeighbors;
    }

    var facesEnclosed = info.faces.clone();
    for (face of facesEnclosed) {
        face.visited = true;
        // info.object.geometry.highlightFace(face, 0x00ff00, XAC.scene);
    }

    var moreFacesEnclosed = [];
    for (face of facesEnclosed) {
        moreFacesEnclosed = moreFacesEnclosed.concat(
            __findEnclosingNeighbors(face, centerEnclosing, radiusEnclosing));
    }

    facesEnclosed = facesEnclosed.concat(moreFacesEnclosed);

    for (face of facesEnclosed) {
        face.visited = false;
    }

    //
    // 3. remesh selected area
    //
    var facesRemeshed = [];
    var facesOnBoundary = info.faces.clone();
    // 3.1 add internal faces directly to the remesh set
    for (face of facesEnclosed) {
        var isInside = true;
        var vindices = [face.a, face.b, face.c];
        var numVerticesOutside = 0;
        for (var i = 0; i < vindices.length; i++) {
            var p = XAC.getPointProjectionOnPlane(vertices[vindices[i]],
                info.paramsCross.A, info.paramsCross.B,
                info.paramsCross.C, info.paramsCross.D);
            p.applyAxisAngle(axisToRotate, angleToRotate);

            if (!XAC.testPointInPolygon(p, projOnCrossPlane)) {
                numVerticesOutside++;
                // _balls.remove(addABall(p, 0xff0000, 0.5));
            }
        }

        if (numVerticesOutside == 0) {
            facesRemeshed.push(face);
            // XXX
            // info.object.geometry.highlightFace(face, 0xff0000, XAC.scene);
        } else if (numVerticesOutside < 3 && facesOnBoundary.indexOf(face) < 0) {
            facesOnBoundary.push(face);
            for (var i = 0; i < facesOnBoundary.length; i++) {
                if (facesOnBoundary[i].neighbors.indexOf(face) >= 0) {
                    facesOnBoundary.insert(face, i + 1);
                    break;
                }
            }
            // XXX
            // info.object.geometry.highlightFace(face, 0x00ff00, XAC.scene);
        }
    }

    // 3.2 remesh faces intersecting the boundary
    var __interpolate = function(p1, p2, t) {
        return p1.clone().add(p2.clone().sub(p1).multiplyScalar(t));
    }

    var idxp = 0;
    for (var i = 0; i < facesOnBoundary.length; i++) {
        var face = facesOnBoundary[i];
        info.object.geometry.highlightFace(face, 0x00ff00, XAC.scene);
        var vindices = [face.a, face.b, face.c];
        var voriginals = [];
        var vprojs = [];
        for (var j = 0; j < vindices.length; j++) {
            voriginals.push(vertices[vindices[j]]);
            var p = XAC.getPointProjectionOnPlane(vertices[vindices[j]],
                info.paramsCross.A, info.paramsCross.B,
                info.paramsCross.C, info.paramsCross.D);
            p.applyAxisAngle(axisToRotate, angleToRotate);
            vprojs.push(p);
        }

        var v1 = vprojs[0],
            v2 = vprojs[1],
            v3 = vprojs[2];

        while (true) {
            var idxpPrev = (idxp + projOnCrossPlane.length - 1) % projOnCrossPlane.length;
            var p0 = projOnCrossPlane[idxpPrev];
            if (!XAC.isInTriangle(p0, v1, v2, v3)) {
                break;
            }
            idxp = idxpPrev;
        }

        for (;; idxp = (idxp + 1) % projOnCrossPlane.length) {
            var idxpPrev = (idxp + projOnCrossPlane.length - 1) % projOnCrossPlane.length;
            var p0 = projOnCrossPlane[idxpPrev];
            var p1 = projOnCrossPlane[idxp];

            // if current face contains the next point
            face.points = face.points || [];
            if (XAC.isInTriangle(p1, v1, v2, v3)) {
                // if it's the first point, look back
                if (face.points.length == 0) {
                    var intersections = XAC.find2DLineTriangleIntersections(p0, p1, v1, v2, v3);
                    if (intersections != undefined) {
                        pints = [];
                        for (int of intersections) {
                            pints.push(__interpolate(voriginals[int.idx1], voriginals[int.idx2], int.t));
                        }

                        // XXX
                        // addALine(pints[0], info.points[idxp], 0xff00ff);
                        //

                        face.points = face.points.concat(pints);
                    }
                } else {
                    // XXX
                    addALine(info.points[idxpPrev], info.points[idxp], 0x0000ff);
                }
                face.points.push(info.points[idxp]);

            }
            // if not, intersect with the current face
            else {
                var intersections = XAC.find2DLineTriangleIntersections(p0, p1, v1, v2, v3);
                pints = [];
                for (int of intersections) {
                    pints.push(__interpolate(voriginals[int.idx1], voriginals[int.idx2], int.t));
                }

                // XXX
                // var tempPoints = [info.points[idxpPrev]].concat(pints).concat([info.points[idxp]]);
                // for (var k = 0; k < tempPoints.length - 1; k++) {
                //     addALine(tempPoints[k], tempPoints[k + 1], k == 0 ? 0x0000ff : 0xff0000);
                // }
                //

                face.points = face.points.concat(pints);
                break;
            }
        }
    }
}

//
MEDLEY.initPlacementWithSelection = function(info) {};
