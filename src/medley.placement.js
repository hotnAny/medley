//	........................................................................................................
//
//  medley placement
//      - automatically placing embeddables based on user input
//
//  by xiangchen@acm.org, 03/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

//
//  initialize placement based on the painting technique (xac.input.painting.js)
//
MEDLEY.initPlacementWithPainting = function(info) {
    var epsFootprint = 5;
    if (info.footprint < epsFootprint) return;

    // temporarily setting double-sided for internal ray casting
    info.object.material.side = THREE.DoubleSide;

    // clean up points
    var toRemove = [];
    var eps = 0.25;
    var p0 = info.points[0];
    for (var i = 1; i < info.points.length; i++) {
        var p1 = info.points[i];
        if (p1.distanceTo(p0) < eps) {
            toRemove.push(p1);
        } else {
            p0 = p1;
        }
    }

    for (p of toRemove) {
        info.points.remove(p);
    }

    // compute summary info about user input
    var diagnal = info.maxPoint.distanceTo(info.minPoint);
    var centerPlane = new THREE.Vector3().addVectors(info.minPoint, info.maxPoint).divideScalar(2);
    info.normal = new THREE.Vector3();
    for (nml of info.normals) {
        info.normal.add(nml);
    }
    info.normal.divideScalar(info.normals.length);

    // find cross plane
    info.paramsCross = XAC.findPlaneToFitPoints(info.points);

    // find normal plane
    var pointsExtended = [];
    for (var i = 0; i < info.points.length; i++) {
        var p = info.points[i].clone().add(info.normals[i].clone().multiplyScalar(diagnal));
        pointsExtended.push(p);
    }
    info.paramsNormal = XAC.findPlaneToFitPoints(info.points.concat(pointsExtended));

    // sampling based on material's dimension
    if (MEDLEY._matobjSelected != undefined) {
        var embeddable = new MEDLEY.Embeddable(MEDLEY._matobjSelected);

        // remove all active embeddables to focus on this new one
        for (object of XAC._selecteds) {
            if (object._onDeselected) {
                object._onDeselected();
            }
        }
        XAC._selecteds = [];

        switch (embeddable._dim) {
            case 0:
                // TODO: dim=0 placement
                // TODO: initialize interactors
                break;
            case 1:
                if (XAC._footprint > 50) MEDLEY._init1dPlacement(embeddable, info);

                // TODO: initialize interactors

                break;
            case 2:
            case 3:
                var isLoop = MEDLEY._isLoop(info);
                if (isLoop) {
                    MEDLEY._init2dPatchPlacement(embeddable, info);
                } else if (isLoop == false) {
                    MEDLEY._init2dXsecPlacement(embeddable, info, embeddable._baseWidth, false);
                } else {;
                }

                // TODO: initialize interactors

                break;
        }

        MEDLEY._embeddables.push(embeddable);
    }

    // reset sidedness of object
    info.object.material.side = THREE.FrontSide;
};

//
//  initialize placement of 1d material based on user painting
//
MEDLEY._init1dPlacement = function(embeddable, info) {
    // impose ranges for each point
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

    embeddable._generate1dGeometry(embeddable.points0);
}

