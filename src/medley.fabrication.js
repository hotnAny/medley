//	........................................................................................................
//
//  medley fabrication
//      - fit1dBendRadius: smoothen 1d (wire/tube/etc.) geometry to fit material's bend radius
//      - _searchInPrintBendingInsertion: solve fabrication-related problems for 1d (wire/tube/etc.) embeddable geometry
//  by xiangchen@acm.org, 04/2017
//
//	........................................................................................................

var MEDLEY = MEDLEY || {};

//
//  smoothen 1d (wire/tube/etc.) embeddable geometry to fit material's bend radius
//  - info: information of user input
//  - points: a set of points representing the polyline underneath the geometry
//  - r: material's bend radius
//
MEDLEY.fit1dBendRadius = function (info, points, r) {
    var eps = 10e-4;
    var lambda = 0.382;
    var nitr = 0;
    while (true) {
        nitr++;

        var pointsNew = [points[0]];
        var noUpdate = true;
        for (var i = 1; i < points.length - 1; i++) {
            var v0 = points[i - 1];
            var v1 = points[i];
            var v2 = points[i + 1];

            // find the center from v0, v2, assuming the bend radius
            var t = v1.clone().sub(v0).cross(v2.clone().sub(v1));
            var u = v2.clone().sub(v0);
            var w = t.cross(u).normalize();
            var height = Math.sqrt(Math.pow(r, 2) - Math.pow(u.length() / 2, 2));
            var c = v0.clone().add(u.divideScalar(2)).add(w.clone().multiplyScalar(height));

            // if v1 is in this bend-radius-circle, it means a v0-v1-v2 circle has a >r radius
            if (v1.distanceTo(c) <= r + eps) {
                pointsNew.push(v1);
                continue;
            }

            noUpdate = false;

            // where v1 should be to fit the bend radius
            var v1target = c.clone().sub(w.clone().multiplyScalar(r));

            // interpret v1 to the target position
            var lambda1 = lambda * r / v1.distanceTo(c);
            var v1intrpr = v1.clone().multiplyScalar(lambda1).add(v1target.multiplyScalar(1 - lambda1));
            pointsNew.push(v1intrpr);
        }
        pointsNew.push(points.last());

        if (noUpdate) break;

        for (var i = 1; i < points.length - 1; i++) {
            points[i].copy(pointsNew[i]);
        }
    }

    console.info('fit after ' + nitr + ' iterations');
}

//
//  fix the normals of a mesh (e.g., faces facing inwards, faces inside the mesh)
//
MEDLEY.fixFaces = function (mesh) {
    var eps = 0.01;
    mesh.material.side = THREE.BackSide;
    var geometry = mesh.geometry; //gettg(mesh);
    geometry.computeFaceNormals();
    geometry.computeCentroids();
    var rayCaster = new THREE.Raycaster();
    var toRemove = [];
    for (face of geometry.faces) {
        // flip the normal if it intersects with itself from the inside
        var p = face.centroid.clone().add(face.normal.clone().multiplyScalar(eps));
        rayCaster.ray.set(p, face.normal);
        var hits = rayCaster.intersectObjects([mesh]);
        if (hits.length > 0) {
            var temp = face.a;
            face.a = face.b;
            face.b = temp;
            face.normal.multiplyScalar(-1);
        } else {
            continue;
        }

        var q = hits[0].point;

        // if still intersecting after flipping, the face is inside the mesh, remove
        p = face.centroid.clone().add(face.normal.clone().multiplyScalar(eps));
        rayCaster.ray.set(p, face.normal);
        hits = rayCaster.intersectObjects([mesh]);
        if (hits.length > 0) {
            toRemove.push(face);
            // addALine(face.centroid, q, 0x0000ff);
            // _balls.remove(addABall(q, 0x0000ff, 0.25));
            // addALine(face.centroid, hits[0].point, 0x00ff00);
            // _balls.remove(addABall(hits[0].point, 0x00ff00, 0.25));
            return;
        }
    }

    for (face of toRemove) geometry.faces.remove(face);

    log(toRemove.length + ' faces removed');

    // mesh.geometry.computeFaceNormals();
    geometry.normalsNeedUpdate = true;
    mesh.geometry = geometry;
    mesh.material.side = THREE.FrontSide;
}

//
//
//
MEDLEY.findInPrintInsertion = function (embeddable) {
    switch (embeddable._dim) {
        case 1:
            var info = MEDLEY._searchInPrintBendingInsertion(embeddable);
            MEDLEY._digTunnel(info, embeddable);
            break;
        case 0:
        case 2:
        case 3:
            MEDLEY._searchInPrintUnbendingInsertion(embeddable);
            break;
    }
}

