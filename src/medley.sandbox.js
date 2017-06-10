var MEDLEY = MEDLEY || {};

var _fitInfo;

MEDLEY._layerHeight = 0.2;

// XXX
MEDLEY._matobjSelected = {
    radius: 0.75, // mm
    dim: 0,
    thickness: 1, // mm
    bendRadius: 50, // mm
    // meshPath: 'embeddables/penny.stl'
    // meshPath: 'embeddables/screw_phillips.stl'
    // meshPath: 'embeddables/screw_fh1.5in.stl'
    // meshPath: 'things/spoon.stl'
    meshPath: 'embeddables/rod1.stl'
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

        // MEDLEY.findExternalInsertion(embeddable);

        MEDLEY.find0dInternalInsertion(embeddable);
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

    // var sortable = new XAC.Sortable(XAC.Sortable.INSERTION);
    // log(sortable.insert(44.4958342));
    // sortable.print();
    // log(sortable.insert(58.45431));
    // sortable.print(); //
    // log(sortable.insert(95.345347));
    // sortable.print(); //);
    // log(sortable.insert(81.4565));
    // sortable.print(); //);
    // log(sortable.insert(559.0565));
    // sortable.print(); //);
    // log(sortable.insert(46.345654));
    // sortable.print(); //);
    // log(sortable.insert(12.45658));
    // sortable.print(); //);

    var maxHeight = 5;
    var bboxes = [];
    var __insertBox = function (x0, x1, y0, y1, z0, z1, bboxes) {
        bboxes.push({
            min: {
                x: x0,
                y: y0,
                z: z0
            },
            max: {
                x: x1,
                y: y1,
                z: z1
            }
        });
    }

    __insertBox(0, 3, 0, 1, 0, 2, bboxes);
    __insertBox(-1, 1, 1, 2, -1, 1, bboxes);
    __insertBox(-2, 2, 2, 3, -2, 3, bboxes);
    __insertBox(-1, 1, 3, 4, 0, 2, bboxes);
    __insertBox(3, 4, 4, 5, -2, 0, bboxes);

    
});

