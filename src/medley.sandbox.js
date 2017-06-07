var MEDLEY = MEDLEY || {};

var _fitInfo;

MEDLEY._layerHeight = 0.2;

// XXX
MEDLEY._matobjSelected = {
    radius: 0.75, // mm
    dim: 0,
    thickness: 1, // mm
    bendRadius: 50, // mm
    meshPath: 'embeddables/penny.stl'
    // meshPath: 'embeddables/screw_phillips.stl'
    // meshPath: 'embeddables/screw_fh1.5in.stl'
    // meshPath: 'things/spoon.stl'
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

        //         MEDLEY.make1dFabricatable(embeddable);
        MEDLEY.findExternalInsertion(embeddable);
    });

    XAC.on('S', function () {
        var embeddable = MEDLEY.embeddables.last();
        time();
        var meshReady = MEDLEY.getFabReady(embeddable);
        time('merged all embeddable components');

        var stlStr = stlFromGeometry(meshReady.geometry);
        var blob = new Blob([stlStr], {
            type: 'text/plain'
        });
        saveAs(blob, 'embeddable.stl');
    });

    // XXX for debugging
    // XAC.MATERIALNORMAL = new THREE.MeshBasicMaterial({
    // 	color: 0x888888,
    // 	wireframe: true,
    // 	side: THREE.DoubleSide
    // });

    if (MEDLEY._matobjSelected.meshPath != undefined) {
        time();
        XAC.readFile(MEDLEY._matobjSelected.meshPath, function (data) {
            var stlLoader = new THREE.STLLoader();
            var geometry = stlLoader.parse(data);
            var object = new THREE.Mesh(geometry, XAC.MATERIALCONTRAST);
            if (object.geometry.isBufferGeometry)
                object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);

            MEDLEY._matobjSelected.mesh = object;
            MEDLEY._matobjSelected.paxis = XAC.findPrincipalAxis(
                MEDLEY._matobjSelected.mesh.geometry.vertices);
            MEDLEY._matobjSelected.mesh.geometry.center();
            // XAC.scene.add(MEDLEY._matobjSelected.mesh);
            time('loaded embeddable mesh');
        });
    }
});

//
//
//
MEDLEY.getFabReady = function (embeddable) {
    var merged, extra;
    var material = XAC.MATERIALNORMAL.clone();
    switch (embeddable._dim) {
        case 1:
            merged = embeddable._extrudedSegments.m;
            extra = embeddable._extraSegments == undefined ? undefined : embeddable._extraSegments.m;
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
    if (extra != undefined) {
        XAC.scene.remove(extra);
        var csgExtra = new ThreeBSP(extra);
        csgObject = csgObject.subtract(csgExtra);
    }
    var meshReady = csgObject.toMesh(material);
    XAC.scene.add(meshReady);
    return meshReady;
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