//
//  find insertion point externally (supposed to be for 1d only)
//
MEDLEY.findPostPrintInsertion = function (embeddable) {
    switch (embeddable._dim) {
        case 1:
            // compute end points and tangents
            var p0 = embeddable.points[0].clone().applyMatrix4(embeddable._meshes.matrixWorld);
            var p1 = embeddable.points[1].clone().applyMatrix4(embeddable._meshes.matrixWorld);
            var tangent0 = new THREE.Vector3().subVectors(p0, p1).normalize();
            var info0 = MEDLEY._searchPostPrintBendingInsertion(p0, tangent0, embeddable);

            var pn = embeddable.points.last().clone().applyMatrix4(embeddable._meshes.matrixWorld);
            var pn1 = embeddable.points.lastBut(1).clone().applyMatrix4(embeddable._meshes.matrixWorld);
            var tangentn = new THREE.Vector3().subVectors(pn, pn1).normalize();
            var infon = MEDLEY._searchPostPrintBendingInsertion(pn, tangentn, embeddable);

            var info = info0.angle < infon.angle ? info0 : infon;

            MEDLEY._digTunnel(info, embeddable);
            break;
        case 0:
        case 2:
        case 3:
            MEDLEY._searchPostPrintUnbendingInsertion(embeddable);
            break;
    }
};

//
//  solve fabrication-related problems for 1d (wire/tube/etc.) embeddable geometry
//  - embeddable: the embeddable that needs to be embedded
//
MEDLEY._searchInPrintBendingInsertion = function (embeddable) {
    var mat = XAC.MATERIALCONTRAST.clone();
    mat.opacity = 0.25;

    var sq = function (x) {
        return Math.pow(x, 2);
    }

    //  [internal helper] find the cener of circular path that makes the extra 'tunnel'
    //  for inserting at p
    //  - k, b: the parameter of the plane that contains the 'tunnel' (kx - z + b = 0)
    //  - p: an end point of a polyline
    //  - v: the tangent vector at p
    //  - r: the bend radius of the material
    var __findCenter = function (k, b, p, v, r) {
        //  computed by solving the following linear system
        //  - ||cp|| = r
        //  - cp dot v = 0
        //  - c is on the (k, 0, -1, b) plane
        var eps = 10e-6;
        var A = ((b - p.z) * v.z - p.x * v.x - p.y * v.y + eps) / (v.y + eps);
        var B = -(k * v.z + v.x + eps) / (v.y + eps);
        var _a = 1 + sq(B) + sq(k);
        var _b = 2 * (k * (b - p.z) - B * (A + p.y) - p.x);
        var _c = sq(p.x) + sq(A + p.y) + sq(b - p.z) - sq(r);

        var c = new THREE.Vector3();
        c.x = (-_b + Math.sqrt(_b * _b - 4 * _a * _c)) / (2 * _a);
        c.y = B * c.x - A;

        if (c.y < p.y) {
            c.x = (-_b - Math.sqrt(_b * _b - 4 * _a * _c)) / (2 * _a);
            c.y = B * c.x - A;
        }

        c.z = k * c.x + b;

        return c;
    }

    //  [internal helper] find an insertable opening (and the path, or 'tunnel') given:
    //  - p: an end point of a polyline
    //  - v: the tangent vector at p
    //  - h: the height at which to slice and insert
    //  - r: the bend radius of the material
    var __findOpening = function (p, v, h, r) {
        var eps = 10e-6;

        // the vertical plane that contains the 'tunnel': kx - z + b = 0
        var k = (v.z + eps) / (v.x + eps);
        var b = p.z - k * p.x;

        // XXX
        // var plane = new XAC.Plane(100, 100, mat);
        // plane.fitTo(p, k, 0, -1);
        // XAC.scene.add(plane.m)
        // XXX

        // find the center
        var c = __findCenter(k, b, p, v, r);

        // entry points q are the circular path's intersections with the slicing plane
        // computed by solving the following linear system
        //  - q is on the (k, 0, -1, b) plane
        //  - ||cq|| = r
        var _a = 1 + sq(k);
        var _b = 2 * (k * (b - c.z) - c.x);
        var _c = sq(c.x) + sq(b - c.z) - sq(r) + sq(h - c.y);

        var xq = (-_b + Math.sqrt(_b * _b - 4 * _a * _c)) / (2 * _a);
        var zq = k * xq + b;
        var q = new THREE.Vector3(xq, h, zq);

        var angle = p.clone().sub(c).dot(q.clone().sub(c));
        // addALine(p, q.clone(), 0xff0000)

        if (q.clone().sub(p).normalize().dot(v) < 0) {
            q.x = (-_b - Math.sqrt(_b * _b - 4 * _a * _c)) / (2 * _a);
            q.z = k * q.x + b;
        }

        return {
            p: p, //  the original end point
            q: q, //  the entry point
            c: c, //  the center of the ciruclar insertion path
            axis: new THREE.Vector3(k, 0, -1), //  axis of the (k, 0, -1, b) plane
            angle: 1 - p.clone().sub(c).normalize().dot(q.clone().sub(c).normalize()) // angle between cp and cq
        };
    }


    // find the slicing plane
    var bbox = MEDLEY._getBoundingBox(MEDLEY.everything);
    var ymax = bbox.min.y;
    var ymaxPoint;
    for (var i = 0; i < embeddable.points.length; i++) {
        var p = embeddable.points[i];
        p = p.clone().applyMatrix4(embeddable._meshes.matrixWorld);
        if (p.y > ymax) {
            ymax = p.y;
            ymaxPoint = p;
        }
    }
    ymax += MEDLEY.LAYERHEIGHT;

    //
    // compute tangents at the two end points
    //
    var p0 = embeddable.points[0].clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var p1 = embeddable.points[1].clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var tangent0 = new THREE.Vector3().subVectors(p0, p1).normalize();
    var info0 = __findOpening(p0, tangent0, ymax, embeddable.bendRadius);

    var pn = embeddable.points.last().clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var pn1 = embeddable.points.lastBut(1).clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var tangentn = new THREE.Vector3().subVectors(pn, pn1).normalize();
    var infon = __findOpening(pn, tangentn, ymax, embeddable.bendRadius);

    var info = info0.angle < infon.angle ? info0 : infon;

    info.angle = Math.acos(1 - info.angle);
    MEDLEY._digTunnel(info, embeddable);

    // if (embeddable.extra.children.length > 0) {
    //     XAC.scene.add(embeddable.extra);
    // } else {
    //     log('no extra tunnel required')
    // }

    //
    //  compute pausing layer
    //
    var nlayers = (bbox.max.y - bbox.min.y) / MEDLEY.LAYERHEIGHT;
    var percPause = (info.q.y - bbox.min.y) / (bbox.max.y - bbox.min.y);
    var layerPause = (nlayers * percPause - 0.5) | 0;
    console.info('pause at layer #' + layerPause + ' of ' + (nlayers | 0));

    return info;
}

