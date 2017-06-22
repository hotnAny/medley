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

    // if (MEDLEY._matobjSelected.meshPath != undefined) {
    //     time();
    //     XAC.readFile(MEDLEY._matobjSelected.meshPath, function (data) {
    //         var stlLoader = new THREE.STLLoader();
    //         var geometry = stlLoader.parse(data);
    //         var object = new THREE.Mesh(geometry, XAC.MATERIALCONTRAST);
    //         if (object.geometry.isBufferGeometry)
    //             object.geometry = new THREE.Geometry().fromBufferGeometry(object.geometry);

    //         MEDLEY._matobjSelected.mesh = object;
    //         MEDLEY._matobjSelected.paxis = XAC.findPrincipalAxis(
    //             MEDLEY._matobjSelected.mesh.geometry.vertices);
    //         MEDLEY._matobjSelected.mesh.geometry.center();
    //         // XAC.scene.add(MEDLEY._matobjSelected.mesh);
    //         time('loaded embeddable mesh');
    //     });
    // }

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

    // var maxHeight = 5;
    // var bboxes = [];
    // var __insertBox = function (x0, x1, y0, y1, z0, z1, bboxes) {
    //     bboxes.push({
    //         min: {
    //             x: x0,
    //             y: y0,
    //             z: z0
    //         },
    //         max: {
    //             x: x1,
    //             y: y1,
    //             z: z1
    //         }
    //     });
    // }

    // MEDLEY._matobjs = [];
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
    // MEDLEY._matobjs.push(new MEDLEY.MatObj());
});

//
//  get ready for fabrication
//
MEDLEY.getFabReady = function (embeddable) {
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
            for (mesh of embeddable._meshes.children) {
                // var meshbsp = new ThreeBSP(mesh);
                if (cutoff == undefined) {
                    cutoff = new THREE.Mesh(gettg(mesh), material);
                } else {
                    cutoff.geometry.merge(gettg(mesh));
                }
            }
            MEDLEY.fixFaces(cutoff);
            break;
        default:
            break;
    }

    XAC.scene.remove(MEDLEY.everything);
    // var csgObject = new ThreeBSP(embeddable._object);
    // var csgEmbeddable = new ThreeBSP(cutoff);
    // csgObject = csgObject.subtract(csgEmbeddable);
    var meshReady = XAC.subtract(embeddable._object, cutoff);
    if (extra != undefined) {
        XAC.scene.remove(extra);
        // var csgExtra = new ThreeBSP(extra);
        // csgObject = csgObject.subtract(csgExtra);
        meshReady = XAC.subtract(meshReady, extra);
    }
    // meshReady = csgObject.toMesh(material);
    XAC.scene.add(meshReady);
    return meshReady;
}

XAC.tmpadd = function (mesh) {
    XAC._tempElements = XAC._tempElements || [];
    XAC._tempElements.push(mesh);
    XAC.scene.add(mesh);
}