//
//  initialize placement of 2d material based on user painting
//
MEDLEY._init2dPatchPlacement = function(embeddable, info) {

    // [internal helper] interpolate between p1 and p2 with t
    var __interpolate = function(p1, p2, t) {
        return p1.clone().add(p2.clone().sub(p1).multiplyScalar(t));
    }

    // [internal helper] recursively find neighbors located within the given circle
    var __findEnclosingNeighbors = function(face, center, radius) {
        face.visited = true;
        var enclosingNeighbors = [];
        for (neighbor of face.neighbors) {
            if (neighbor.visited) continue;
            var vindices = [neighbor.a, neighbor.b, neighbor.c];
            for (idx of vindices) {
                if (vertices[idx].distanceTo(center) < radius) {
                    enclosingNeighbors.push(neighbor);
                    enclosingNeighbors = enclosingNeighbors.concat(
                        __findEnclosingNeighbors(neighbor, center, radius));
                    break;
                }
            }
        }
        return enclosingNeighbors;
    }

    // [internal helper] debug abnormal faces
    var __debugFace = function(face) {
        // info.object.geometry.highlightFace(face, 0xffff00, XAC.scene);
        for (var k = 0; k < face.points.length; k++) {
            var p0 = face.points[k];
            var p1 = face.points[(k + 1) % face.points.length];
            // addALine(p0, p1, 0xff00ff);
            addAnArrow(p0, p1.clone().sub(p0), p1.distanceTo(p0), k == 0 ? 0xff0000 :
                0x000000, 0.01)
        }
    }

    //
    // 1. find enclosing circle
    //
    var nmlCrossPlane = new THREE.Vector3(info.paramsCross.A, info.paramsCross.B, info.paramsCross.C).normalize();
    var zAxis = new THREE.Vector3(0, 0, -1);
    var angleToRotate = nmlCrossPlane.angleTo(zAxis);
    var axisToRotate = new THREE.Vector3().crossVectors(nmlCrossPlane, zAxis).normalize();
    var projPoints = [];
    for (var i = 0; i < info.points.length; i++) {
        // XXX
        // addALine(info.points[i], info.points[(i + 1) % info.points.length], 0xff00ff);
        // _balls.remove(addABall(info.points[i], 0xff0000, 0.1));
        var proj = XAC.getPointProjectionOnPlane(
            info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        projPoints.push(proj.clone());
    }

    // find smallest bounding circle
    var enclosingCircle = makeCircle(projPoints);
    var centerEnclosing = new THREE.Vector3(enclosingCircle.x, enclosingCircle.y,
        projPoints[0].z);
    centerEnclosing.applyAxisAngle(axisToRotate, -angleToRotate);
    var radiusEnclosing = enclosingCircle.r;

    //
    // 2. find enclosing triangles
    //
    var vertices = info.object.geometry.vertices;
    var facesEnclosed = info.faces.clone();
    var moreFacesEnclosed = [];
    for (face of facesEnclosed) {
        moreFacesEnclosed = moreFacesEnclosed.concat(
            __findEnclosingNeighbors(face, centerEnclosing, radiusEnclosing));
        // log(moreFacesEnclosed.length)
    }
    facesEnclosed = facesEnclosed.concat(moreFacesEnclosed);

    //
    // 3. remesh selected area
    //
    var facesRemeshed = [];
    for (face of facesEnclosed) {
        if (face.verticesInside != undefined) continue;

        face.verticesInside = [];

        var vindices = [face.a, face.b, face.c];
        if (face.vertices == undefined) {
            info.object.geometry.assignVerticesToFaces();
        }
        face.vprojs = [];
        for (var i = 0; i < vindices.length; i++) {
            var p = XAC.getPointProjectionOnPlane(face.vertices[i],
                info.paramsCross.A, info.paramsCross.B,
                info.paramsCross.C, info.paramsCross.D);
            p.applyAxisAngle(axisToRotate, angleToRotate);

            face.vprojs.push(p);

            if (XAC.testPointInPolygon(p, projPoints)) {
                face.verticesInside.push(face.vertices[i]);
            }
        }

        // if face is inside, add it directly
        if (face.verticesInside.length >= 3) {
            facesRemeshed.push(face.vertices);
            // info.object.geometry.highlightFace(face, 0xff00ff, XAC.scene);
        }
        // otherwise detect intersection, and remesh the part of the face that's inside the drawing
        else {
            face.points = face.points || [];

            // starting outside a face, rather than in the middle of it to maintain consistent orientation
            var idxStart = 0;
            while (true) {
                idxStart = (idxStart + projPoints.length - 1) % projPoints.length;
                // idxStart = idxpPrev;
                if (!XAC.isInTriangle(projPoints[idxStart],
                        face.vprojs[0], face.vprojs[1], face.vprojs[2])) break;

                if (idxStart == 0) break;
            }

            // collect points inside the face
            for (var i = 0; i < projPoints.length; i++) {
                var idx0 = (idxStart + i) % projPoints.length;
                var p0 = projPoints[idx0];
                var idx1 = (idxStart + i + 1) % projPoints.length;
                var p1 = projPoints[idx1];

                // if a point is in the face, keep it
                if (XAC.isInTriangle(p0, face.vprojs[0], face.vprojs[1], face.vprojs[2])) {
                    face.points.push(info.points[idx0]);
                }

                // detect if current point intersects with the face once connected to the next point
                var intersections = XAC.find2DLineTriangleIntersections(
                    p0, p1, face.vprojs[0], face.vprojs[1], face.vprojs[2]);

                if (intersections.length == 0) continue;

                console.assert(intersections.length <= 2, 'intersecting with a triangle at 2+ points!');

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

            // perform triangulation if a face has more than 2 points collected
            if (face.points.length >= 2) {
                // add vertices of the face inside the drawing
                switch (face.verticesInside.length) {
                    case 1:
                        face.points.push(face.verticesInside[0]);
                        break;
                    case 2:
                        // determine the order if the face has 2 vertices inside
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
                if (triangulation.length == 0) continue;

                // if (triangulation.length / 3 != face.points.length - 2) {
                //     color = 0xffff00; // XXX
                //     __debugFace(face);
                // }

                for (var j = 0; j + 2 < triangulation.length; j += 3) {
                    var va = face.points[triangulation[j]],
                        vb = face.points[triangulation[j + 1]],
                        vc = face.points[triangulation[j + 2]];
                    // triangles.push([va, vb, vc]);
                    facesRemeshed.push([va, vb, vc]);
                }

            } else {
                // handle edge cases: have vertices inside but not intersecting with drawing
                // due to projection error, etc.
                if (face.verticesInside.length > 1) {
                    facesRemeshed.push(face.vertices);
                }
            }
        }
    }

    // clean up
    for (face of facesEnclosed) {
        face.visited = false;
        face.points = undefined;
        face.verticesInside = undefined;
    }

    embeddable._faces0 = facesRemeshed.clone();
    embeddable._faces1 = [];

    // HACK
    var rayCaster = new THREE.Raycaster();
    var nml = nmlCrossPlane.clone().multiplyScalar(-1).normalize();
    if (nml.dot(info.normal) > 0) {
        nml.multiplyScalar(-1);
    }

    var voffset = embeddable._faces0[0][0].clone().add(nml.clone().multiplyScalar(0.01));
    rayCaster.ray.set(voffset, nml);
    var hits = rayCaster.intersectObjects([info.object]);
    if (hits.length == 0) {
        nml = nml.multiplyScalar(-1);
    }

    info.object.material.side = THREE.BackSide;
    for (vs of facesRemeshed) {
        var vertices1 = [];
        for (v of vs) {
            var voffset = v.clone().add(nml.clone().multiplyScalar(0.01));
            rayCaster.ray.set(voffset, nml);
            var hits = rayCaster.intersectObjects([info.object]);
            if (hits.length > 0) {
                vertices1.push(hits[0].point);
            }
        }
        if (vertices1.length > 0) embeddable._faces1.push(vertices1);
    }

    embeddable._generate23dGeometry();
};



//
//  initialize cross sectional selection from a stroke,
//  remesh the selected area as embeddable
//  - embeddable: the embeddable associated with this placement
//  - info: information about user input
//  - width: specific to cross sectional selection --
//      the length of the dimension perpendicular to cross sections
//  - isLite: in a light version, show simple visuals rather than generating a full mesh
//
MEDLEY._init2dXsecPlacement = function(embeddable, info, width, isLite) {
    //
    //  find projections on the normal plane
    //
    var nmlCrossPlane = new THREE.Vector3(info.paramsCross.A, info.paramsCross.B, info.paramsCross.C).normalize();
    var nmlNormalPlane = new THREE.Vector3(info.paramsNormal.A, info.paramsNormal.B,
        info.paramsNormal.C).normalize();
    var zAxis = new THREE.Vector3(0, 0, -1);
    var angleToRotate = nmlNormalPlane.angleTo(zAxis);
    var axisToRotate = new THREE.Vector3().crossVectors(nmlNormalPlane, zAxis).normalize();
    var projPoints = [];
    for (var i = 0; i < info.points.length; i++) {
        var proj = XAC.getPointProjectionOnPlane(
            info.points[i], info.paramsCross.A, info.paramsCross.B,
            info.paramsCross.C, info.paramsCross.D);
        proj.applyAxisAngle(axisToRotate, angleToRotate);
        projPoints.push(proj.clone());
    }

    //
    //  fit selection stroke to a circle
    //
    var fitInfo = XAC.fitCircle(projPoints);
    var fitCenter = new THREE.Vector3(fitInfo.x0, fitInfo.y0, projPoints[0].z);
    fitCenter.applyAxisAngle(axisToRotate, -angleToRotate);

    var minCircleCoverage = 0.02; // if the stroke covers too little of the fitting circle
    if (info.footprint / (2 * Math.PI * fitInfo.r) < minCircleCoverage) {
        fitCenter = undefined;
    }

    // [internal helper] debug problematic faces
    var __debugFace = function(face, points) {
        info.object.geometry.highlightFace(face, 0xffff00, XAC.scene);
        for (var k = 0; k < points.length; k++) {
            var p0 = points[k];
            var p1 = points[(k + 1) % points.length];
            addAnArrow(p0, p1.clone().sub(p0), p1.distanceTo(p0), k == 0 ? 0xff0000 :
                0x000000, 0.01)
        }
    }

    // [internal helper] recursively find neighbors located within the selected cross section
    //  - face: a given face
    //  - a, b, c, d0/d1, width: two parallel planes with width apart,
    //      controling the range of cross section
    //  - center, radius: bounding sphere, if applicable, to remove far-away irrelevant faces
    var __remeshSelectedNeighbors = function(face, a, b, c, d0, d1, width, center, radius) {
        // book keep which faces were visited
        if (face.visited) return [];
        face.visited = true;
        facesVisited.push(face);

        var eps = 10e-3;
        var facesRemeshed = [];
        var intersections0 = [];
        var intersections1 = [];
        var pointsWithin = [];

        // find intersections with the two planes
        for (var i = 0; i < face.vertices.length; i++) {
            var v0 = face.vertices[i];
            var v1 = face.vertices[(i + 1) % face.vertices.length];

            if (center != undefined && v0.distanceTo(center) > radius) return [];

            var proj0 = XAC.getPointProjectionOnPlane(v0, a, b, c, d0);
            var proj1 = XAC.getPointProjectionOnPlane(v0, a, b, c, d1);
            if (v0.distanceTo(proj0) + v0.distanceTo(proj1) <= width + eps) {
                pointsWithin.push(v0);
            }

            var int0 = XAC.findLinePlaneIntersection(v0, v1, a, b, c, d0, true);
            if (int0 != undefined) intersections0.push(int0);
            var int1 = XAC.findLinePlaneIntersection(v0, v1, a, b, c, d1, true);
            if (int1 != undefined) intersections1.push(int1);
        }

        // face is between the two planes
        var intersections = intersections0.concat(intersections1);
        if (pointsWithin.length >= 3) {
            facesRemeshed.push(face.vertices.clone());
        }
        // face intersects with at least one of the planes
        else if (intersections.length > 0) {
            console.assert(intersections0.length + intersections1.length <= 4,
                'intersection error: ' + intersections0.length + ', ' + intersections1.length
            );

            var remeshPoints = intersections.clone();
            // if only 2 intersections, it means 1 or 2 vertices are between the planes
            if (intersections.length == 2) {
                remeshPoints = remeshPoints.concat(pointsWithin);
                // sort when there are 4 points
                if (pointsWithin.length == 2) XAC._sortFourPoints(remeshPoints);
            }
            // if there are 4 intersections, it means 0 or 1 vertice is between the planes
            else if (intersections.length == 4) {
                // sort the existing 4 points
                XAC._sortFourPoints(remeshPoints);
                // add a vertex if it's between the planes
                if (pointsWithin[0] != undefined) {
                    // add it in the middle
                    if (XAC.onSameSide(pointsWithin[0], remeshPoints[1], remeshPoints[0],
                            remeshPoints.last())) {
                        remeshPoints.insert(pointsWithin[0], 2);
                    }
                    // add it to the beginning
                    else {
                        remeshPoints.unshift(pointsWithin[0]);
                    }
                }
            }

            // triangulation
            if (remeshPoints.length >= 3) {
                var triangles = [];
                var triangulation = XAC.triangulatePolygon(remeshPoints, face.normal);

                var color = 0x00ff00;
                console.assert(triangulation.length > 0, 'triangulation failed');
                if (triangulation.length > 0) {
                    // if (triangulation.length / 3 != remeshPoints.length - 2) {
                    //     __debugFace(face, remeshPoints);
                    // }

                    for (var j = 0; j + 2 < triangulation.length; j += 3) {
                        var va = remeshPoints[triangulation[j]],
                            vb = remeshPoints[triangulation[j + 1]],
                            vc = remeshPoints[triangulation[j + 2]];
                        facesRemeshed.push([va, vb, vc]);
                    }
                }
            }
        }

        // recursively deal with face's neighbors
        if (pointsWithin.length > 0 || intersections.length > 0) {
            for (neighbor of face.neighbors) {
                facesRemeshed = facesRemeshed.concat(__remeshSelectedNeighbors(neighbor,
                    a, b, c, d0, d1, width, center, radius));
            }
        }

        return facesRemeshed;
    }

    //
    // cross sectional selection via two cutting planes
    //
    var vertices = info.object.geometry.vertices;
    var facesRemeshed = [];
    var facesVisited = [];
    var a = info.paramsNormal.A,
        b = info.paramsNormal.B,
        c = info.paramsNormal.C,
        d = info.paramsNormal.D;
    var dd = width / 2 * Math.sqrt(a * a + b * b + c * c);
    var d0 = d - dd,
        d1 = d + dd;

    for (face of info.faces) {
        facesRemeshed = facesRemeshed.concat(__remeshSelectedNeighbors(face, a, b, c, d0, d1,
            width, fitCenter, fitInfo.r * 1.414));
    }

    //
    //  a series of post processing
    //

    // clean up
    for (face of facesVisited) {
        face.visited = false;
    }

    // XXX
    if (facesRemeshed.length == 0) {
        console.error('remeshing failed');
        return;
    }

    // compute centroid of the selection
    var centroidRemeshed = new THREE.Vector3();
    for (vs of facesRemeshed) {
        var centroidFace = vs[0].clone().add(vs[1].clone().add(vs[2])).divideScalar(3);
        centroidRemeshed.add(centroidFace);
    }
    centroidRemeshed.divideScalar(facesRemeshed.length);

    embeddable._faces0 = facesRemeshed.clone();
    embeddable._faces1 = [];

    // show simple visuals only if it's lite
    if (isLite) {
        var geometry = new THREE.Geometry();
        var nvertices = 0;
        var eps = 0.1;
        for (triangle of facesRemeshed) {
            var perturbed = [];
            for (v of triangle) {
                var delta = v.clone().sub(centroidRemeshed).normalize().multiplyScalar(eps);
                perturbed.push(v.clone().add(delta));
            }
            geometry.vertices.push(perturbed[0], perturbed[1], perturbed[2]);
            geometry.faces.push(new THREE.Face3(nvertices, nvertices + 1, nvertices + 2));
            nvertices += 3;
        }
        geometry.computeFaceNormals();
        var triangleMeshes = new THREE.Mesh(geometry, XAC.MATERIALHIGHLIGHT.clone());
        triangleMeshes.material.side = THREE.DoubleSide;
        XAC.scene.add(triangleMeshes);
        return triangleMeshes;
    }


    var rayCaster = new THREE.Raycaster();
    var projCenter = nmlCrossPlane.dot(centroidRemeshed);

    // find out the valid range to get cross section
    // also give embeddable access to selection info for future re-selection
    if (embeddable._placementInfo == undefined) {
        embeddable._placementInfo = info;
        var materialBbox = XAC.MATERIALINVISIBLE.clone();
        materialBbox.side = THREE.DoubleSide;
        var bbox = XAC.getBoundingBoxMesh(info.object, materialBbox);
        bbox.geometry.applyMatrix(info.object.matrixWorld);

        var projRange = XAC.getRangeOfPointsOnAxis(gettg(bbox).vertices, nmlCrossPlane);

        var margin = 0.1;
        embeddable._placementInfo._widthRange = Math.max(0, Math.min(projCenter - projRange[0],
            projRange[1] - projCenter) * (2 - margin) - embeddable._baseWidth);

        // log([projCenter - projRange[0], projRange[1] - projCenter])
        // log('valid width range: ' + embeddable._placementInfo._widthRange)
    }

    // finding control points for morphing selected faces
    var toRemove = [];
    for (vs of embeddable._faces0) {
        var vertices1 = [];
        for (v of vs) {
            var proj = centroidRemeshed.clone().add(nmlCrossPlane.clone().normalize().multiplyScalar(
                nmlCrossPlane.dot(v) - projCenter));
            var nml = v.clone().sub(proj).normalize();
            var voffset = v.clone().add(nml.clone().multiplyScalar(0.01));
            rayCaster.ray.set(proj, nml);
            var hits = rayCaster.intersectObjects([info.object]);

            if (hits.length > 0) {
                vertices1.push(hits[0].point);
            } else {
                toRemove.push(vs);
                vertices1 = [];
                break;
            }
        }
        if (vertices1.length > 0) embeddable._faces1.push(vertices1);
    }

    for (vs of toRemove) {
        embeddable._faces0.remove(vs);
    }

    console.assert(embeddable._faces0.length == embeddable._faces1.length,
        'control faces don\'t match!');

    embeddable._generate23dGeometry();
};

//
//
//
MEDLEY.initPlacementWithSelection = function(info) {};


//
//  detect if a drawing is a loop or line (non-loop) or unsure
//
MEDLEY._isLoop = function(info) {
    var minGapRatio = 0.2;
    var maxGapRatio = 0.9;
    info.footprint = 0;
    for (var i = 0; i < info.points.length - 1; i++) {
        info.footprint += info.points[i + 1].distanceTo(info.points[i]);
    }

    var gap = info.points[0].distanceTo(info.points.last());

    gapRatio = gap / info.footprint;
    if (gapRatio < minGapRatio) {
        return true;
    } else if (gapRatio > maxGapRatio) {
        return false;
    } else {
        return;
    }
}

//
//  common internal helper: sort four points so they form a non-self-intersecting polygon
//
XAC._sortFourPoints = function(points) {
    if (points.length != 4) return;

    var v0 = points[1].clone().sub(points[0]);
    var v1 = points[2].clone().sub(points[3]);
    if (v0.dot(v1) < 0) {
        var temp = points[0];
        points[0] = points[1];
        points[1] = temp;
    }
}