//
//  find optimal insertaion direction for embeddable objects (dof=0)
//
MEDLEY._searchInPrintUnbendingInsertion = function (embeddable) {
    var mesh;
    if (embeddable._dim == 0) {
        mesh = embeddable._mesh;
    } else if (embeddable._dim >= 2) {
        for (m of embeddable._meshes.children)
            if (mesh == undefined) mesh = new THREE.Mesh(gettg(m), m.material);
            else mesh.geometry.merge(gettg(m));
        MEDLEY.fixFaces(mesh);
    }
    var convexGeometry = new THREE.ConvexGeometry(mesh.geometry.vertices);
    var convexHull = new THREE.Mesh(convexGeometry, XAC.MATERIALCONTRAST.clone());
    embeddable._meshes.updateMatrixWorld();
    convexHull.applyMatrix(embeddable._meshes.matrixWorld);
    XAC.tmpadd(convexHull);

    mesh = convexHull;
    var vertices = mesh.geometry.vertices.clone();

    //
    // [internal helper] find the unioned area of polygons (boxes),
    //  between start and end on the x axis, 
    //  where xlist is sorted list of polygons' end points
    //
    var __findUnionArea = function (start, end, xlist, boxes) {
        if (boxes.length == 0) return 0;
        var area = 0;
        // for each consecutive x pair, find the max/min z coordinates to make a slab
        for (var i = start; i < end; i++) {
            var xmin = xlist[i],
                xmax = xlist[i + 1];
            var zmin = Number.MAX_VALUE,
                zmax = -Number.MAX_VALUE;
            for (box of boxes) {
                if (box.min.x <= xmin && box.max.x >= xmax) {
                    zmin = Math.min(zmin, box.min.z);
                    zmax = Math.max(zmax, box.max.z);
                }
            }

            if (zmin == Number.MAX_VALUE || zmax == Number.MIN_VALUE) area += 0;
            else area += (xmax - xmin) * (zmax - zmin);
        }
        return area;
    }

    // higest point and normal, which is where the print will pause for insertation
    var yUp = new THREE.Vector3(0, 1, 0);
    var highestPoint = new THREE.Vector3(0, -Number.MAX_VALUE, 0);
    for (v of vertices) highestPoint = highestPoint.y < v.y ? v.clone() : highestPoint;
    var highestNormal = yUp.clone();
    // _balls.remove(addABall(highestPoint, 0xff0000, 2.5))

    //
    //  a step-wise search for minimum extra cut-off space in order to insert the embeddable
    //
    var minInsertionAngle = 45 * Math.PI / 180; // don't insert at lower than this angle
    var step = 15 * Math.PI / 180; // search step
    var phiStep = step / 3;
    // var thetaStep = step * 2;
    var minVols = Number.MAX_VALUE; // to keep track of min overall cut-off volumes
    var minVolsDirection = undefined; // the corresponding insertion direction
    var minBboxes = undefined; // the corresponding boxes that encapsualte the object

    var sqrt2 = Math.sqrt(2);
    var kk = sqrt2 * (Math.PI * 2 - step) / (sqrt2 - 1);
    var bb = 2 * Math.PI - kk;
    for (var phi = minInsertionAngle; phi <= Math.PI / 2; phi += phiStep) {
        var x = Math.sin(phi);
        var thetaStep = kk * x + bb;
        log([x, thetaStep])
        for (var theta = 0; theta < Math.PI * 2; theta += thetaStep) {
            time();
            var dirInsertion = new THREE.Vector3(Math.sin(theta) * Math.cos(phi),
                Math.sin(phi), Math.cos(theta) * Math.cos(phi)).normalize();

            // matrix to rotate things towards the insertion direction
            var matrixRotation = new THREE.Matrix4();
            var angleToRotate = -yUp.angleTo(dirInsertion);
            var axisToRotate = new THREE.Vector3().crossVectors(yUp, dirInsertion).normalize();
            matrixRotation.makeRotationAxis(axisToRotate, angleToRotate);

            // the transformed highest point and normal
            var __highestPoint = highestPoint.clone().applyAxisAngle(axisToRotate, angleToRotate);
            var __highestNormal = highestNormal.clone().applyAxisAngle(axisToRotate, angleToRotate).normalize();
            // the plane that corresponds to the stop-and-insert layer
            var ceilingPlane = XAC.getPlaneFromPointNormal(__highestPoint, __highestNormal);
            var _a = ceilingPlane.A,
                _b = ceilingPlane.B,
                _c = ceilingPlane.C,
                _d = ceilingPlane.D;

            // layer height
            var dh = MEDLEY.LAYERHEIGHT; // / Math.cos(angleToRotate * Math.PI / 180);

            var bboxes = MEDLEY._getBoundingBoxes(mesh, matrixRotation, dh);

            //
            // compute the volume of cut-off
            // the area of each layer (box) is a union of itself and all the previous layers'
            // the volume of each layer is its area times h, 
            //      where h is the distance from the layer's center to the ceiling plane (see above)
            // to compute the overall volumes without redundantly adding overlapping volumes:
            //  1. compute the effective area of each layer (box), where a is individual area
            //      ea_i = U(a_0, ... , a_i) - U(a_0, ...,  a_i-1)
            //  2. V = âˆ‘ea_i * h_i
            //
            var sumVols = 0;
            var bboxesPrev = [];
            var schedule = new XAC.Sortable(XAC.Sortable.INSERTION);
            for (var i = 0; i < bboxes.length; i++) {
                var bbox = bboxes[i];
                var start = schedule.insert(bbox.min.x);
                var end = schedule.insert(bbox.max.x);
                var xlist = schedule.getSortedList();

                var area = __findUnionArea(start, end, xlist, bboxesPrev);
                bboxesPrev.push(bbox);
                var areaNew = __findUnionArea(start, end, xlist, bboxesPrev);

                areaNew -= area;

                var center = new THREE.Vector3().addVectors(bbox.min, bbox.max).divideScalar(2);
                var ymax = bbox.max.y;
                if (_b != 0) {
                    var y0 = (_a * center.x + _c * center.z + _d) / (-_b);
                    var y1 = (_a * bbox.min.x + _c * bbox.min.z + _d) / (-_b);
                    var y2 = (_a * bbox.max.x + _c * bbox.max.z + _d) / (-_b);
                    ymax = Math.max(center.y + dh, y0);
                    bbox.max.y = Math.max(bbox.min.y + dh, Math.max(y1, y2));
                }

                var vol = areaNew * (ymax - bbox.min.y);
                sumVols += vol;
            }

            if (sumVols < minVols) {
                minVols = sumVols;
                minVolsDirection = dirInsertion;
                minBboxes = bboxes;

                time('theta: ' + ((theta / Math.PI * 180) | 0) +
                    ', phi: ' + ((phi / Math.PI * 180) | 0) +
                    ', vol: ' + XAC.trim(sumVols, 0));
            }
        }
    }

    log('min vols: ' + minVols);

    var center = embeddable._meshes.position;
    XAC._tempElements.push(addAnArrow(center, minVolsDirection, 10, 0xff0000));
    var cutoff = MEDLEY._generateCutoff(minBboxes, minVolsDirection, center);

    //
    // generate cut-off part and align it with the object
    //
    var pausePoint = highestPoint.clone().add(center);
    var bboxObject = XAC.getBoundingBoxEverything(embeddable._object);
    var cutoffTop = XAC.getBoundingBoxMesh(embeddable._object, XAC.MATERIALWIRED);
    cutoffTop.position.copy(pausePoint);
    cutoffTop.position.y += bboxObject.leny / 2;
    cutoff = XAC.subtract(cutoff, cutoffTop, XAC.MATERIALWIRED);
    XAC.tmpadd(cutoff);

    embeddable._cutoff = cutoff;

    var capMaterial = XAC.MATERIALFOCUS.clone();
    capMaterial.opacity = 1.0;
    capMaterial.transparent = false;
    var capRatio = 0.75;
    var bboxCutoff = XAC.getBoundingBoxEverything(mesh);
    cutoffTop.position.y -= bboxCutoff.leny * capRatio;
    // var convexGeometry = new THREE.ConvexGeometry(mesh.geometry.vertices);
    // var convexHull = new THREE.Mesh(convexGeometry, XAC.MATERIALCONTRAST.clone());
    // embeddable._meshes.updateMatrixWorld();
    // convexHull.applyMatrix(embeddable._meshes.matrixWorld);
    // XAC.tmpadd(convexHull);

    // var meshBbox = XAC.getBoundingBoxMesh(mesh);
    XAC.tmpadd(cutoffTop);

    // var cutoffShrunk = cutoff.clone();
    // scaleAroundCenter(cutoffShrunk, 0.9);
    var cap = XAC.subtract(cutoff, mesh);
    cap = XAC.intersect(cap, cutoffTop, capMaterial);
    XAC.tmpadd(cap);
    embeddable._cap = cap;

    // XAC.scene.remove(embeddable._object);

    //
    //  output pause info
    //
    var bbox = MEDLEY._getBoundingBox(MEDLEY.everything);
    var nlayers = (bbox.max.y - bbox.min.y) / MEDLEY.LAYERHEIGHT;
    var percPause = (pausePoint.y - bbox.min.y) / (bbox.max.y - bbox.min.y);
    var layerPause = (nlayers * percPause - 0.5) | 0;
    console.info('pause at layer #' + layerPause + ' of ' + (nlayers | 0));
}

