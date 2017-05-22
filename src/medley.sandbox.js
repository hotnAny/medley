var MEDLEY = MEDLEY || {};

var _fitInfo;

MEDLEY._layerHeight = 0.2;

// XXX
MEDLEY._matobjSelected = {
    radius: 1, // mm
    dim: 1,
    thickness: 1, // mm
    bendRadius: 10 //mm
};


// for testing functions
$(document).ready(function () {
    XAC.on('1', function () {
        MEDLEY._matobjSelected.dim = 1;
    });
    XAC.on('2', function () {
        MEDLEY._matobjSelected.dim = 2;
    });
    XAC.on('3', function () {
        MEDLEY._matobjSelected.dim = 3;
    });
    XAC.on(XAC.SHIFT, function () {
        MEDLEY.shiftPressed = true;
    });
    XAC.on(XAC.KEYUP, function () {
        MEDLEY.shiftPressed = false;
    });
    XAC.on(XAC.ENTER, function () {
        var embeddable = MEDLEY.embeddables.last();

        // XXX testing: randomly rotate everything
        // TODO
        // var anglex = Math.PI * 2 * Math.random();
        // var anglez = Math.PI * 2 * Math.random();
        // MEDLEY.rotateEverything(anglex, anglez, true);
        // XXX done

        // setTimeout(function() {
        MEDLEY.make1dFabricatable(embeddable);
        // }, 100);
    });

    XAC.on('S', function () {
        var embeddable = MEDLEY.embeddables.last();
        time();
        MEDLEY.getFabReady(embeddable);
        time('merged all embeddable components');
    });

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

    // var testObject = {
    //     x: 5,
    //     f: function(y) {
    //         log(this.x + y)
    //     }
    // };

    // testObject.f(4);
});

//
//
//
MEDLEY.getFabReady = function (embeddable) {
    var merged;
    var material = XAC.MATERIALNORMAL.clone();
    switch (embeddable._dim) {
        case 1:
            for (mesh of embeddable._meshes.children) {
                if (mesh.geometry.isBufferGeometry)
                    mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);
            }

            embeddable._meshes.updateMatrixWorld();
            var m = embeddable._meshes.matrixWorld;

            var joints, segments;

            for (var i = 0; i < embeddable.points.length; i++) {
                var p = embeddable.points[i].clone().applyMatrix4(m);
                var joint = new XAC.Sphere(embeddable._matobj.radius, embeddable._material, false);
                if (joint.m.geometry.isBufferGeometry)
                    joint.m.geometry = new THREE.Geometry().fromBufferGeometry(joint.m.geometry);
                joint.update(undefined, p);
                if (i == 0) {
                    // merged = new THREE.Mesh(gettg(joint.m), joint.m.material);
                    merged = new THREE.Mesh(gettg(embeddable._segments[i].m), joint.m.material);
                    // segments = new THREE.Mesh(gettg(embeddable._segments[i].m),
                    //     embeddable._segments[i].m.material.clone());
                    // origin = joint.m.position; //embeddable.points[i].clone().applyMatrix4(m);
                    // for (v of merged.geometry.vertices) v.add(origin);
                } else {
                    // merged.geometry.merge(gettg(joint.m));
                    if (i < embeddable._segments.length) {
                        merged.geometry.merge(gettg(embeddable._segments[i].m));
                    }
                }

            }

            // for (v of merged.geometry.vertices) v.sub(origin);
            // MEDLEY.fixFaces(merged);

            merged.geometry.computeFaceNormals();
            merged.geometry.computeVertexNormals();
            break;
        case 2:
        case 3:
            for (mesh of embeddable._meshes.children) {
                // var meshbsp = new ThreeBSP(mesh);
                if (merged == undefined) {
                    merged = new THREE.Mesh(gettg(mesh), material);
                } else {
                    merged.geometry.merge(gettg(mesh));
                }
            }

            MEDLEY.fixFaces(merged);

            break;
        default:
            break;
    }


    XAC.scene.remove(MEDLEY.everything);
    var csgObject = new ThreeBSP(embeddable._object);
    var csgEmbeddable = new ThreeBSP(merged);
    csgObject = csgObject.subtract(csgEmbeddable);

    XAC.scene.add(csgObject.toMesh(material));
    // XAC.scene.add(csgEmbeddable.toMesh(material));
}

//
//
//
MEDLEY.rotateEverything = function (anglex, anglez, confirmed) {
    MEDLEY.everything.rotateX(anglex);
    MEDLEY.everything.rotateZ(anglez);

    if (confirmed) {
        setTimeout(function () {
            for (emb of MEDLEY.embeddables) {
                if (emb._info == undefined) continue;
                emb._info.object.updateMatrixWorld();
                var matrixWorldOld = emb._info.matrixWorld.clone();
                emb._info.matrixWorld = emb._info.object.matrixWorld.clone();
                var mt = new THREE.Matrix4().getInverse(matrixWorldOld).multiply(emb._info.matrixWorld);
                for (p of emb._info.points) {
                    p.applyMatrix4(mt);
                }
                var pointsExtended = [];
                var diagnal = emb._info.maxPoint.distanceTo(emb._info.minPoint);
                for (var i = 0; i < emb._info.points.length; i++) {
                    var nml = emb._info.normals[i].clone().applyMatrix4(mt);
                    var p = emb._info.points[i].clone().add(nml.multiplyScalar(diagnal));
                    pointsExtended.push(p);
                    // _balls.remove(addABall(p, 0x00ff00, 0.15));
                }
                emb._info.paramsNormal = XAC.findPlaneToFitPoints(emb._info.points.concat(
                    pointsExtended));

            }
        }, 100);
    }
}

//
//
//
MEDLEY.findExternalInsertion = function (embeddable) {
    // compute end points and tangents
    var p0 = embeddable.points[0].clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var p1 = embeddable.points[1].clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var tangent0 = new THREE.Vector3().subVectors(p0, p1).normalize();
    var info0 = FORTE._searchForCloestInserationPoint(p0, tangent0, embeddable._object);

    var pn = embeddable.points.last().clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var pn1 = embeddable.points.lastBut(1).clone().applyMatrix4(embeddable._meshes.matrixWorld);
    var tangentn = new THREE.Vector3().subVectors(pn, pn1).normalize();
    var infon = FORTE._searchForCloestInserationPoint(pn, tangentn, embeddable._object);

    var info = info0.angle < infon.angle ? info0 : infon;

    FORTE._digTunnel(info, embeddable);
}

MEDLEY._digTunnel = function (info, embeddable) {
    var step = 5 * Math.PI / 180;
    var angleBetween = Math.acos(1 - info.angle);
    var axis = info.p.clone().sub(info.c).cross(info.q.clone().sub(info.c)).normalize();
    embeddable.extra = new THREE.Object3D();
    var matTunnel = XAC.MATERIALFOCUS.clone();
    matTunnel.transparent = false;

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
}