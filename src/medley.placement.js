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
    // clean up points
    var toRemove = [];
    var eps = 0.25;
    var p0 = info.points[0];
    for (var i = 1; i < info.points.length; i++) {
        var p1 = info.points[i];
        if (p1.distanceTo(p0) < eps) {
            toRemove.push(p1);
            // _balls.remove(addABall(p1, 0xff0000, 0.1));
        } else {
            // _balls.remove(addABall(p1, 0x008800, 0.1));
            p0 = p1;
        }
    }

    for (p of toRemove) {
        info.points.remove(p);
    }


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
    var __interpolate = function(p1, p2, t) {
        return p1.clone().add(p2.clone().sub(p1).multiplyScalar(t));
    }

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
        addALine(info.points[i], info.points[(i + 1) % info.points.length], 0xff00ff);
        // _balls.remove(addABall(info.points[i], 0xff0000, 0.1));
        var proj = XAC.getPointProjectionOnPlane(
            info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        // _balls.remove(addABall(proj, 0xff0000, 0.1));
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
    // for (face of facesEnclosed) {
    //     face.visited = true;
    //     // info.object.geometry.highlightFace(face, 0x000000, XAC.scene, true);
    // }

    var moreFacesEnclosed = [];
    for (face of facesEnclosed) {
        moreFacesEnclosed = moreFacesEnclosed.concat(
            __findEnclosingNeighbors(face, centerEnclosing, radiusEnclosing));
    }
    facesEnclosed = facesEnclosed.concat(moreFacesEnclosed);

    //
    // 3. remesh selected area
    //
    var facesRemeshed = [];
    for (face of facesEnclosed) {
        if (face.verticesInside != undefined) {
            continue;
        }

        face.verticesInside = [];

        var vindices = [face.a, face.b, face.c];
        face.vs = [];
        face.vprojs = [];
        for (var i = 0; i < vindices.length; i++) {
            face.vs.push(vertices[vindices[i]]);
            var p = XAC.getPointProjectionOnPlane(vertices[vindices[i]],
                info.paramsCross.A, info.paramsCross.B,
                info.paramsCross.C, info.paramsCross.D);
            p.applyAxisAngle(axisToRotate, angleToRotate);

            face.vprojs.push(p);

            if (XAC.testPointInPolygon(p, projOnCrossPlane)) {
                face.verticesInside.push(face.vs[i]);
            }
        }


        // if face is inside, add it directly
        if (face.verticesInside.length >= 3) {
            facesRemeshed.push(face);
        }
        // otherwise detect intersection
        else {
            face.points = face.points || [];

            // starting outside a face, rather than in the middle of it to maintain consistent orientation
            var idxStart = 0;
            while (true) {
                var idxpPrev = (idxStart + projOnCrossPlane.length - 1) % projOnCrossPlane.length;
                var p0 = projOnCrossPlane[idxpPrev];
                if (!XAC.isInTriangle(p0, face.vprojs[0], face.vprojs[1], face.vprojs[2])) {
                    break;
                }
                idxStart = idxpPrev;

                if (idxStart == 0) break;
            }

            // collect points inside the face
            for (var i = 0; i < projOnCrossPlane.length; i++) {
                var idx0 = (idxStart + i) % projOnCrossPlane.length;
                var p0 = projOnCrossPlane[idx0];
                var idx1 = (idxStart + i + 1) % projOnCrossPlane.length;
                var p1 = projOnCrossPlane[idx1];

                if (XAC.isInTriangle(p0, face.vprojs[0], face.vprojs[1], face.vprojs[2])) {
                    face.points.push(info.points[idx0]);
                }

                var intersections = XAC.find2DLineTriangleIntersections(
                    p0, p1, face.vprojs[0], face.vprojs[1], face.vprojs[2]);

                if (intersections.length == 0) continue;

                console.assert(intersections.length <= 2);

                var intersectedPoints = [];
                for (int of intersections) {
                    var q = __interpolate(info.points[idx0], info.points[idx1], int.s);
                    intersectedPoints.push(q);
                }

                // if intersecting at two points, determine the order to add them
                // so that they follow the orientation of info.points
                if (intersectedPoints.length == 2) {
                    var v0 = info.points[idx1].clone().sub(info.points[idx0]);
                    var v1 = intersectedPoints[1].clone().sub(intersectedPoints[0]);
                    if (v0.dot(v1) < 0) {
                        var temp = intersectedPoints[0];
                        intersectedPoints[0] = intersectedPoints[1];
                        intersectedPoints[1] = temp;
                    }
                }

                face.points = face.points.concat(intersectedPoints);
            }


            if (face.points.length >= 2) {

                // add vertices of the face inside the drawing
                switch (face.verticesInside.length) {
                    case 1:
                        face.points.push(face.verticesInside[0]);
                        break;
                    case 2:
                        face.points.push(face.verticesInside[0]);
                        face.points.push(face.verticesInside[1]);
                        var triangulation = XAC.triangulatePolygon(face.points, face.normal);
                        if (triangulation.length / 3 != face.points.length - 2) {
                            var temp = face.points[face.points.length - 1];
                            face.points[face.points.length - 1] = face.points[face.points.length - 2];
                            face.points[face.points.length - 2] = temp;
                        }
                        break;
                }

                var triangles = [];
                var triangulation = XAC.triangulatePolygon(face.points, face.normal);

                var color = 0x00ff00;
                console.assert(triangulation.length > 0, 'triangulation failed');
                if (triangulation.length == 0) {

                    // XXX
                    info.object.geometry.highlightFace(face, 0xffff00, XAC.scene);
                    for (var k = 0; k < face.points.length; k++) {
                        var p0 = face.points[k];
                        var p1 = face.points[(k + 1) % face.points.length];
                        // addALine(p0, p1, 0xff00ff);
                        addAnArrow(p0, p1.clone().sub(p0), p1.distanceTo(p0), k == 0 ? 0xff0000 :
                            0x000000, 0.01)
                    }
                    // XXX

                    console.error(face.points)
                    continue;
                }

                if (triangulation.length / 3 != face.points.length - 2) {

                    // XXX
                    color = 0xffff00;
                    // log([triangulation.length, face.points.length])
                    // info.object.geometry.highlightFace(face, 0xff0000, XAC.scene);
                    for (var k = 0; k < face.points.length; k++) {
                        var p0 = face.points[k];
                        var p1 = face.points[(k + 1) % face.points.length];
                        // addALine(p0, p1, 0xff00ff);
                        addAnArrow(p0, p1.clone().sub(p0), p1.distanceTo(p0), k == 0 ? 0xff0000 :
                            0x000000, 0.01)
                    }
                    // return;
                    // XXX

                }

                for (var j = 0; j + 2 < triangulation.length; j += 3) {
                    var va = face.points[triangulation[j]],
                        vb = face.points[triangulation[j + 1]],
                        vc = face.points[triangulation[j + 2]];
                    triangles.push([va, vb, vc]);
                }

                // XXX
                for (t of triangles) {
                    addATriangle(t[0], t[1], t[2], color);
                }
                // XXX

            }
            // XXX
            else {
                // handle edge cases: have vertices inside but not intersecting with drawing
                // due to projection error, etc.
                if (face.verticesInside.length > 1) {
                    facesRemeshed.push(face);
                }
            }
        }
    }

    // XXX
    for (face of facesRemeshed)
        info.object.geometry.highlightFace(face, 0xff00ff, XAC.scene);
    // XXX

    // clean up
    for(face of facesEnclosed) {
        face.visited = false;
        face.points = undefined;
        face.verticesInside = undefined;
    }

}

//
MEDLEY.initPlacementWithSelection = function(info) {};