//
//  search for the closest insertion point (supposed to be for 1d only)
//
MEDLEY._searchPostPrintBendingInsertion = function (p, v, embeddable) {
    // find plane perp. to p and v
    var r = embeddable._matobj._bendRadius;
    var params = XAC.getPlaneFromPointNormal(p, v.clone().normalize());

    // find a set of potential centers
    var centers = [];
    var nsteps = 36;
    var yUp = new THREE.Vector3(0, 1, 0);
    var angle = yUp.angleTo(v);
    var axis = yUp.clone().cross(v);
    var tunnelStep = 5 * Math.PI / 180;
    var rayCaster = new THREE.Raycaster();
    var eps = 10e-3;

    var info = {
        p: p,
        q: undefined,
        c: undefined,
        angle: Math.PI * 2
    }
    var minAngle = Math.PI * 2;
    for (var i = 0; i < nsteps; i++) {
        var theta = i * 2 * Math.PI / nsteps;
        var x = r * Math.sin(theta);
        var z = r * Math.cos(theta);
        var c = new THREE.Vector3(x, 0, z);
        c.applyAxisAngle(axis, angle);
        c.add(p);
        centers.push(c);
        // _balls.remove(addABall(c, 0xff0000, 1));

        // compute the tunnel rotation axis
        var tunnelAxis = v.clone().normalize().cross(c.clone().sub(p)).normalize();

        // for each step, compute when it hits the object
        for (var phi = tunnelStep, p0 = p.clone(); phi < Math.PI * 2; phi += tunnelStep) {
            var p1 = p.clone().applyAxisAngleOnPoint(tunnelAxis, c, phi);
            // addALine(p0, p1, 0xff0000);
            rayCaster.ray.set(p1, p0.clone().sub(p1).normalize());
            var hits = rayCaster.intersectObjects([embeddable._object]);
            if (hits.length > 0) {
                q = hits[0].point;
                if (q.distanceTo(p0) + q.distanceTo(p1) <= p0.distanceTo(p1) + eps) {
                    // _balls.remove(addABall(hits[0].point, 0xff0000, 0.5));
                    if (phi < info.angle) {
                        info.angle = phi;
                        info.c = c;
                        info.q = q;
                    }
                }
            }
            p0 = p1;

        }
        // break;
    }

    return info;
};

