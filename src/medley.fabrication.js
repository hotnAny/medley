//	........................................................................................................
//
//  medley fabrication
//      - fit1dBendRadius: smoothen 1d (wire/tube/etc.) geometry to fit material's bend radius
//      - make1dFabricatable: solve fabrication-related problems for 1d (wire/tube/etc.) embeddable geometry
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
MEDLEY.fit1dBendRadius = function(info, points, r) {
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
//  solve fabrication-related problems for 1d (wire/tube/etc.) embeddable geometry
//  - embeddable: the embeddable that needs to be embedded
//
MEDLEY.make1dFabricatable = function(embeddable) {
    var mat = XAC.MATERIALCONTRAST.clone();
    mat.opacity = 0.25;

    var sq = function(x) {
        return Math.pow(x, 2);
    }

    //  [internal helper] find the cener of circular path that makes the extra 'tunnel'
    //  for inserting at p
    //  - k, b: the parameter of the plane that contains the 'tunnel' (kx - z + b = 0)
    //  - p: an end point of a polyline
    //  - v: the tangent vector at p
    //  - r: the bend radius of the material
    var __findCenter = function(k, b, p, v, r) {
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
    var __findOpening = function(p, v, h, r) {
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
    var bbox = MEDLEY.getBoundingBox(MEDLEY.everything);
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
    ymax += MEDLEY._layerHeight;

    //
    // compute tangents at the twoend points
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

    var step = 5 * Math.PI / 180;
    var angleBetween = Math.acos(1 - info.angle);
    var axis = info.p.clone().sub(info.c).cross(info.q.clone().sub(info.c)).normalize();
    embeddable.extra = new THREE.Object3D();
    var matTunnel = XAC.MATERIALFOCUS.clone();
    matTunnel.transparent = false;

    //
    //  generate geometry for the 'tunnel'
    //
    var joint = new XAC.Sphere(embeddable._matobj.radius, matTunnel, false);
    if (joint.m.geometry.isBufferGeometry)
        joint.m.geometry = new THREE.Geometry().fromBufferGeometry(joint.m.geometry);
    joint.update(undefined, info.p);
    embeddable.extra.add(joint.m);
    for (var theta = step, p0 = info.p; theta < angleBetween; theta += step) {

        var p1 = info.p.clone().applyAxisAngleOnPoint(axis, info.c, theta);
        var segment = new XAC.ThickLine(p0, p1, embeddable._matobj.radius, matTunnel);
        if (segment.m.geometry.isBufferGeometry)
            segment.m.geometry = new THREE.Geometry().fromBufferGeometry(segment.m.geometry);
        embeddable.extra.add(segment.m);

        joint = new XAC.Sphere(embeddable._matobj.radius, matTunnel, false);
        if (joint.m.geometry.isBufferGeometry)
            joint.m.geometry = new THREE.Geometry().fromBufferGeometry(joint.m.geometry);
        joint.update(undefined, p1);
        embeddable.extra.add(joint.m);

        p0 = p1;
    }

    if (embeddable.extra.children.length > 0) {
        XAC.scene.add(embeddable.extra);
    } else {
        log('no extra tunnel required')
    }

    //
    //  compute pausing layer
    //
    var nlayers = (bbox.max.y - bbox.min.y) / MEDLEY._layerHeight;
    var percPause = (info.q.y - bbox.min.y) / (bbox.max.y - bbox.min.y);
    var layerPause = (nlayers * percPause - 0.5) | 0;
    console.info('pause at layer #' + layerPause + ' of ' + (nlayers | 0));
}

//
//  fix the normals of a mesh (e.g., faces facing inwards, faces inside the mesh)
//
MEDLEY.fixFaces = function(mesh) {
    var eps = 0.01;
    mesh.material.side = THREE.BackSide;
    mesh.geometry.computeFaceNormals();
    mesh.geometry.computeCentroids();
    var rayCaster = new THREE.Raycaster();
    var toRemove = [];
    for(face of mesh.geometry.faces) {
        // flip the normal if it intersects with itself from the inside
        var p = face.centroid.clone().add(face.normal.clone().multiplyScalar(eps));
        rayCaster.ray.set(p, face.normal);
        var hits = rayCaster.intersectObjects([mesh]);
        if(hits.length > 0) {
            var temp = face.a;
            face.a = face.b;
            face.b = temp;
            face.normal.multiplyScalar(-1);
        }

        // if still intersecting after flipping, the face is inside the mesh, remove
        p = face.centroid.clone().add(face.normal.clone().multiplyScalar(eps));
        rayCaster.ray.set(p, face.normal);
        hits = rayCaster.intersectObjects([mesh]);
        if(hits.length > 0) {
            toRemove.push(face);
        }
    }

    for(face of toRemove) mesh.geometry.faces.remove(face);

    // mesh.geometry.computeFaceNormals();
    mesh.geometry.normalsNeedUpdate = true;
    mesh.material.side = THREE.FrontSide;
}