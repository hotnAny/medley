var MEDLEY = MEDLEY || {};

var _fitInfo;

XAC._tempElements = [];

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
    // meshPath: 'embeddables/rod1.stl'
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
    XAC.on(XAC.ESC, function () {
        for (elm of XAC._tempElements) XAC.scene.remove(elm);
    });
    XAC.on('I', function () {
        var embeddable = MEDLEY.embeddables.last();
        MEDLEY.getInstructions(embeddable);

        for (selcted of XAC._selecteds) {
            MEDLEY.getInstructions(selcted.embeddable);
        }
    });
    XAC.on('S', function () {
        time();
        var meshReady; // = embeddable._object;
        for (selcted of XAC._selecteds) {
            if (selcted.embeddable == undefined) continue;
            meshReady = meshReady || selcted.embeddable._object;
            meshReady = MEDLEY.getFabReady(meshReady, selcted.embeddable);
        }
        time('merged all embeddable components');

        XAC.scene.remove(MEDLEY.everything);

        var stlStr = stlFromGeometry(meshReady.geometry);
        var blob = new Blob([stlStr], {
            type: 'text/plain'
        });

        MEDLEY.addToDownloadDropdown('object', blob, 'object.stl');
        saveAs(blob, 'embeddable.stl');
    });
    // hide embeddable
    XAC.on('H', function () {
        for (embeddable of MEDLEY.embeddables) {
            // var selected = XAC._selecteds.clone();
            // for (object of selected) {
            if (embeddable != undefined && !embeddable._removed) {
                // if (XAC.scene.children.indexOf(embeddable._meshes) >= 0)
                //     XAC.scene.remove(embeddable._meshes);
                // else XAC.scene.add(embeddable._meshes);
                embeddable._meshes.visible = !embeddable._meshes.visible;
            }

        }
    });
});

MEDLEY.addToDownloadDropdown = function (itemName, blob, fileName) {
    MEDLEY.downloadableInfo = MEDLEY.downloadableInfo || [];

    var downloadItem = $('<option value=' + MEDLEY.downloadableInfo.length + '>' + itemName + '</option>');
    MEDLEY.downloadableInfo.push({
        blob: blob,
        fileName: fileName
    });
    $('#ddlExports').append(downloadItem);
}

//
//  generate instrutions for cutting found material
//  -   counter is for keeping track of generated file
//
MEDLEY.getInstructions = function (embeddable, counter) {
    var instructions;
    var __get1dInstructions = function (embeddable) {
        var _length = 0;
        for (var i = 0; i < embeddable.points.length - 1; i++)
            _length += embeddable.points[i + 1].distanceTo(embeddable.points[i]);
        return {
            length: _length
        };
    };

    var __get2dInstructions = function (embeddable) {
        var _length = 0,
            _width = 0;
        var d = embeddable._mapDepth(embeddable._depthRatio);
        var pointPrev;
        for (var i = 0; i < embeddable.points0.length; i++) {
            var point = embeddable.points0[i].clone().multiplyScalar(1 - d)
                .add(embeddable.points1[i].clone().multiplyScalar(d));
            if (pointPrev != undefined) _length += point.distanceTo(pointPrev);
            pointPrev = point;
        }
        _width = embeddable._baseWidth + embeddable._widthRatio * embeddable._widthRange;
        return {
            width: _width,
            length: _length
        };
    };

    switch (embeddable._dim) {
        case 0:
            break;
        case 1:
            instructions = __get1dInstructions(embeddable);
            MEDLEY.showInfo('cut a length of ' + XAC.trim(instructions.length, 1) + ' mm.');
            break;
        case 2:
            instructions = __get2dInstructions(embeddable);
            MEDLEY.showInfo('cut a ' + XAC.trim(instructions.width, 1) +
                ' x ' + XAC.trim(instructions.length, 1) + ' piece.');
            break;
        case 3:
            if (embeddable._faces0 == undefined) {
                instructions = __get2dInstructions(embeddable);
                var thickness = 0;
                var t = embeddable._mapThickness(embeddable._thicknessRatio);
                for (var i = 0; i < embeddable.points0.length - 1; i++) {
                    var vrange = embeddable.points1[i].clone().sub(embeddable.points0[i]);
                    thickness += vrange.length() * t;
                }
                thickness /= embeddable.points0.length;
                MEDLEY.showInfo('cut a ' + XAC.trim(instructions.width, 1) +
                    ' x ' + XAC.trim(instructions.length, 1) +
                    ' x ' + XAC.trim(thickness, 1) + ' piece.');
            } else {
                var thickness = 0;
                var t = embeddable._mapThickness(embeddable._thicknessRatio);
                var cntr = 0;
                for (var i = 0; i < embeddable._faces0.length; i++) {
                    for (var j = 0; j < embeddable._faces0[i].length; j++) {
                        var vrange = embeddable._faces1[i][j].clone().sub(embeddable._faces0[i][j]);
                        thickness += vrange.length() * t;
                        cntr++;
                    }
                }
                thickness /= cntr;

                MEDLEY.showInfo('download the cutting/carving template and cut a piece of ' +
                    XAC.trim(thickness, 1) + ' mm thick.');

                var thicknessRatio = embeddable._thicknessRatio;
                embeddable._meshes = undefined;
                embeddable.setThickness(-0.1);
                var mergedMesh;
                var material = XAC.MATERIALNORMAL.clone();
                for (mesh of embeddable._meshes.children) {
                    if (mergedMesh == undefined) {
                        mergedMesh = new THREE.Mesh(gettg(mesh), material);
                    } else {
                        mergedMesh.geometry.merge(gettg(mesh));
                    }
                }
                MEDLEY.fixFaces(mergedMesh);
                var stlStr = stlFromGeometry(mergedMesh.geometry);
                var blob = new Blob([stlStr], {
                    type: 'text/plain'
                });
                // saveAs(blob, 'embeddable.stl');
                MEDLEY.addToDownloadDropdown('template_' + (counter + 1), blob,
                    'template_' + (counter + 1) + '.stl');
                embeddable._thicknessRatio = thicknessRatio;
            }
            break;
        default:
            break;
    }
}

//
//  get ready for fabrication
//
MEDLEY.getFabReady = function (object, embeddable) {
    // cutoff and extra are the ultimate 'things' that need to be removed from the object for insertion
    var cutoff, extra;
    var material = XAC.MATERIALNORMAL.clone();
    switch (embeddable._dim) {
        case 0:
            cutoff = embeddable._cutoff;
            break;
        case 1:
            cutoff = embeddable._extrudedSegments.m;
            extra = embeddable._extraSegments == undefined ? undefined : embeddable._extraSegments.m;
            break;
        case 2:
        case 3:
            cutoff = embeddable._cutoff;
            MEDLEY.fixFaces(cutoff);
            break;
        default:
            break;
    }

    // XAC.scene.remove(MEDLEY.everything);
    var meshReady = XAC.subtract(object, cutoff);
    if (extra != undefined) {
        XAC.scene.remove(extra);
        meshReady = XAC.subtract(meshReady, extra);
    }
    XAC.scene.add(meshReady);
    return meshReady;
}

XAC.tmpadd = function (mesh) {
    XAC._tempElements = XAC._tempElements || [];
    XAC._tempElements.push(mesh);
    XAC.scene.add(mesh);
}

// for (mesh of embeddable._meshes.children) {
//     // var meshbsp = new ThreeBSP(mesh);
//     if (cutoff == undefined) {
//         cutoff = new THREE.Mesh(gettg(mesh), material);
//     } else {
//         cutoff.geometry.merge(gettg(mesh));
//     }
// }