//
//
//
MEDLEY._searchPostPrintUnbendingInsertion = function (embeddable) {
    var mesh;
    if (embeddable._dim == 0) {
        mesh = embeddable._mesh;
    } else if (embeddable._dim >= 2) {
        for (m of embeddable._meshes.children)
            if (mesh == undefined) mesh = new THREE.Mesh(gettg(m), m.material.clone());
            else mesh.geometry.merge(gettg(m));
        MEDLEY.fixFaces(mesh);
    }

    var tg = mesh.geometry.clone();
    tg.computeFaceNormals();
    tg.computeCentroids();

    // var vertices = mesh.geometry.vertices.clone();
    var faces = tg.faces.clone();
    embeddable._meshes.updateMatrixWorld();
    var center = new THREE.Vector3();
    for (f of faces) {
        f.centroid.applyMatrix4(embeddable._meshes.matrixWorld);
        center.add(f.centroid);
    }
    center.divideScalar(faces.length);

    var step = 15 * Math.PI / 180; // search step
    var rayCaster = new THREE.Raycaster();
    var minAvgDist = Number.MAX_VALUE;
    var minDirection;
    var minMaxDist = 0;
    var eps = 1e-4;
    var lambda = 0.1;

    time();
    var alpha = 0; // Math.PI * Math.random();
    var beta = 0; // Math.PI * Math.random();
    for (var theta = alpha; theta < Math.PI * 2 + alpha; theta += step) {
        for (var phi = beta; phi < 2 * Math.PI + beta; phi += step) {
            var dirInsertion = new THREE.Vector3(Math.sin(theta) * Math.cos(phi),
                Math.sin(phi), Math.cos(theta) * Math.cos(phi)).normalize();

            var avgDistToInsertionPoint = 0;
            var ncounted = 0;
            var maxDist = 0;
            for (f of faces) {
                var v = f.centroid;
                // _balls.remove(addABall(v, 0x00ff00, 0.2));
                rayCaster.ray.set(v, dirInsertion);
                embeddable._object.material.side = THREE.DoubleSide;
                var hitsDouble = rayCaster.intersectObjects([embeddable._object]);
                embeddable._object.material.side = THREE.BackSide;
                var hitsBack = rayCaster.intersectObjects([embeddable._object]);
                if (hitsDouble.length > 0 && hitsBack.length > 0 &&
                    Math.abs(hitsDouble[0].distance - hitsBack[0].distance) < eps) {
                    avgDistToInsertionPoint += hitsBack[0].distance;
                    maxDist = Math.max(maxDist, hitsBack[0].distance);
                }
                ncounted++;

                if (avgDistToInsertionPoint * 2 / faces.length > minAvgDist) break;
            }
            avgDistToInsertionPoint /= ncounted;

            if (avgDistToInsertionPoint > 0 && avgDistToInsertionPoint + eps < minAvgDist) {
                minAvgDist = avgDistToInsertionPoint;
                minDirection = dirInsertion.clone();
                minMaxDist = maxDist;
                log(minDirection.toArray().trim(3).concat(XAC.trim(avgDistToInsertionPoint, 3)));
            }
        }
    }
    time('searched for closest insertion point')
    log(minAvgDist)

    var center = mesh.position.clone().applyMatrix4(embeddable._meshes.matrixWorld);
    XAC._tempElements.push(addAnArrow(center, minDirection, 15, 0xff0000));

    embeddable._object.material.side = THREE.FrontSide;

    // generate and cut off space for insertion
    var yUp = new THREE.Vector3(0, 1, 0);
    var matrixRotation = new THREE.Matrix4();
    var angleToRotate = -yUp.angleTo(minDirection);
    var axisToRotate = new THREE.Vector3().crossVectors(yUp, minDirection).normalize();
    matrixRotation.makeRotationAxis(axisToRotate, angleToRotate);
    var bboxes = MEDLEY._getBoundingBoxes(mesh, matrixRotation, MEDLEY.LAYERHEIGHT);

    var cutoff = MEDLEY._generateCutoff(bboxes, minDirection, center, minMaxDist);
    XAC.tmpadd(cutoff);

    embeddable._cufoff = cutoff;
}

