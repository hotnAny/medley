//	........................................................................................................
//
//  three js extensions, v0.0
//
//  by xiangchen@acm.org, 03/2017
//
//	........................................................................................................

//
//  highlight a face by adding a triangle covering it
//
//  XXX: wired is a variable for debugging
//
THREE.Geometry.prototype.highlightFace = function(face, color, scene, wired) {
    var v1 = this.vertices[face.a];
    var v2 = this.vertices[face.b];
    var v3 = this.vertices[face.c];

    var vs = [v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z];
    var fs = new THREE.Face3(0, 1, 2);

    var geometry = new THREE.Geometry(); //PolyhedronGeometry(vs, fs, 1, 1);
    geometry.vertices.push(v1);
    geometry.vertices.push(v2);
    geometry.vertices.push(v3);
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    var material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        wireframe: wired || false
    });
    var triangle = new THREE.Mesh(geometry, material);
    triangle.material.side = THREE.DoubleSide;

    scene.add(triangle);

    return triangle;
}

//
//  compute faces' centroids
//
THREE.Geometry.prototype.computeCentroids = function() {
    for (var i = 0; i < this.faces.length; i++) {
        var face = this.faces[i];

        if (face.centroid != undefined) {
            continue;
        }

        var face = this.faces[i];
        var va = this.vertices[face.a].clone(); //.applyMatrix4(obj.matrixWorld);
        var vb = this.vertices[face.b].clone(); //.applyMatrix4(obj.matrixWorld);
        var vc = this.vertices[face.c].clone(); //.applyMatrix4(obj.matrixWorld);
        face.centroid = new THREE.Vector3().addVectors(va, vb).add(vc).divideScalar(3);
    }
}

THREE.Geometry.prototype.assignVerticesToFaces = function() {
    for (var i = 0; i < this.faces.length; i++) {
        var face = this.faces[i];

        if (face.vertices != undefined) {
            continue;
        }

        face.vertices = [];
        var vindices = [face.a, face.b, face.c];
        for (var j = 0; j < vindices.length; j++) {
            face.vertices.push(this.vertices[vindices[j]]);
        }
    }
}

//
//	creating a list of neighbours (edge sharing) for each triangle
//
//	known issues:
//	- each triangle should have exactly 3 neighbors. however, some have 4 due to triangle redundance; some //    have only 2 due to unmanifold structure
//  - assuming triangles
//
THREE.Geometry.prototype.createNeighborList = function(octree) {
    var eps = 1e-6;
    for (var i = 0; i < this.faces.length; i++) {
        var face = this.faces[i];

        // skip if this face's neighbor has been found
        face.neighbors = face.neighbors || [];
        if (face.neighbors.length >= 3) {
            continue;
        }

        if (face.centroid == undefined) {
            this.computeCentroids();
        }

        var ctr = face.centroid.clone();

        // use octree to filter close-by faces
        var elms = octree.search(ctr, 1);

        // find neighbors amongst this close-by set
        for (elm of elms) {
            face = elm.faces;

            face.neighbors = face.neighbors || [];
            if (face.neighbors.length >= 3) {
                continue;
            }

            var vlist = [face.a, face.b, face.c];

            for (var j = 0; j < elms.length; j++) {
                var ff = elms[j].faces; //.centroid.clone();

                var vlist2 = [ff.a, ff.b, ff.c];

                // skip the face itself
                if (Math.abs(face.a - ff.a) < eps && Math.abs(face.b == ff.b) < eps && Math.abs(face.c ==
                        ff.c) <
                    eps) {
                    continue;
                }

                // searching for pairs of vertices that correspond to the shared edge of neighboring triangles
                var numPairs = 0;
                for (var ii = 0; ii < vlist2.length; ii++) {
                    for (var jj = 0; jj < vlist.length; jj++) {
                        if (this.vertices[vlist2[ii]].distanceTo(
                                this.vertices[vlist[jj]]) < eps) {
                            numPairs++;
                            break;
                        }
                    }
                }

                // when there are two pairs of them, this is a neighbor that shares exactly one edge
                if (numPairs == 2) {
                    face.neighbors.push(ff);
                    ff.neighbors = ff.neighbors || [];
                    ff.neighbors.push(face);
                }
            }
        }
    }
}

//
//  on key or mouse events for this object
//
THREE.Mesh.prototype.on = function(cue, handler) {
    if (XAC._dispatchInputEvents == undefined) {
        console.error('requiring xac.input.js');
        return;
    }

    switch (cue) {
        case XAC.MOUSEDOWN:
            this.mousedowns = this.mousedowns || [];
            this.mousedowns.push(handler);
            break;
        case XAC.MOUSEMOVE:
            // TODO
            break;
        case XAC.MOUSEUP:
            // TODO
            break;
        default:
            if (typeof(cue) == 'string') {
                var key = cue.charCodeAt(0);
                this.keydowns = this.keydowns || {};
                this.keydowns[key] = handler;
            } else {
                // TODO: handle direct keycode
            }
            break;
    }
}

//
//  make this object selectable (or not),
//  optionally providing callback upon selection and de-selection
//
THREE.Mesh.prototype.selectable = function(flag, onSelected, onDeselected) {
    this._selectable = flag;
    this._onSelected = onSelected;
    this._onDeselected = onDeselected;
    this._selected = false;
    this._selectionLocked = false;
}