//
//
//
MEDLEY.getFabReady = function (embeddable) {
    // merged and extra are the ultimate 'things' that need to be removed from the object for insertion
    var merged, extra;
    var material = XAC.MATERIALNORMAL.clone();
    switch (embeddable._dim) {
        case 0:
            break;
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
// MEDLEY.rotateEverything = function (anglex, anglez, confirmed) {
//     MEDLEY.everything.rotateX(anglex);
//     MEDLEY.everything.rotateZ(anglez);

//     if (confirmed) {
//         setTimeout(function () {
//             for (emb of MEDLEY.embeddables) {
//                 if (emb._info == undefined) continue;
//                 emb._info.object.updateMatrixWorld();
//                 var matrixWorldOld = emb._info.matrixWorld.clone();
//                 emb._info.matrixWorld = emb._info.object.matrixWorld.clone();
//                 var mt = new THREE.Matrix4().getInverse(matrixWorldOld).multiply(emb._info.matrixWorld);
//                 for (p of emb._info.points) {
//                     p.applyMatrix4(mt);
//                 }
//                 var pointsExtended = [];
//                 var diagnal = emb._info.maxPoint.distanceTo(emb._info.minPoint);
//                 for (var i = 0; i < emb._info.points.length; i++) {
//                     var nml = emb._info.normals[i].clone().applyMatrix4(mt);
//                     var p = emb._info.points[i].clone().add(nml.multiplyScalar(diagnal));
//                     pointsExtended.push(p);
//                     // _balls.remove(addABall(p, 0x00ff00, 0.15));
//                 }
//                 emb._info.paramsNormal = XAC.findPlaneToFitPoints(emb._info.points.concat(
//                     pointsExtended));

//             }
//         }, 100);
//     }
// }

//
//
//
MEDLEY.find0dInternalInsertion = function (embeddable) {
    var dirInsertion = new THREE.Vector3(0, 1, 0).normalize();
    var dh = MEDLEY._layerHeight;
    var vertices = embeddable._mesh.geometry.vertices.clone();

    // temporarilly rotate the object along the insertion direction
    var mr = new THREE.Matrix4();
    var yUp = new THREE.Vector3(0, 1, 0);
    var angleToRotate = -yUp.angleTo(dirInsertion);
    var axisToRotate = new THREE.Vector3().crossVectors(yUp, dirInsertion).normalize();
    mr.makeRotationAxis(axisToRotate, angleToRotate);

    // find the bounding box of the rotated object
    // var boundingInfo = getBoundingBoxEverything(embeddable._mesh);
    var tg = embeddable._mesh.geometry.clone();
    tg.applyMatrix(mr);
    tg.computeBoundingBox();
    var minHeight = tg.boundingBox.min.y;
    var maxHeight = tg.boundingBox.max.y;
    _balls.remove(addABall(tg.boundingBox.min, 0x00ff00, 1));
    _balls.remove(addABall(tg.boundingBox.max, 0x0000ff, 1));
    var nlevels = ((maxHeight - minHeight) / dh + 1) | 0;

    log(nlevels)

    // scan the object's vertices, put them into different layers
    var bboxes = [];
    for (var i = 0; i < nlevels; i++) {
        bboxes.push({
            min: new THREE.Vector3(Number.MAX_VALUE, minHeight + i * dh, Number.MAX_VALUE),
            max: new THREE.Vector3(Number.MIN_VALUE, minHeight + (i + 1) * dh, Number.MIN_VALUE)
        });
    }

    var __updateBbox = function (bboxes, idx, v) {
        bboxes[idx].min.x = Math.min(bboxes[idx].min.x, v.x);
        bboxes[idx].min.z = Math.min(bboxes[idx].min.z, v.z);
        bboxes[idx].max.x = Math.max(bboxes[idx].max.x, v.x);
        bboxes[idx].max.z = Math.max(bboxes[idx].max.z, v.z);
    }

    for (v of vertices) {
        var u = v.clone().applyMatrix4(mr);
        var idx = (nlevels * (u.y - minHeight) / (maxHeight - minHeight)) | 0;
        idx = Math.min(nlevels - 1, idx);
        __updateBbox(bboxes, idx, u);
        // var _color = 0x0000ff * idx;
        // _balls.remove(addABall(u, _color, 0.25));
    }

    // [debug]
    // for (bbox of bboxes) {
    //     var w = bbox.max.x - bbox.min.x;
    //     var t = bbox.max.y - bbox.min.y;
    //     var l = bbox.max.z - bbox.min.z;
    //     var box = new XAC.Box(w, t, l).m;
    //     box.position.copy(new THREE.Vector3().addVectors(bbox.max, bbox.min).multiplyScalar(0.5));
    //     XAC.scene.add(box);
    // }

    // var __getIntersectionBox = function (box1, box2) {
    //     // var w = Math.min(box1.max.x, box2.max.x) - Math.max(box1.min.x, box2.min.x);
    //     // var l = Math.min(box1.max.z, box2.max.z) - Math.max(box1.min.z, box2.min.z);
    //     var box = {
    //         min: {
    //             x: Math.max(box1.min.x, box2.min.x),
    //             z: Math.max(box1.min.z, box2.min.z)
    //         },
    //         max: {
    //             x: Math.min(box1.max.x, box2.max.x),
    //             z: Math.min(box1.max.z, box2.max.z)
    //         }
    //     };

    //     // var w = box.max.x - box.min.x;
    //     // var l = box.max.z - box.min.z;

    //     return box;
    // };


    var __findUnionArea = function (start, end, xlist, boxes) {
        if (boxes.length == 0) return 0;
        var area = 0;
        for (var i = start; i < end; i++) {
            var xmin = xlist[i],
                xmax = xlist[i + 1];
            var zmin = Number.MAX_VALUE;
            var zmax = -Number.MAX_VALUE;
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

    var sumVols = 0;
    var xvalues = [];
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
        var vol = areaNew * (maxHeight - bbox.min.y);
        log(vol)
        sumVols += vol;
        // xvalues = xvaluesNew;
    }

    log(sumVols)

    // rotate the object back
    // rotateGeoTo(obj, dirInsertion);
    rotateGeoTo(embeddable._mesh, dirInsertion, true);

    // generate cut-off part and align it with the object
}