//
//  get many boxes to bound each layer (height: dh) of the mesh 
//  once its rotated with the matrix
//
MEDLEY._getBoundingBoxes = function (mesh, matrixRotation, dh) {
    //
    //  [internal helper] update a bounding box with a new point
    //
    var __updateBbox = function (bboxes, idx, v) {
        bboxes[idx].min.x = Math.min(bboxes[idx].min.x, v.x);
        bboxes[idx].min.z = Math.min(bboxes[idx].min.z, v.z);
        bboxes[idx].max.x = Math.max(bboxes[idx].max.x, v.x);
        bboxes[idx].max.z = Math.max(bboxes[idx].max.z, v.z);
        bboxes[idx].updated = true;
    }

    var rayCaster = new THREE.Raycaster();
    var inflation = 1; // making the boxes slightly larger

    // find the bounding box of the rotated object
    var tg = mesh.geometry.clone();
    tg.applyMatrix(matrixRotation);
    tg.computeBoundingBox();
    var minHeight = tg.boundingBox.min.y;
    var maxHeight = tg.boundingBox.max.y;
    var nlevels = ((maxHeight - minHeight) / dh + 1) | 0;

    // scan the object's vertices, put them into different layers
    var bboxes = [];
    for (var i = 0; i < nlevels; i++) {
        bboxes.push({
            min: new THREE.Vector3(Number.MAX_VALUE, minHeight + i * dh, Number.MAX_VALUE),
            max: new THREE.Vector3(-Number.MAX_VALUE, minHeight + (i + 1) * dh, -Number.MAX_VALUE),
            _ymax: minHeight + (i + 1) * dh,
            updated: false
        });
    }

    for (u of tg.vertices) {
        var idx = (nlevels * (u.y - minHeight) / (maxHeight - minHeight)) | 0;
        idx = Math.min(nlevels - 1, idx);
        __updateBbox(bboxes, idx, u);
    }

    // another pass, at each box, do ray casting to get a more precise bounding box
    var nscan = 36;
    var __material = XAC.MATERIALCONTRAST.clone();
    __material.side = THREE.BackSide;
    var __object = new THREE.Mesh(tg, __material);
    XAC.scene.add(__object);
    for (var j = 0; j < bboxes.length; j++) {
        // if the box hasn't been updated, use the closet ones to approximate
        var box = bboxes[j];
        if (!box.updated) {
            // console.warn('missed bbox at layer #' + j)
            var k = j - 1;
            while (k >= 0 && !bboxes[k].updated) k--;
            __updateBbox(bboxes, j, bboxes[k].min);
            __updateBbox(bboxes, j, bboxes[k].max);
            k = j + 1;
            while (k < bboxes.length && !bboxes[k].updated) k++;
            __updateBbox(bboxes, j, bboxes[k].min);
            __updateBbox(bboxes, j, bboxes[k].max);
        }

        var bboxCenter = new THREE.Vector3().addVectors(box.min, box.max).divideScalar(2);
        for (var i = 0; i < nscan; i++) {
            var alpha = 2 * Math.PI * i / nscan;
            var dir = new THREE.Vector3(Math.sin(alpha), 0, Math.cos(alpha));

            rayCaster.ray.set(bboxCenter, dir.normalize());
            var hits = rayCaster.intersectObjects([__object]);
            if (hits.length > 0) {
                var vhit = hits[0].point.clone().sub(bboxCenter).multiplyScalar(inflation);;
                __updateBbox(bboxes, j, bboxCenter.clone().add(vhit));
                // _balls.remove(addABall(hits[0].point, 0xff0000, 0.25));
            }
        }
    }
    XAC.scene.remove(__object);

    return bboxes;
}

//
//
//
MEDLEY._generateCutoff = function (bboxes, dir, center, maxDist) {
    // [internal helper] transform a set of meshes
    var __unionAndTransform = function (meshes, center, axis, angle, material) {
        var unioned = XAC.union(meshes, material);
        var __o3dCutoff = new THREE.Object3D();
        __o3dCutoff.add(unioned);
        __o3dCutoff.rotateOnAxis(axisToRotate, angleToRotate);
        __o3dCutoff.position.copy(center);
        __o3dCutoff.updateMatrixWorld();
        unioned.applyMatrix(__o3dCutoff.matrixWorld);
        return unioned;
    }

    //
    // assembling the boxes
    //
    var matrixRotation = new THREE.Matrix4();
    var yUp = new THREE.Vector3(0, 1, 0);
    var angleToRotate = yUp.angleTo(dir);
    var axisToRotate = new THREE.Vector3().crossVectors(yUp, dir).normalize();
    matrixRotation.makeRotationAxis(axisToRotate, angleToRotate);
    var layerBoxes = [];
    var __material = XAC.MATERIALFOCUS.clone();

    var leftOverBox;
    for (bbox of bboxes) {
        if (maxDist != undefined) bbox.max.y += maxDist;

        if (leftOverBox != undefined) {
            bbox.max.y = Math.max(bbox.max.y, leftOverBox.max.y);
            bbox.min.y = Math.min(bbox.min.y, leftOverBox.min.y);
        }

        var w = bbox.max.x - bbox.min.x;
        var t = bbox.max.y - bbox.min.y;
        var l = bbox.max.z - bbox.min.z;

        var r = Math.sqrt(w * w + l * l) / 2;

        if (w <= 0 || l <= 0) {
            leftOverBox = bbox;
        } else {
            var box = new XAC.Box(w, t, l, XAC.MATERIALWIRED).m;
            // var box = new XAC.Cylinder(r, t, XAC.MATERIALWIRED, false).m;
            if (box.geometry.isBufferGeometry)
                box.geometry = new THREE.Geometry().fromBufferGeometry(box.geometry);
            box.position.copy(new THREE.Vector3().addVectors(bbox.max, bbox.min).multiplyScalar(0.5));
            layerBoxes.push(box);
            leftOverBox = undefined;
        }

        if (maxDist != undefined) bbox.max.y -= maxDist;
    }

    var cutoff = __unionAndTransform(layerBoxes, center, axisToRotate, angleToRotate, XAC.MATERIALWIRED);

    return cutoff;
}

//
//  make a tunnel based on starting/ending points and center
//
MEDLEY._digTunnel = function (info, embeddable) {
    var step = 5 * Math.PI / 180;
    var axis = info.p.clone().sub(info.c).cross(info.q.clone().sub(info.c)).normalize();
    embeddable.extra = new THREE.Object3D();
    var matTunnel = XAC.MATERIALFOCUS.clone();
    matTunnel.transparent = false;

    var points = [info.p]
    for (var theta = step; theta <= info.angle + step; theta += step) {
        var p = info.p.clone().applyAxisAngleOnPoint(axis, info.c, theta);
        points.push(p);
    }

    if (points.length > 2) {
        var shape = XAC.circularShape(embeddable._matobj._radius, 32);
        embeddable._extraSegments = new XAC.Polyline(shape, points, matTunnel);
        XAC.tmpadd(embeddable._extraSegments.m);
    } else {
        log('no extra tunnel required')
    }
}

//
//  get the bounding box of an object3d
//
MEDLEY._getBoundingBox = function (object3d) {
    var bbox = {
        min: new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
        max: new THREE.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE)
    };

    var __merge = function (bbox2) {
        bbox.min.x = Math.min(bbox.min.x, bbox2.min.x);
        bbox.min.y = Math.min(bbox.min.y, bbox2.min.y);
        bbox.min.z = Math.min(bbox.min.z, bbox2.min.z);

        bbox.max.x = Math.max(bbox.max.x, bbox2.max.x);
        bbox.max.y = Math.max(bbox.max.y, bbox2.max.y);
        bbox.max.z = Math.max(bbox.max.z, bbox2.max.z);
    }

    for (object of object3d.children) {
        if (object.children != undefined && object.children.length > 0) {
            __merge(MEDLEY._getBoundingBox(object));
        } else {
            var gt = gettg(object);
            gt.computeBoundingBox();
            __merge(gt.boundingBox);
        }
    }

    return bbox;
}